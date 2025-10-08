import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { TravelNotification } from '../../models/TravelNotification';
import { DiscordUser } from '../../models/DiscordUser';
import { logInfo, logError } from '../../utils/logger';

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

export const data = new SlashCommandBuilder()
  .setName('listtravelnotifications')
  .setDescription('List all your travel notifications and their settings.');

export async function execute(interaction: ChatInputCommandInteraction) {
  const discordUserId = interaction.user.id;

  await interaction.deferReply({ ephemeral: true });

  try {
    // Check if user has registered their API key
    const user = await DiscordUser.findOne({ discordId: discordUserId });
    
    if (!user) {
      await interaction.editReply({
        content: '❌ You must first set your API key using `/setkey` before viewing travel notifications.',
      });
      return;
    }

    // Get all travel notifications for this user
    const notifications = await TravelNotification.find({ discordUserId }).lean();

    if (notifications.length === 0) {
      await interaction.editReply({
        content: '📭 You have no travel notifications set up.\n\nUse `/notifytravel` to create one!',
      });
      return;
    }

    // Build message with all notifications
    let message = '✈️ **Your Travel Notifications**\n\n';
    message += `**Global Settings:**\n`;
    message += `🏝️ Private Island: ${user.hasPrivateIsland ? 'Yes' : 'No'}\n`;
    message += `📦 Items to Buy: ${user.itemsToBuy}\n\n`;
    message += `**Destinations:**\n`;

    for (const notification of notifications) {
      const countryName = COUNTRY_CODE_MAP[notification.countryCode] || notification.countryCode;
      const status = notification.enabled ? '✅ Enabled' : '❌ Disabled';
      
      message += `**${countryName}** ${status}\n`;
      message += `  🔔 Notify: ${notification.notifyBeforeSeconds}s before`;
      if (notification.notifyBeforeSeconds2) {
        message += ` and ${notification.notifyBeforeSeconds2}s before`;
      }
      message += '\n';
      
      if (notification.watchItems && notification.watchItems.length > 0) {
        message += `  👁️ Watch Items: ${notification.watchItems.join(', ')}\n`;
      }
      
      if (notification.scheduledBoardingTime && !notification.notificationsSent) {
        const boardingTimestamp = Math.floor(new Date(notification.scheduledBoardingTime).getTime() / 1000);
        message += `  ⏰ Next alert: <t:${boardingTimestamp}:t> (<t:${boardingTimestamp}:R>)\n`;
      }
      
      message += '\n';
    }

    message += `\nTo modify a notification, use \`/notifytravel\` with the country name.`;
    message += `\nTo disable a notification, use \`/disabletravelnotification\`.`;

    await interaction.editReply({
      content: message,
    });

    logInfo('Listed travel notifications', {
      discordUserId,
      count: notifications.length,
    });
  } catch (err) {
    logError('Error in /listtravelnotifications command', err instanceof Error ? err : new Error(String(err)));
    await interaction.editReply({
      content: '❌ Failed to list travel notifications. Please try again later.',
    });
  }
}

export default { data, execute };
