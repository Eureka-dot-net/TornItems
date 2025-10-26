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
const notificationCache = new Map<string, number>();
const NOTIFICATION_COOLDOWN_MS = 60000; // 1 minute cooldown between notifications per user

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
        // Get ALL users in this faction (not just those with chain watches)
        // This allows us to rotate through all faction members' API keys
        const users = await DiscordUser.find({ 
          factionId: factionId 
        }).lean();
        
        if (users.length === 0) {
          logError('No users found for faction chain watch', new Error('No users'), { factionId });
          continue;
        }
        
        // Round-robin through API keys to distribute load
        let chainData: FactionChainResponse['chain'] = null;
        let apiSuccess = false;
        
        for (const user of users) {
          try {
            const apiKey = decrypt(user.apiKey);
            const response = await axios.get<FactionChainResponse>(
              `https://api.torn.com/v2/faction/chain?key=${apiKey}`
            );
            
            await logApiCall('faction/chain', 'chain-watch-service');
            
            if (response.data.error) {
              logError('Torn API error for faction chain', new Error(response.data.error.error), { 
                factionId,
                errorCode: response.data.error.code 
              });
              continue; // Try next API key
            }
            
            chainData = response.data.chain || null;
            apiSuccess = true;
            break; // Successfully got data, stop trying other keys
          } catch (error: any) {
            logError('Failed to fetch faction chain', error instanceof Error ? error : new Error(String(error)), {
              factionId,
              tornId: user.tornId
            });
            // Continue to next API key
          }
        }
        
        if (!apiSuccess) {
          logError('Failed to fetch chain data for faction', new Error('All API calls failed'), { factionId });
          continue;
        }
        
        // Check if chain is active and timeout is low
        if (chainData && chainData.timeout > 0) {
          const timeout = chainData.timeout;
          
          // Notify users whose threshold is above current timeout
          for (const watch of watches) {
            if (timeout <= watch.secondsBeforeFail) {
              // Check notification cooldown
              const cacheKey = `${watch.discordId}-${factionId}`;
              const lastNotification = notificationCache.get(cacheKey);
              
              if (lastNotification && (now - lastNotification) < NOTIFICATION_COOLDOWN_MS) {
                // Skip notification due to cooldown
                continue;
              }
              
              // Send notification
              const message = `⚠️ **Chain Timeout Warning** (<@${watch.discordId}>)\n\n` +
                `🔗 **Chain:** ${chainData.current} / ${chainData.max}\n` +
                `⏱️ **Timeout:** ${timeout} seconds remaining\n` +
                `📊 **Modifier:** ${chainData.modifier.toFixed(2)}x\n\n` +
                `Someone needs to attack to keep the chain alive!`;
              
              await sendDiscordChannelAlert(watch.channelId, message);
              
              // Update notification cache
              notificationCache.set(cacheKey, now);
              
              logInfo('Sent chain timeout notification', {
                discordId: watch.discordId,
                factionId,
                timeout,
                threshold: watch.secondsBeforeFail,
                chainCurrent: chainData.current
              });
            }
          }
        }
      } catch (error) {
        logError('Error processing faction chain watches', error instanceof Error ? error : new Error(String(error)), {
          factionId
        });
      }
    }
    
    // Clean up old notification cache entries (older than 5 minutes)
    const cleanupTime = now - 300000;
    for (const [key, timestamp] of notificationCache.entries()) {
      if (timestamp < cleanupTime) {
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
  
  // Run every 10 seconds to check chain timeouts
  cron.schedule('*/10 * * * * *', () => {
    checkChainWatches().catch(error => {
      logError('Unhandled error in chain watch service', error instanceof Error ? error : new Error(String(error)));
    });
  });
  
  logInfo('Chain watch service started successfully');
}
