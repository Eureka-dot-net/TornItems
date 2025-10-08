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
  const notifyBeforeSeconds = interaction.options.getInteger('notifybeforeseconds') || 10;
  const hasPrivateIsland = interaction.options.getBoolean('hasprivateisland');
  const watchItem1 = interaction.options.getInteger('watchitem1');
  const watchItem2 = interaction.options.getInteger('watchitem2');
  const watchItem3 = interaction.options.getInteger('watchitem3');
  const itemsToBuy = interaction.options.getInteger('itemstobuy') || 19;
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

    // Check if notification already exists for this user+country
    let notification = await TravelNotification.findOne({ 
      discordUserId, 
      countryCode 
    });

    // Determine which fields to update
    const updateFields: any = {
      notifyBeforeSeconds,
      itemsToBuy,
      enabled: true,
    };

    // Only update hasPrivateIsland if explicitly provided
    if (hasPrivateIsland !== null) {
      updateFields.hasPrivateIsland = hasPrivateIsland;
    }

    // Only update watchItems if provided
    if (watchItems.length > 0) {
      updateFields.watchItems = watchItems;
    }

    if (notification) {
      // Update existing notification
      Object.assign(notification, updateFields);
      await notification.save();

      logInfo('Updated travel notification', {
        discordUserId,
        countryCode,
        notifyBeforeSeconds,
        hasPrivateIsland: notification.hasPrivateIsland,
        watchItems: notification.watchItems,
        itemsToBuy,
      });

      // Calculate next boarding time
      const now = new Date();
      const actualTravelTimeMinutes = notification.hasPrivateIsland 
        ? Math.round(travelTime.travelTimeMinutes * 0.70) 
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

      await interaction.editReply({
        content: `✅ Updated travel notification for **${COUNTRY_CODE_MAP[countryCode]}**\n\n` +
          `🏝️ Private Island: ${notification.hasPrivateIsland ? 'Yes (-30% travel time)' : 'No'}\n` +
          `⏱️ Travel Time: ${actualTravelTimeMinutes} minutes\n` +
          `📦 Items to Buy: ${itemsToBuy}\n` +
          `👁️ Watch Items: ${notification.watchItems.length > 0 ? notification.watchItems.join(', ') : 'None'}\n` +
          `🔔 Notify: ${notifyBeforeSeconds}s before departure\n\n` +
          `**Next scheduled landing:**\n` +
          `📍 Arrival: ${nextSlot.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}\n` +
          `🛫 Board at: ${boardingTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}\n\n` +
          `The bot will monitor your travel and provide URLs when you land.`,
      });
    } else {
      // Create new notification
      notification = new TravelNotification({
        discordUserId,
        countryCode,
        notifyBeforeSeconds,
        hasPrivateIsland: hasPrivateIsland ?? false,
        watchItems,
        itemsToBuy,
        enabled: true,
      });
      await notification.save();

      logInfo('Created travel notification', {
        discordUserId,
        countryCode,
        notifyBeforeSeconds,
        hasPrivateIsland: notification.hasPrivateIsland,
        watchItems,
        itemsToBuy,
      });

      // Calculate next boarding time
      const now = new Date();
      const actualTravelTimeMinutes = notification.hasPrivateIsland 
        ? Math.round(travelTime.travelTimeMinutes * 0.70) 
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

      await interaction.editReply({
        content: `✅ Created travel notification for **${COUNTRY_CODE_MAP[countryCode]}**\n\n` +
          `🏝️ Private Island: ${notification.hasPrivateIsland ? 'Yes (-30% travel time)' : 'No'}\n` +
          `⏱️ Travel Time: ${actualTravelTimeMinutes} minutes\n` +
          `📦 Items to Buy: ${itemsToBuy}\n` +
          `👁️ Watch Items: ${watchItems.length > 0 ? watchItems.join(', ') : 'None'}\n` +
          `🔔 Notify: ${notifyBeforeSeconds}s before departure\n\n` +
          `**Next scheduled landing:**\n` +
          `📍 Arrival: ${nextSlot.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}\n` +
          `🛫 Board at: ${boardingTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}\n\n` +
          `The bot will monitor your travel and provide URLs when you land.`,
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
