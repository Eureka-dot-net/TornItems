import cron from 'node-cron';
import { TravelNotification } from '../models/TravelNotification';
import { DiscordUser } from '../models/DiscordUser';
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
 * Monitor travel notifications and send alerts at scheduled times
 */
async function checkTravelNotifications() {
  try {
    const now = new Date();
    
    // Find all enabled travel notifications that haven't been sent yet
    const notifications = await TravelNotification.find({ 
      enabled: true,
      notificationsSent: false,
      scheduledBoardingTime: { $ne: null }
    }).lean();
    
    for (const notification of notifications) {
      try {
        const scheduledNotifyBeforeTime = notification.scheduledNotifyBeforeTime ? new Date(notification.scheduledNotifyBeforeTime) : null;
        const scheduledBoardingTime = notification.scheduledBoardingTime ? new Date(notification.scheduledBoardingTime) : null;
        
        if (!scheduledBoardingTime) continue;
        
        const countryName = COUNTRY_CODE_MAP[notification.countryCode] || notification.countryCode;
        
        // Check if we should send the "before" notification
        if (scheduledNotifyBeforeTime && now >= scheduledNotifyBeforeTime && now < scheduledBoardingTime) {
          const message = `🛫 **Travel Alert - ${notification.notifyBeforeSeconds}s Warning**\n\n` +
            `Prepare to board for **${countryName}**!\n` +
            `Board in **${notification.notifyBeforeSeconds} seconds** to land at ${notification.scheduledArrivalTime ? new Date(notification.scheduledArrivalTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'scheduled time'}`;
          
          await sendDirectMessage(notification.discordUserId, message);
          
          logInfo('Sent travel warning notification', {
            discordUserId: notification.discordUserId,
            country: countryName,
            notifyBeforeSeconds: notification.notifyBeforeSeconds,
          });
        }
        
        // Check if we should send the "board now" notification
        if (now >= scheduledBoardingTime) {
          const message = `🛫 **Travel Alert - BOARD NOW!**\n\n` +
            `**Board now for ${countryName}!**\n` +
            `You will land at ${notification.scheduledArrivalTime ? new Date(notification.scheduledArrivalTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'scheduled time'} (next 15-min restock slot)\n\n` +
            `https://www.torn.com/page.php?sid=travel&destination=${notification.countryCode}`;
          
          await sendDirectMessage(notification.discordUserId, message);
          
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
    
    // Find notifications that have been sent but haven't received shop URL yet
    // Check within 1 minute after boarding time (in case user starts late)
    const sentNotifications = await TravelNotification.find({
      enabled: true,
      notificationsSent: true,
      scheduledBoardingTime: { 
        $ne: null,
        $gte: new Date(now.getTime() - 5 * 60 * 1000), 
        $lte: new Date(now.getTime() + 60 * 1000) // Wait up to 1 minute after boarding time
      },
    }).lean();
    
    for (const notification of sentNotifications) {
      try {
        // Only send shop URLs if we have watch items
        if (!notification.watchItems || notification.watchItems.length === 0) {
          // Clear scheduled times since no shop URL needed
          await TravelNotification.updateOne(
            { _id: notification._id },
            { 
              scheduledNotifyBeforeTime: null,
              scheduledBoardingTime: null,
              scheduledArrivalTime: null,
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
          // User is travelling - send shop URL
          const arrivalTimestamp = travelStatus.arrival_at;
          const countryName = COUNTRY_CODE_MAP[notification.countryCode] || notification.countryCode;
          
          // Build the shop URL with watch items
          const itemParams = notification.watchItems
            .slice(0, 3)
            .map((itemId, index) => `item${index + 1}=${itemId}`)
            .join('&');
          
          const shopUrl = `https://www.torn.com/page.php?sid=travel&${itemParams}&amount=${user.itemsToBuy}&arrival=${arrivalTimestamp}`;
          
          const message = `✈️ **Travelling to ${countryName}!**\n\n` +
            `Here's your shop URL:\n\n` +
            `${shopUrl}\n\n` +
            `Watch Items: ${notification.watchItems.join(', ')}\n` +
            `Items to Buy: ${user.itemsToBuy}`;
          
          await sendDirectMessage(notification.discordUserId, message);
          
          // Clear scheduled times to avoid duplicate messages
          await TravelNotification.updateOne(
            { _id: notification._id },
            { 
              scheduledNotifyBeforeTime: null,
              scheduledBoardingTime: null,
              scheduledArrivalTime: null,
            }
          );
          
          logInfo('Sent travel shop URL', {
            discordUserId: notification.discordUserId,
            country: countryName,
            watchItems: notification.watchItems,
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
