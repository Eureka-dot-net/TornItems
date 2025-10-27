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

// Track notifications sent to avoid spamming
// Key format: "discordId-factionId", Value: { timestamp, chainCurrent }
const notificationCache = new Map<string, { timestamp: number; chainCurrent: number }>();
const NOTIFICATION_COOLDOWN_MS = 60000; // 1 minute cooldown between notifications per user

// Track which user's API key was used last for each faction (for round-robin)
const lastUsedKeyIndex = new Map<number, number>();

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
        const lastIndex = lastUsedKeyIndex.get(factionId) || 0;
        const nextIndex = (lastIndex + 1) % users.length;
        const userToUse = users[nextIndex];
        
        // Update the index for next time
        lastUsedKeyIndex.set(factionId, nextIndex);
        
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
          for (const watch of watches) {
            if (timeout <= watch.secondsBeforeFail) {
              const cacheKey = `${watch.discordId}-${factionId}`;
              const lastNotification = notificationCache.get(cacheKey);
              
              // Check if we should send a notification:
              // 1. No previous notification, OR
              // 2. Chain current has changed (increased), meaning chain was extended, OR
              // 3. Cooldown period has expired (chain is still in danger, send periodic reminders)
              const cooldownExpired = lastNotification && (now - lastNotification.timestamp) >= NOTIFICATION_COOLDOWN_MS;
              const shouldNotify = !lastNotification || 
                                   lastNotification.chainCurrent !== chainData.current ||
                                   cooldownExpired;
              
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
              
              // Update notification cache with timestamp and chain current value
              notificationCache.set(cacheKey, { 
                timestamp: now, 
                chainCurrent: chainData.current 
              });
              
              logInfo('Sent chain timeout notification', {
                discordId: watch.discordId,
                factionId,
                timeout,
                threshold: watch.secondsBeforeFail,
                chainCurrent: chainData.current
              });
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
    
    // Clean up old notification cache entries (older than 5 minutes)
    const cleanupTime = now - 300000;
    for (const [key, value] of notificationCache.entries()) {
      if (value.timestamp < cleanupTime) {
        notificationCache.delete(key);
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
