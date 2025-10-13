import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { MarketWatchlistItem } from '../../models/MarketWatchlistItem';
import { DiscordUser } from '../../models/DiscordUser';
import { TornItem } from '../../models/TornItem';
import { AllowedChannel } from '../../models/AllowedChannel';
import { logInfo, logError } from '../../utils/logger';

const MAX_WATCHES_PER_USER = parseInt(process.env.MAX_WATCHES_PER_USER || '5', 10);

export const data = new SlashCommandBuilder()
  .setName('addwatch')
  .setDescription('Add an item to your market watch list.')
  .addIntegerOption(option =>
    option
      .setName('price')
      .setDescription('Alert when price drops below this amount')
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option
      .setName('itemid')
      .setDescription('The Torn item ID to watch (required if name not provided)')
      .setRequired(false)
  )
  .addStringOption(option =>
    option
      .setName('name')
      .setDescription('The name of the item (required if itemid not provided)')
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  let itemId = interaction.options.getInteger('itemid');
  let name = interaction.options.getString('name');
  const alertBelow = interaction.options.getInteger('price', true);
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

    // Validate that at least one of itemId or name is provided
    if (!itemId && !name) {
      await interaction.editReply({
        content: '❌ You must provide either an item ID or an item name.',
      });
      return;
    }

    // Check if user has registered their API key
    const user = await DiscordUser.findOne({ discordId: discordUserId });
    
    if (!user) {
      await interaction.editReply({
        content: '❌ You must first set your API key using `/setkey` before adding market watches.',
      });
      return;
    }

    // Check watch limit
    const watchCount = await MarketWatchlistItem.countDocuments({ discordUserId });
    if (watchCount >= MAX_WATCHES_PER_USER) {
      await interaction.editReply({
        content: `❌ You have reached the maximum limit of ${MAX_WATCHES_PER_USER} watched items.\nRemove some items with \`/removewatch\` before adding more.`,
      });
      return;
    }

    // Look up missing information from TornItem table
    if (itemId && !name) {
      // Special handling for points market (itemId 0)
      if (itemId === 0) {
        name = 'Points';
      } else {
        // User provided ID, look up name
        const tornItem = await TornItem.findOne({ itemId });
        if (tornItem) {
          name = tornItem.name;
        } else {
          await interaction.editReply({
            content: `❌ Item ID ${itemId} not found in the database.\nTo find the correct item ID:\n1. Go to https://www.torn.com/page.php?sid=ItemMarket\n2. Search for the item\n3. The item ID will be in the URL (e.g., itemID=123)`,
          });
          return;
        }
      }
    } else if (name && !itemId) {
      // Special handling for points market
      if (name.toLowerCase() === 'points' || name.toLowerCase() === 'point') {
        itemId = 0;
        name = 'Points';
      } else {
        // User provided name, look up ID
        const tornItem = await TornItem.findOne({ 
          name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
        });
        if (tornItem) {
          itemId = tornItem.itemId;
        } else {
          await interaction.editReply({
            content: `❌ Item "${name}" not found in the database.\nPlease check the spelling or provide the item ID instead.\n\nTo find the item ID:\n1. Go to https://www.torn.com/page.php?sid=ItemMarket\n2. Search for the item\n3. The item ID will be in the URL (e.g., itemID=123)`,
          });
          return;
        }
      }
    }
    // If both are provided, use the user-supplied values without checking

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
      content: `✅ Added **${name}** (ID: ${itemId}) to your watch list.\nYou'll be alerted in this channel when the price drops below $${alertBelow.toLocaleString()}.\n\n📊 You have ${watchCount + 1} of ${MAX_WATCHES_PER_USER} watches.`,
    });
  } catch (err) {
    logError('Error in /addwatch command', err instanceof Error ? err : new Error(String(err)));
    await interaction.editReply({
      content: '❌ Failed to add item to watch list. Please try again later.',
    });
  }
}

export default { data, execute };
