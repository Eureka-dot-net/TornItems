import { MinMaxSubscription } from '../models/MinMaxSubscription';
import { fetchMinMaxStatus } from '../utils/minmaxHelper';
import { sendDiscordChannelAlert } from '../utils/discord';
import { logInfo, logError } from '../utils/logger';

/**
 * Check minmax subscriptions and send notifications for users who need reminders
 */
export async function checkMinMaxSubscriptions() {
  try {
    const now = new Date();
    const currentHourUTC = now.getUTCHours();
    const currentDateUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    
    // Find all enabled subscriptions
    const subscriptions = await MinMaxSubscription.find({ enabled: true }).lean();
    
    for (const subscription of subscriptions) {
      try {
        // Calculate notification hour for this subscription
        // If hoursBeforeReset is 4, we notify at 20:00 UTC (24 - 4 = 20)
        const notificationHour = (24 - subscription.hoursBeforeReset) % 24;
        
        // Check if current hour matches notification hour
        if (currentHourUTC !== notificationHour) {
          continue; // Not time to notify this user yet
        }
        
        // Check if we already sent a notification today
        const lastSent = subscription.lastNotificationSent;
        if (lastSent) {
          const lastSentDateUTC = new Date(Date.UTC(
            lastSent.getUTCFullYear(),
            lastSent.getUTCMonth(),
            lastSent.getUTCDate()
          ));
          
          if (lastSentDateUTC.getTime() === currentDateUTC.getTime()) {
            // Already sent notification today
            continue;
          }
        }
        
        // Fetch minmax status for this user
        let status;
        try {
          status = await fetchMinMaxStatus(subscription.discordUserId, undefined, true);
        } catch (error) {
          logError('Failed to fetch minmax status for subscription', error instanceof Error ? error : new Error(String(error)), {
            discordUserId: subscription.discordUserId
          });
          continue; // Skip this user and continue with others
        }
        
        // Check if user needs to be notified
        const incompleteTasks = [];
        
        // Check basic tasks
        if (!status.cityItemsBought.completed) {
          incompleteTasks.push(`❌ **City Items:** ${status.cityItemsBought.current}/${status.cityItemsBought.target}`);
        }
        if (!status.xanaxTaken.completed) {
          incompleteTasks.push(`❌ **Xanax:** ${status.xanaxTaken.current}/${status.xanaxTaken.target}`);
        }
        if (!status.energyRefill.completed) {
          incompleteTasks.push(`❌ **Energy Refill:** ${status.energyRefill.current}/${status.energyRefill.target}`);
        }
        
        // Check optional activities
        if (subscription.notifyEducation && status.education && !status.education.active) {
          incompleteTasks.push(`❌ **Education:** Not enrolled`);
        }
        if (subscription.notifyInvestment && status.investment && !status.investment.active) {
          incompleteTasks.push(`❌ **Investment:** No city bank investment`);
        }
        if (subscription.notifyVirus && status.virusCoding && !status.virusCoding.active) {
          incompleteTasks.push(`❌ **Virus Coding:** Not coding`);
        }
        
        // Only send notification if there are incomplete tasks
        if (incompleteTasks.length > 0) {
          const hoursUntilReset = subscription.hoursBeforeReset;
          const resetTimeUTC = '00:00 UTC';
          
          const message = `🔔 **Daily Task Reminder** (<@${subscription.discordUserId}>)\n\n` +
            `⏰ **${hoursUntilReset} hours until server reset** (${resetTimeUTC})\n\n` +
            `**Incomplete tasks:**\n` +
            incompleteTasks.join('\n') + '\n\n' +
            `Use \`/minmax\` to check your progress.\n` +
            `Use \`/minmaxunsub\` to unsubscribe from these reminders.`;
          
          await sendDiscordChannelAlert(subscription.channelId, message);
          
          // Update last notification sent date
          await MinMaxSubscription.updateOne(
            { _id: subscription._id },
            { lastNotificationSent: now }
          );
          
          logInfo('Sent minmax notification', {
            discordUserId: subscription.discordUserId,
            channelId: subscription.channelId,
            incompleteTasks: incompleteTasks.length,
            hoursBeforeReset: subscription.hoursBeforeReset
          });
        } else {
          // All tasks completed - update last notification sent to prevent checking again today
          await MinMaxSubscription.updateOne(
            { _id: subscription._id },
            { lastNotificationSent: now }
          );
          
          logInfo('All minmax tasks completed, no notification sent', {
            discordUserId: subscription.discordUserId
          });
        }
      } catch (error) {
        logError('Error processing minmax subscription', error instanceof Error ? error : new Error(String(error)), {
          subscriptionId: subscription._id,
          discordUserId: subscription.discordUserId
        });
      }
    }
  } catch (error) {
    logError('Error in minmax subscription check', error instanceof Error ? error : new Error(String(error)));
  }
}
