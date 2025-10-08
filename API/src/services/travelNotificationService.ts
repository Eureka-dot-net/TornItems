import cron from 'node-cron';
import { TravelNotification } from '../models/TravelNotification';
import { DiscordUser } from '../models/DiscordUser';
import { TravelTime } from '../models/TravelTime';
import { fetchTravelStatus } from '../utils/tornApi';
import { decrypt } from '../utils/encryption';
import { sendDirectMessage } from '../utils/discord';
import { logInfo, logError } from '../utils/logger';

const COUNTRY_CODE_MAP: Record<string, string> = {
  mex: 'Mexico',
  can: 'Canada',
  haw: 'Hawaii',
  jap: 'Japan',
  chi: 'China',
  arg: 'Argentina',
  uni: 'United Kingdom',
  uae: 'UAE',
  sou: 'South Africa',
  cay: 'Cayman Islands',
  swi: 'Switzerland',
};

/**
 * Monitor travel notifications and send alerts when it's time to board
 */
async function checkTravelNotifications() {
  try {
    const now = new Date();
    
    // Find all enabled travel notifications
    const notifications = await TravelNotification.find({ enabled: true }).lean();
    
    for (const notification of notifications) {
      try {
        // Get user and travel time data
        const user = await DiscordUser.findOne({ discordId: notification.discordUserId });
        if (!user) continue;

        const travelTime = await TravelTime.findOne({ countryCode: notification.countryCode });
        if (!travelTime) continue;

        // Calculate actual travel time with private island reduction
        const actualTravelTimeMinutes = notification.hasPrivateIsland 
          ? Math.round(travelTime.travelTimeMinutes * 0.70) 
          : Math.round(travelTime.travelTimeMinutes);

        // Calculate when user would land if they board now
        const landingTimeIfBoardNow = new Date(now.getTime() + actualTravelTimeMinutes * 60 * 1000);
        
        // Find next 15-minute slot after landing
        const nextSlotMinutes = Math.ceil(landingTimeIfBoardNow.getMinutes() / 15) * 15;
        const nextSlot = new Date(landingTimeIfBoardNow);
        nextSlot.setMinutes(nextSlotMinutes, 0, 0);
        
        // If we've gone to the next hour, adjust
        if (nextSlotMinutes >= 60) {
          nextSlot.setHours(nextSlot.getHours() + 1);
          nextSlot.setMinutes(0, 0, 0);
        }

        // Calculate when to board
        const boardingTime = new Date(nextSlot.getTime() - actualTravelTimeMinutes * 60 * 1000);
        
        // Calculate notification times
        const notifyBeforeTime = new Date(boardingTime.getTime() - notification.notifyBeforeSeconds * 1000);
        const notifyOnDotTime = boardingTime;
        
        // Check if we should send the "before" notification
        const timeDiffBefore = notifyBeforeTime.getTime() - now.getTime();
        const shouldNotifyBefore = timeDiffBefore > -5000 && timeDiffBefore <= 5000; // Within 5 second window
        
        // Check if we should send the "on the dot" notification
        const timeDiffOnDot = notifyOnDotTime.getTime() - now.getTime();
        const shouldNotifyOnDot = timeDiffOnDot > -5000 && timeDiffOnDot <= 5000; // Within 5 second window
        
        if (shouldNotifyBefore || shouldNotifyOnDot) {
          // Check if we already sent a notification recently (within last 30 seconds)
          if (notification.lastNotificationSent) {
            const timeSinceLastNotification = now.getTime() - new Date(notification.lastNotificationSent).getTime();
            if (timeSinceLastNotification < 30000) {
              continue; // Skip to avoid duplicate notifications
            }
          }

          const countryName = COUNTRY_CODE_MAP[notification.countryCode] || notification.countryCode;
          let message = '';
          
          if (shouldNotifyBefore) {
            message = `🛫 **Travel Alert - ${notification.notifyBeforeSeconds}s Warning**\n\n` +
              `Prepare to board for **${countryName}**!\n` +
              `Board in **${notification.notifyBeforeSeconds} seconds** to land at ${nextSlot.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}\n\n` +
              `Travel Time: ${actualTravelTimeMinutes} minutes\n` +
              `Landing Slot: ${nextSlot.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
          } else {
            message = `🛫 **Travel Alert - BOARD NOW!**\n\n` +
              `**Board now for ${countryName}!**\n` +
              `You will land at ${nextSlot.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })} (next 15-min restock slot)\n\n` +
              `Travel Time: ${actualTravelTimeMinutes} minutes\n` +
              `Landing Slot: ${nextSlot.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}\n\n` +
              `https://www.torn.com/page.php?sid=travel&destination=${notification.countryCode}`;
          }
          
          // Send DM to user
          await sendDirectMessage(notification.discordUserId, message);
          
          // Update last notification sent time
          await TravelNotification.updateOne(
            { _id: notification._id },
            { 
              lastNotificationSent: now,
              scheduledDepartureTime: boardingTime,
              scheduledArrivalTime: nextSlot,
            }
          );
          
          logInfo('Sent travel notification', {
            discordUserId: notification.discordUserId,
            country: countryName,
            boardingTime: boardingTime.toISOString(),
            arrivalTime: nextSlot.toISOString(),
            notificationType: shouldNotifyBefore ? 'before' : 'on-dot',
          });
        }
      } catch (error) {
        logError('Error processing travel notification', error instanceof Error ? error : new Error(String(error)), {
          notificationId: notification._id,
          discordUserId: notification.discordUserId,
        });
      }
    }

    // Check for users who should have arrived and send them the shop URL
    await checkArrivals();
  } catch (error) {
    logError('Error in travel notification check', error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Check if users have arrived at their destination and send them shop URLs
 */
async function checkArrivals() {
  try {
    const now = new Date();
    
    // Find notifications where scheduled arrival time has passed
    const arrivedNotifications = await TravelNotification.find({
      enabled: true,
      scheduledArrivalTime: { $ne: null, $lte: new Date(now.getTime() + 60000) }, // Within 1 minute of arrival
      lastNotificationSent: { $ne: null },
    }).lean();
    
    for (const notification of arrivedNotifications) {
      try {
        // Only check arrivals if we have watch items
        if (!notification.watchItems || notification.watchItems.length === 0) {
          continue;
        }

        // Get user to fetch their API key
        const user = await DiscordUser.findOne({ discordId: notification.discordUserId });
        if (!user) continue;

        // Decrypt API key and check travel status
        const apiKey = decrypt(user.apiKey);
        const travelStatus = await fetchTravelStatus(apiKey);
        
        if (travelStatus && travelStatus.destination) {
          // User is travelling
          const arrivalTimestamp = travelStatus.arrival_at;
          const timeLeft = travelStatus.time_left;
          
          // If they're arriving within 1 minute, send the shop URL
          if (timeLeft <= 60) {
            const countryName = COUNTRY_CODE_MAP[notification.countryCode] || notification.countryCode;
            
            // Build the shop URL with watch items
            const itemParams = notification.watchItems
              .slice(0, 3)
              .map((itemId, index) => `item${index + 1}=${itemId}`)
              .join('&');
            
            const shopUrl = `https://www.torn.com/page.php?sid=travel&${itemParams}&amount=${notification.itemsToBuy}&arrival=${arrivalTimestamp}`;
            
            const message = `✈️ **Arriving in ${countryName}!**\n\n` +
              `You're about to land! Here's your shop URL:\n\n` +
              `${shopUrl}\n\n` +
              `Watch Items: ${notification.watchItems.join(', ')}\n` +
              `Items to Buy: ${notification.itemsToBuy}`;
            
            await sendDirectMessage(notification.discordUserId, message);
            
            // Clear scheduled times to avoid duplicate messages
            await TravelNotification.updateOne(
              { _id: notification._id },
              { 
                scheduledDepartureTime: null,
                scheduledArrivalTime: null,
              }
            );
            
            logInfo('Sent arrival shop URL', {
              discordUserId: notification.discordUserId,
              country: countryName,
              watchItems: notification.watchItems,
            });
          }
        } else {
          // User is not travelling anymore
          // Check if they recently arrived (within 2 minutes of scheduled arrival)
          if (notification.scheduledArrivalTime) {
            const timeSinceScheduledArrival = now.getTime() - new Date(notification.scheduledArrivalTime).getTime();
            
            if (timeSinceScheduledArrival > 0 && timeSinceScheduledArrival <= 120000) {
              // They should have arrived within the last 2 minutes
              // Get current timestamp for arrival parameter
              const arrivalTimestamp = Math.floor(now.getTime() / 1000);
              
              const countryName = COUNTRY_CODE_MAP[notification.countryCode] || notification.countryCode;
              
              // Build the shop URL with watch items
              const itemParams = notification.watchItems
                .slice(0, 3)
                .map((itemId, index) => `item${index + 1}=${itemId}`)
                .join('&');
              
              const shopUrl = `https://www.torn.com/page.php?sid=travel&${itemParams}&amount=${notification.itemsToBuy}&arrival=${arrivalTimestamp}`;
              
              const message = `✈️ **Welcome to ${countryName}!**\n\n` +
                `You've arrived! Here's your shop URL:\n\n` +
                `${shopUrl}\n\n` +
                `Watch Items: ${notification.watchItems.join(', ')}\n` +
                `Items to Buy: ${notification.itemsToBuy}`;
              
              await sendDirectMessage(notification.discordUserId, message);
              
              // Clear scheduled times
              await TravelNotification.updateOne(
                { _id: notification._id },
                { 
                  scheduledDepartureTime: null,
                  scheduledArrivalTime: null,
                }
              );
              
              logInfo('Sent arrival shop URL (post-arrival)', {
                discordUserId: notification.discordUserId,
                country: countryName,
                watchItems: notification.watchItems,
              });
            } else if (timeSinceScheduledArrival > 120000) {
              // Clear old scheduled times if more than 2 minutes have passed
              await TravelNotification.updateOne(
                { _id: notification._id },
                { 
                  scheduledDepartureTime: null,
                  scheduledArrivalTime: null,
                }
              );
            }
          }
        }
      } catch (error) {
        logError('Error checking arrival for notification', error instanceof Error ? error : new Error(String(error)), {
          notificationId: notification._id,
          discordUserId: notification.discordUserId,
        });
      }
    }
  } catch (error) {
    logError('Error checking arrivals', error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Start the travel notification monitoring service
 */
export function startTravelNotificationService() {
  logInfo('Starting travel notification service...');
  
  // Run every 10 seconds to check for notifications
  cron.schedule('*/10 * * * * *', () => {
    checkTravelNotifications().catch((error) => {
      logError('Error in travel notification service', error instanceof Error ? error : new Error(String(error)));
    });
  });
  
  logInfo('Travel notification service started (checking every 10 seconds)');
}
