import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { TravelNotification } from '../../models/TravelNotification';
import { DiscordUser } from '../../models/DiscordUser';
import { TravelTime } from '../../models/TravelTime';
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

const COUNTRY_NAME_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRY_CODE_MAP).map(([code, name]) => [name.toLowerCase(), code])
);

export const data = new SlashCommandBuilder()
  .setName('notifytravel')
  .setDescription('Set up travel notifications to land at 15-minute restock slots.')
  .addStringOption(option =>
    option
      .setName('country')
      .setDescription('Destination country (e.g., Mexico, Canada, Japan)')
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option
      .setName('notifybeforeseconds')
      .setDescription('Seconds before departure to notify (default: 10)')
      .setRequired(false)
      .setMinValue(1)
      .setMaxValue(300)
  )
  .addIntegerOption(option =>
    option
      .setName('notifybeforeseconds2')
      .setDescription('Second alert seconds before departure (e.g., 5 for 5s warning)')
      .setRequired(false)
      .setMinValue(1)
      .setMaxValue(300)
  )
  .addBooleanOption(option =>
    option
      .setName('hasprivateisland')
      .setDescription('Do you have a private island? (30% faster travel)')
      .setRequired(false)
  )
  .addIntegerOption(option =>
    option
      .setName('watchitem1')
      .setDescription('First item ID to watch')
      .setRequired(false)
  )
  .addIntegerOption(option =>
    option
      .setName('watchitem2')
      .setDescription('Second item ID to watch')
      .setRequired(false)
  )
  .addIntegerOption(option =>
    option
      .setName('watchitem3')
      .setDescription('Third item ID to watch')
      .setRequired(false)
  )
  .addIntegerOption(option =>
    option
      .setName('itemstobuy')
      .setDescription('Number of items to buy (max 19)')
      .setRequired(false)
      .setMinValue(1)
      .setMaxValue(19)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const countryInput = interaction.options.getString('country', true).trim();
  const notifyBeforeSeconds = interaction.options.getInteger('notifybeforeseconds');
  const notifyBeforeSeconds2 = interaction.options.getInteger('notifybeforeseconds2');
  const hasPrivateIsland = interaction.options.getBoolean('hasprivateisland');
  const watchItem1 = interaction.options.getInteger('watchitem1');
  const watchItem2 = interaction.options.getInteger('watchitem2');
  const watchItem3 = interaction.options.getInteger('watchitem3');
  const itemsToBuy = interaction.options.getInteger('itemstobuy');
  const discordUserId = interaction.user.id;

  await interaction.deferReply({ ephemeral: true });

  try {
    // Check if user has registered their API key
    const user = await DiscordUser.findOne({ discordId: discordUserId });
    
    if (!user) {
      await interaction.editReply({
        content: '❌ You must first set your API key using `/setkey` before setting up travel notifications.',
      });
      return;
    }

    // Update global settings if provided
    let settingsUpdated = false;
    if (hasPrivateIsland !== null) {
      user.hasPrivateIsland = hasPrivateIsland;
      settingsUpdated = true;
    }
    if (itemsToBuy !== null) {
      user.itemsToBuy = itemsToBuy;
      settingsUpdated = true;
    }
    if (settingsUpdated) {
      await user.save();
    }

    // Convert country name to code
    const countryCode = COUNTRY_NAME_TO_CODE[countryInput.toLowerCase()];
    
    if (!countryCode) {
      const validCountries = Object.values(COUNTRY_CODE_MAP).join(', ');
      await interaction.editReply({
        content: `❌ Invalid country: "${countryInput}"\n\nValid countries: ${validCountries}`,
      });
      return;
    }

    // Get travel time for this country
    const travelTime = await TravelTime.findOne({ countryCode });
    
    if (!travelTime) {
      await interaction.editReply({
        content: `❌ Travel time data not found for ${COUNTRY_CODE_MAP[countryCode]}. Please contact an administrator.`,
      });
      return;
    }

    // Build watch items array
    const watchItems: number[] = [];
    if (watchItem1) watchItems.push(watchItem1);
    if (watchItem2) watchItems.push(watchItem2);
    if (watchItem3) watchItems.push(watchItem3);

    // Calculate scheduled times using current settings
    const now = new Date();
    
    // Fix rounding error with private island calculation (multiply by 100, round, divide by 100)
    const actualTravelTimeMinutes = user.hasPrivateIsland 
      ? Math.round(travelTime.travelTimeMinutes * 0.70 * 100) / 100
      : Math.round(travelTime.travelTimeMinutes);

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
    const actualNotifyBeforeSeconds = notifyBeforeSeconds || 10;
    const actualNotifyBeforeSeconds2 = notifyBeforeSeconds2 || null;
    
    // Validate that notifyBeforeSeconds2 is less than notifyBeforeSeconds
    if (actualNotifyBeforeSeconds2 !== null && actualNotifyBeforeSeconds2 >= actualNotifyBeforeSeconds) {
      await interaction.editReply({
        content: `❌ Second notification time (${actualNotifyBeforeSeconds2}s) must be less than first notification time (${actualNotifyBeforeSeconds}s).`,
      });
      return;
    }
    
    const notifyBeforeTime = new Date(boardingTime.getTime() - actualNotifyBeforeSeconds * 1000);
    const notifyBeforeTime2 = actualNotifyBeforeSeconds2 !== null 
      ? new Date(boardingTime.getTime() - actualNotifyBeforeSeconds2 * 1000)
      : null;

    // Check if notification already exists for this user+country
    let notification = await TravelNotification.findOne({ 
      discordUserId, 
      countryCode 
    });

    if (notification) {
      // Update existing notification
      if (notifyBeforeSeconds !== null) {
        notification.notifyBeforeSeconds = actualNotifyBeforeSeconds;
      }
      if (notifyBeforeSeconds2 !== null || actualNotifyBeforeSeconds2 === null) {
        notification.notifyBeforeSeconds2 = actualNotifyBeforeSeconds2;
      }
      if (watchItems.length > 0) {
        notification.watchItems = watchItems;
      }
      notification.enabled = true;
      notification.scheduledNotifyBeforeTime = notifyBeforeTime;
      notification.scheduledNotifyBeforeTime2 = notifyBeforeTime2;
      notification.scheduledBoardingTime = boardingTime;
      notification.scheduledArrivalTime = nextSlot;
      notification.notificationsSent = false;
      notification.notificationsSent2 = false;
      await notification.save();

      logInfo('Updated travel notification', {
        discordUserId,
        countryCode,
        notifyBeforeSeconds: notification.notifyBeforeSeconds,
        notifyBeforeSeconds2: notification.notifyBeforeSeconds2,
        watchItems: notification.watchItems,
        scheduledBoardingTime: boardingTime.toISOString(),
      });

      // Build notification list with Discord timestamps
      const notificationTimes = [
        `• <t:${Math.floor(notifyBeforeTime.getTime() / 1000)}:T> (${actualNotifyBeforeSeconds}s warning)`
      ];
      if (notifyBeforeTime2) {
        notificationTimes.push(
          `• <t:${Math.floor(notifyBeforeTime2.getTime() / 1000)}:T> (${actualNotifyBeforeSeconds2}s warning)`
        );
      }
      // Only add boarding time notification if no before times are set
      if (actualNotifyBeforeSeconds2 === null) {
        notificationTimes.push(
          `• <t:${Math.floor(boardingTime.getTime() / 1000)}:T> (board now)`
        );
      }

      await interaction.editReply({
        content: `✅ Updated travel notification for **${COUNTRY_CODE_MAP[countryCode]}**\n\n` +
          `🏝️ Private Island: ${user.hasPrivateIsland ? 'Yes (-30% travel time)' : 'No'}\n` +
          `⏱️ Travel Time: ${actualTravelTimeMinutes} minutes\n` +
          `📦 Items to Buy: ${user.itemsToBuy}\n` +
          `👁️ Watch Items: ${notification.watchItems.length > 0 ? notification.watchItems.join(', ') : 'None'}\n` +
          `🔔 Notify: ${actualNotifyBeforeSeconds}s before${actualNotifyBeforeSeconds2 !== null ? ` and ${actualNotifyBeforeSeconds2}s before` : ''} departure\n\n` +
          `**Next scheduled landing:**\n` +
          `📍 Arrival: <t:${Math.floor(nextSlot.getTime() / 1000)}:t>\n` +
          `🛫 Board at: <t:${Math.floor(boardingTime.getTime() / 1000)}:t>\n\n` +
          `You will receive notifications at:\n` +
          notificationTimes.join('\n'),
      });
    } else {
      // Create new notification
      notification = new TravelNotification({
        discordUserId,
        countryCode,
        notifyBeforeSeconds: actualNotifyBeforeSeconds,
        notifyBeforeSeconds2: actualNotifyBeforeSeconds2,
        watchItems,
        enabled: true,
        scheduledNotifyBeforeTime: notifyBeforeTime,
        scheduledNotifyBeforeTime2: notifyBeforeTime2,
        scheduledBoardingTime: boardingTime,
        scheduledArrivalTime: nextSlot,
        notificationsSent: false,
        notificationsSent2: false,
      });
      await notification.save();

      logInfo('Created travel notification', {
        discordUserId,
        countryCode,
        notifyBeforeSeconds: actualNotifyBeforeSeconds,
        notifyBeforeSeconds2: actualNotifyBeforeSeconds2,
        watchItems,
        scheduledBoardingTime: boardingTime.toISOString(),
      });

      // Build notification list with Discord timestamps
      const notificationTimes = [
        `• <t:${Math.floor(notifyBeforeTime.getTime() / 1000)}:T> (${actualNotifyBeforeSeconds}s warning)`
      ];
      if (notifyBeforeTime2) {
        notificationTimes.push(
          `• <t:${Math.floor(notifyBeforeTime2.getTime() / 1000)}:T> (${actualNotifyBeforeSeconds2}s warning)`
        );
      }
      // Only add boarding time notification if no before times are set
      if (actualNotifyBeforeSeconds2 === null) {
        notificationTimes.push(
          `• <t:${Math.floor(boardingTime.getTime() / 1000)}:T> (board now)`
        );
      }

      await interaction.editReply({
        content: `✅ Created travel notification for **${COUNTRY_CODE_MAP[countryCode]}**\n\n` +
          `🏝️ Private Island: ${user.hasPrivateIsland ? 'Yes (-30% travel time)' : 'No'}\n` +
          `⏱️ Travel Time: ${actualTravelTimeMinutes} minutes\n` +
          `📦 Items to Buy: ${user.itemsToBuy}\n` +
          `👁️ Watch Items: ${watchItems.length > 0 ? watchItems.join(', ') : 'None'}\n` +
          `🔔 Notify: ${actualNotifyBeforeSeconds}s before${actualNotifyBeforeSeconds2 !== null ? ` and ${actualNotifyBeforeSeconds2}s before` : ''} departure\n\n` +
          `**Next scheduled landing:**\n` +
          `📍 Arrival: <t:${Math.floor(nextSlot.getTime() / 1000)}:t>\n` +
          `🛫 Board at: <t:${Math.floor(boardingTime.getTime() / 1000)}:t>\n\n` +
          `You will receive notifications at:\n` +
          notificationTimes.join('\n'),
      });
    }
  } catch (err) {
    logError('Error in /notifytravel command', err instanceof Error ? err : new Error(String(err)));
    await interaction.editReply({
      content: '❌ Failed to set up travel notification. Please try again later.',
    });
  }
}

export default { data, execute };
