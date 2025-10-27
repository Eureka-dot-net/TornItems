import cron from 'node-cron';
import { ChainWatch } from '../models/ChainWatch';
import { DiscordUser } from '../models/DiscordUser';
import { decrypt } from '../utils/encryption';
import { sendDiscordChannelAlert } from '../utils/discord';
import { logInfo, logError } from '../utils/logger';
import { logApiCall } from '../utils/apiCallLogger';
import axios from 'axios';

// Response format for faction chain API
interface FactionChainResponse {
  chain?: {
    id: number;
    current: number;
    max: number;
    timeout: number;
    modifier: number;
    cooldown: number;
    start: number;
    end: number;
  } | null;
  error?: {
    code: number;
    error: string;
  };
}

// Track next check time per faction for smart API call optimization
// Key: factionId, Value: timestamp when we should next check this faction
const nextCheckTime = new Map<number, number>();

/**
 * Monitor faction chains and send notifications when timeout is low
 */
async function checkChainWatches() {
  try {
    const now = Date.now();
    
    // Find all enabled chain watches
    const chainWatches = await ChainWatch.find({ enabled: true }).lean();
    
    if (chainWatches.length === 0) {
      return;
    }
    
    // Group chain watches by faction to minimize API calls
    const factionWatches = new Map<number, typeof chainWatches>();
    for (const watch of chainWatches) {
      const existing = factionWatches.get(watch.factionId) || [];
      existing.push(watch);
      factionWatches.set(watch.factionId, existing);
    }
    
    // Process each faction
    for (const [factionId, watches] of factionWatches.entries()) {
      try {
        // Check if we should skip this faction based on smart scheduling
        const scheduledCheckTime = nextCheckTime.get(factionId);
        if (scheduledCheckTime && now < scheduledCheckTime) {
          // Not time to check this faction yet
          continue;
        }
        
        // Get users who have chain watches enabled in this faction
        const userIds = watches.map(w => w.discordId);
        const users = await DiscordUser.find({ 
          discordId: { $in: userIds },
          factionId: factionId 
        }).lean();
        
        if (users.length === 0) {
          logError('No users found for faction chain watch', new Error('No users'), { factionId });
          continue;
        }
        
        // Find the minimum (most aggressive) threshold among all watchers
        const minThreshold = Math.min(...watches.map(w => w.secondsBeforeFail));
        
        // Round-robin: Get the next user's API key to use
        // Get lastUsedKeyIndex from any watch in this faction (they should all have the same value)
        const lastIndex = watches[0].lastUsedKeyIndex || 0;
        const nextIndex = (lastIndex + 1) % users.length;
        const userToUse = users[nextIndex];
        
        // Update the index for all watches in this faction
        await ChainWatch.updateMany(
          { factionId },
          { lastUsedKeyIndex: nextIndex }
        );
        
        // Fetch chain data using this user's API key
        let chainData: FactionChainResponse['chain'] = null;
        
        try {
          const apiKey = decrypt(userToUse.apiKey);
          const response = await axios.get<FactionChainResponse>(
            `https://api.torn.com/v2/faction/chain?key=${apiKey}`
          );
          
          await logApiCall('faction/chain', 'chain-watch-service');
          
          if (response.data.error) {
            logError('Torn API error for faction chain', new Error(response.data.error.error), { 
              factionId,
              errorCode: response.data.error.code,
              tornId: userToUse.tornId
            });
            continue; // Skip this faction this cycle
          }
          
          chainData = response.data.chain || null;
        } catch (error: any) {
          logError('Failed to fetch faction chain', error instanceof Error ? error : new Error(String(error)), {
            factionId,
            tornId: userToUse.tornId
          });
          continue; // Skip this faction this cycle
        }
        
        // Check if chain is active and timeout is low
        if (chainData && chainData.timeout > 0) {
          const timeout = chainData.timeout;
          
          // Calculate next check time based on current timeout and minimum threshold
          // If timeout is well above the threshold, we don't need to check every 5 seconds
          // Formula: if timeout > minThreshold, check when timeout gets close to minThreshold
          // Add a 10-second buffer to ensure we don't miss the threshold
          const bufferSeconds = 10;
          if (timeout > minThreshold + bufferSeconds) {
            // Schedule next check for when timeout will be close to threshold
            const secondsUntilCheck = timeout - minThreshold - bufferSeconds;
            const nextCheck = now + (secondsUntilCheck * 1000);
            nextCheckTime.set(factionId, nextCheck);
            
            logInfo('Scheduled next chain check', {
              factionId,
              currentTimeout: timeout,
              minThreshold,
              secondsUntilNextCheck: secondsUntilCheck
            });
          } else {
            // We're in the danger zone, check every cycle
            nextCheckTime.delete(factionId);
          }
          
          // Notify users whose threshold is above current timeout
          const notifiedDiscordIds: string[] = [];
          for (const watch of watches) {
            if (timeout <= watch.secondsBeforeFail) {
              // Check if we should send a notification:
              // 1. No previous notification, OR
              // 2. Chain current has changed (increased), meaning chain was extended
              const shouldNotify = !watch.lastNotificationTimestamp || 
                                   watch.lastNotificationChainCurrent !== chainData.current;
              
              if (!shouldNotify) {
                // Already notified for this chain current value
                continue;
              }
              
              // Send notification
              const message = `⚠️ **Chain Timeout Warning** (<@${watch.discordId}>)\n\n` +
                `🔗 **Chain:** ${chainData.current} / ${chainData.max}\n` +
                `⏱️ **Timeout:** ${timeout} seconds remaining\n` +
                `📊 **Modifier:** ${chainData.modifier.toFixed(2)}x\n\n` +
                `Someone needs to attack to keep the chain alive!`;
              
              await sendDiscordChannelAlert(watch.channelId, message);
              
              // Track which users were notified for batch update
              notifiedDiscordIds.push(watch.discordId);
              
              logInfo('Sent chain timeout notification', {
                discordId: watch.discordId,
                factionId,
                timeout,
                threshold: watch.secondsBeforeFail,
                chainCurrent: chainData.current
              });
            }
          }
          
          // Batch update notification tracking for all notified users
          if (notifiedDiscordIds.length > 0) {
            try {
              await ChainWatch.updateMany(
                { discordId: { $in: notifiedDiscordIds } },
                { 
                  lastNotificationTimestamp: now, 
                  lastNotificationChainCurrent: chainData.current 
                }
              );
            } catch (updateError) {
              logError('Failed to update notification tracking', updateError instanceof Error ? updateError : new Error(String(updateError)), {
                factionId,
                notifiedCount: notifiedDiscordIds.length
              });
              // Continue processing - notification tracking failure shouldn't stop the service
            }
          }
        } else {
          // Chain is not active or timeout is 0, clear any scheduled check
          nextCheckTime.delete(factionId);
        }
      } catch (error) {
        logError('Error processing faction chain watches', error instanceof Error ? error : new Error(String(error)), {
          factionId
        });
      }
    }
  } catch (error) {
    logError('Error in chain watch check', error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Start the chain watch monitoring service
 */
export function startChainWatchService() {
  logInfo('Starting chain watch service...');
  
  // Run every 5 seconds to check chain timeouts
  cron.schedule('*/5 * * * * *', () => {
    checkChainWatches().catch(error => {
      logError('Unhandled error in chain watch service', error instanceof Error ? error : new Error(String(error)));
    });
  });
  
  logInfo('Chain watch service started successfully');
}
