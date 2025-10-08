import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { MarketWatchlistItem } from '../../models/MarketWatchlistItem';
import { DiscordUser } from '../../models/DiscordUser';
import { logInfo, logError } from '../../utils/logger';

export const data = new SlashCommandBuilder()
  .setName('addwatch')
  .setDescription('Add an item to your market watch list.')
  .addIntegerOption(option =>
    option
      .setName('itemid')
      .setDescription('The Torn item ID to watch')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('name')
      .setDescription('The name of the item')
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option
      .setName('price')
      .setDescription('Alert when price drops below this amount')
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const itemId = interaction.options.getInteger('itemid', true);
  const name = interaction.options.getString('name', true);
  const alertBelow = interaction.options.getInteger('price', true);
  const discordUserId = interaction.user.id;
  const guildId = interaction.guildId || '';
  const channelId = interaction.channelId;

  await interaction.deferReply({ ephemeral: true });

  try {
    // Check if user has registered their API key
    const user = await DiscordUser.findOne({ discordId: discordUserId });
    
    if (!user) {
      await interaction.editReply({
        content: '❌ You must first set your API key using `/setkey` before adding market watches.',
      });
      return;
    }

    // Check if watch already exists
    const existingWatch = await MarketWatchlistItem.findOne({ 
      discordUserId, 
      itemId 
    });

    if (existingWatch) {
      await interaction.editReply({
        content: `❌ You are already watching **${existingWatch.name}** (ID: ${itemId}).\nUse \`/enablewatch\` to re-enable it if disabled.`,
      });
      return;
    }

    // Create new watch
    const newWatch = new MarketWatchlistItem({
      itemId,
      name,
      alert_below: alertBelow,
      discordUserId,
      apiKey: user.apiKey,  // Use encrypted API key from user
      guildId,
      channelId,
      enabled: true,
      lastAlertPrice: null,
      lastAlertTimestamp: null,
    });

    await newWatch.save();

    logInfo('Created market watch item', {
      discordUserId,
      itemId,
      name,
      alertBelow,
    });

    await interaction.editReply({
      content: `✅ Added **${name}** (ID: ${itemId}) to your watch list.\nYou'll be alerted in this channel when the price drops below $${alertBelow.toLocaleString()}.`,
    });
  } catch (err) {
    logError('Error in /addwatch command', err instanceof Error ? err : new Error(String(err)));
    await interaction.editReply({
      content: '❌ Failed to add item to watch list. Please try again later.',
    });
  }
}

export default { data, execute };
