import cron from 'node-cron';
import { TravelNotification } from '../models/TravelNotification';
import { DiscordUser } from '../models/DiscordUser';
import { fetchTravelStatus } from '../utils/tornApi';
import { decrypt } from '../utils/encryption';
import { sendDirectMessageWithFallback } from '../utils/discord';
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
 * Monitor travel notifications and send alerts at scheduled times
 */
async function checkTravelNotifications() {
  try {
    const now = new Date();
    const fallbackChannelId = process.env.DISCORD_TRAVEL_CHANNEL_ID;
    
    // Find all enabled travel notifications that haven't been sent yet
    const notifications = await TravelNotification.find({ 
      enabled: true,
      notificationsSent: false,
      scheduledBoardingTime: { $ne: null }
    }).lean();
    
    for (const notification of notifications) {
      try {
        const scheduledNotifyBeforeTime = notification.scheduledNotifyBeforeTime ? new Date(notification.scheduledNotifyBeforeTime) : null;
        const scheduledNotifyBeforeTime2 = notification.scheduledNotifyBeforeTime2 ? new Date(notification.scheduledNotifyBeforeTime2) : null;
        const scheduledBoardingTime = notification.scheduledBoardingTime ? new Date(notification.scheduledBoardingTime) : null;
        
        if (!scheduledBoardingTime) continue;
        
        const countryName = COUNTRY_CODE_MAP[notification.countryCode] || notification.countryCode;
        
        // Check if we should send the first "before" notification
        if (scheduledNotifyBeforeTime && now >= scheduledNotifyBeforeTime && now < scheduledBoardingTime) {
          const message = `🛫 **Travel Alert - ${notification.notifyBeforeSeconds}s Warning**\n\n` +
            `Prepare to board for **${countryName}**!\n` +
            `Board in **${notification.notifyBeforeSeconds} seconds** to land at <t:${notification.scheduledArrivalTime ? Math.floor(new Date(notification.scheduledArrivalTime).getTime() / 1000) : 0}:t>`;
          
          await sendDirectMessageWithFallback(notification.discordUserId, message, fallbackChannelId);
          
          logInfo('Sent travel warning notification', {
            discordUserId: notification.discordUserId,
            country: countryName,
            notifyBeforeSeconds: notification.notifyBeforeSeconds,
          });
        }
        
        // Check if we should send the second "before" notification
        if (scheduledNotifyBeforeTime2 && now >= scheduledNotifyBeforeTime2 && now < scheduledBoardingTime && !notification.notificationsSent2) {
          const message = `🛫 **Travel Alert - ${notification.notifyBeforeSeconds2}s Warning**\n\n` +
            `Prepare to board for **${countryName}**!\n` +
            `Board in **${notification.notifyBeforeSeconds2} seconds** to land at <t:${notification.scheduledArrivalTime ? Math.floor(new Date(notification.scheduledArrivalTime).getTime() / 1000) : 0}:t>`;
          
          await sendDirectMessageWithFallback(notification.discordUserId, message, fallbackChannelId);
          
          // Mark second notification as sent
          await TravelNotification.updateOne(
            { _id: notification._id },
            { notificationsSent2: true }
          );
          
          logInfo('Sent second travel warning notification', {
            discordUserId: notification.discordUserId,
            country: countryName,
            notifyBeforeSeconds2: notification.notifyBeforeSeconds2,
          });
        }
        
        // Check if we should send the "board now" notification
        // Only send if there's no second notification time set
        if (now >= scheduledBoardingTime && notification.notifyBeforeSeconds2 == null) {
          const message = `🛫 **Travel Alert - BOARD NOW!**\n\n` +
            `**Board now for ${countryName}!**\n` +
            `You will land at <t:${notification.scheduledArrivalTime ? Math.floor(new Date(notification.scheduledArrivalTime).getTime() / 1000) : 0}:t> (next 15-min restock slot)\n\n` +
            `https://www.torn.com/page.php?sid=travel&destination=${notification.countryCode}`;
          
          await sendDirectMessageWithFallback(notification.discordUserId, message, fallbackChannelId);
          
          // Mark notifications as sent
          await TravelNotification.updateOne(
            { _id: notification._id },
            { notificationsSent: true }
          );
          
          logInfo('Sent travel boarding notification', {
            discordUserId: notification.discordUserId,
            country: countryName,
            boardingTime: scheduledBoardingTime.toISOString(),
          });
        } else if (now >= scheduledBoardingTime && notification.notifyBeforeSeconds2 != null) {
          // If there's a second notification time, just mark as sent without sending boarding notification
          await TravelNotification.updateOne(
            { _id: notification._id },
            { notificationsSent: true }
          );
          
          logInfo('Marked travel notification as sent (skipped boarding notification due to second warning)', {
            discordUserId: notification.discordUserId,
            country: countryName,
          });
        }
      } catch (error) {
        logError('Error processing travel notification', error instanceof Error ? error : new Error(String(error)), {
          notificationId: notification._id,
          discordUserId: notification.discordUserId,
        });
      }
    }

    // Check for users who just started travelling and send them shop URLs
    await checkTravelStart();
  } catch (error) {
    logError('Error in travel notification check', error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Check if users just started travelling and send them shop URLs
 */
async function checkTravelStart() {
  try {
    const now = new Date();
    const fallbackChannelId = process.env.DISCORD_TRAVEL_CHANNEL_ID;
    
    // Find notifications that have been sent and boarding time has passed
    // Only check 1-5 minutes AFTER boarding time to give user time to actually start traveling
    // AND shop URL hasn't been sent yet
    const sentNotifications = await TravelNotification.find({
      enabled: true,
      notificationsSent: true,
      shopUrlSent: false, // Only check notifications where shop URL hasn't been sent
      scheduledBoardingTime: { 
        $ne: null,
        $gte: new Date(now.getTime() - 5 * 60 * 1000), // Within last 5 minutes
        $lte: new Date(now.getTime() - 60 * 1000) // At least 1 minute ago (so user has time to board)
      },
    }).lean();
    
    for (const notification of sentNotifications) {
      try {
        // Only send shop URLs if we have watch items
        if (!notification.watchItems || notification.watchItems.length === 0) {
          // Clear scheduled times since no shop URL needed, and mark as sent
          await TravelNotification.updateOne(
            { _id: notification._id },
            { 
              scheduledNotifyBeforeTime: null,
              scheduledNotifyBeforeTime2: null,
              scheduledBoardingTime: null,
              scheduledArrivalTime: null,
              shopUrlSent: true, // Mark as sent even though we didn't send (to prevent rechecking)
            }
          );
          continue;
        }

        // Get user to fetch their API key and itemsToBuy
        const user = await DiscordUser.findOne({ discordId: notification.discordUserId });
        if (!user) continue;

        // Decrypt API key and check travel status
        const apiKey = decrypt(user.apiKey);
        const travelStatus = await fetchTravelStatus(apiKey);
        
        if (travelStatus && travelStatus.destination) {
          // Check if the user is travelling to the destination we have an alert for
          // The API returns the full country name (e.g., "Mexico", "Canada")
          // We need to verify it matches our notification's country code
          const expectedCountryName = COUNTRY_CODE_MAP[notification.countryCode] || notification.countryCode;
          
          // Check if destination matches AND is not "Torn" (which means travelling back home)
          if (travelStatus.destination === expectedCountryName && travelStatus.destination !== 'Torn') {
            // User is travelling to the correct destination - send shop URL with actual arrival time from Torn API
            const arrivalTimestamp = travelStatus.arrival_at;
            const countryName = expectedCountryName;
            
            // Build the shop URL with watch items
            const itemParams = notification.watchItems
              .slice(0, 3)
              .map((itemId: number, index: number) => `item${index + 1}=${itemId}`)
              .join('&');
            
            const shopUrl = `https://www.torn.com/page.php?sid=travel&${itemParams}&amount=${user.itemsToBuy}&arrival=${arrivalTimestamp}`;
            
            const message = `✈️ **Travelling to ${countryName}!**\n\n` +
              `Here's your shop URL:\n\n` +
              `${shopUrl}\n\n` +
              `📍 Arrival: <t:${arrivalTimestamp}:t> (<t:${arrivalTimestamp}:R>)\n` +
              `👁️ Watch Items: ${notification.watchItems.join(', ')}\n` +
              `📦 Items to Buy: ${user.itemsToBuy}`;
            
            await sendDirectMessageWithFallback(notification.discordUserId, message, fallbackChannelId);
            
            // Clear scheduled times and mark shop URL as sent to avoid duplicate messages
            await TravelNotification.updateOne(
              { _id: notification._id },
              { 
                scheduledNotifyBeforeTime: null,
                scheduledNotifyBeforeTime2: null,
                scheduledBoardingTime: null,
                scheduledArrivalTime: null,
                shopUrlSent: true,
              }
            );
            
            logInfo('Sent travel shop URL with actual arrival time from Torn API', {
              discordUserId: notification.discordUserId,
              country: countryName,
              watchItems: notification.watchItems,
              arrivalTime: new Date(arrivalTimestamp * 1000).toISOString(),
              destination: travelStatus.destination,
            });
          } else {
            // User is travelling but NOT to the destination we have an alert for
            logInfo('User is travelling but not to the expected destination', {
              discordUserId: notification.discordUserId,
              expectedCountry: expectedCountryName,
              actualDestination: travelStatus.destination,
            });
          }
        } else {
          // User is not travelling yet - log and continue checking
          logInfo('User not travelling yet, will check again', {
            discordUserId: notification.discordUserId,
            country: COUNTRY_CODE_MAP[notification.countryCode] || notification.countryCode,
          });
        }
      } catch (error) {
        logError('Error checking travel start for notification', error instanceof Error ? error : new Error(String(error)), {
          notificationId: notification._id,
          discordUserId: notification.discordUserId,
        });
      }
    }
  } catch (error) {
    logError('Error checking travel starts', error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Start the travel notification monitoring service
 */
export function startTravelNotificationService() {
  logInfo('Starting travel notification service...');
  
  // Run every 5 seconds for more precise timing
  cron.schedule('*/5 * * * * *', () => {
    checkTravelNotifications().catch((error) => {
      logError('Error in travel notification service', error instanceof Error ? error : new Error(String(error)));
    });
  });
  
  logInfo('Travel notification service started (checking every 5 seconds)');
}
