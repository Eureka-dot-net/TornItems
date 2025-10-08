import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { MarketWatchlistItem } from '../../models/MarketWatchlistItem';
import { AllowedChannel } from '../../models/AllowedChannel';
import { logInfo, logError } from '../../utils/logger';

export const data = new SlashCommandBuilder()
  .setName('editwatch')
  .setDescription('Edit the alert price for an item on your market watch list.')
  .addIntegerOption(option =>
    option
      .setName('itemid')
      .setDescription('The Torn item ID to edit')
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option
      .setName('price')
      .setDescription('New alert price (alert when price drops below this amount)')
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const itemId = interaction.options.getInteger('itemid', true);
  const newPrice = interaction.options.getInteger('price', true);
  const discordUserId = interaction.user.id;
  const guildId = interaction.guildId || '';
  const channelId = interaction.channelId;

  await interaction.deferReply({ ephemeral: true });

  try {
    // Check if this channel is allowed for market watch commands
    if (guildId) {
      const allowedChannel = await AllowedChannel.findOne({ guildId, channelId });
      
      if (!allowedChannel || !allowedChannel.enabled) {
        await interaction.editReply({
          content: '❌ Market watch commands are not allowed in this channel.\nPlease ask an administrator to use `/allowchannel` to enable this channel.',
        });
        return;
      }
    }

    // Find the watch item
    const watch = await MarketWatchlistItem.findOne({
      discordUserId,
      itemId,
    });

    if (!watch) {
      await interaction.editReply({
        content: `❌ You are not watching item ID ${itemId}.\nUse \`/listwatch\` to see your watched items.`,
      });
      return;
    }

    const oldPrice = watch.alert_below;

    // Update the alert price
    watch.alert_below = newPrice;
    // Reset last alert price so user gets notified at the new threshold
    watch.lastAlertPrice = null;
    watch.lastAlertTimestamp = null;
    
    await watch.save();

    logInfo('Updated market watch item alert price', {
      discordUserId,
      itemId,
      name: watch.name,
      oldPrice,
      newPrice,
    });

    await interaction.editReply({
      content: `✅ Updated alert price for **${watch.name}** (ID: ${itemId}).\nOld price: $${oldPrice.toLocaleString()}\nNew price: $${newPrice.toLocaleString()}\n\nYou'll be alerted when the price drops below $${newPrice.toLocaleString()}.`,
    });
  } catch (err) {
    logError('Error in /editwatch command', err instanceof Error ? err : new Error(String(err)));
    await interaction.editReply({
      content: '❌ Failed to update watch item. Please try again later.',
    });
  }
}

export default { data, execute };
