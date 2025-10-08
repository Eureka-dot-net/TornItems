import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { MarketWatchlistItem } from '../../models/MarketWatchlistItem';
import { logInfo, logError } from '../../utils/logger';

export const data = new SlashCommandBuilder()
  .setName('removewatch')
  .setDescription('Remove an item from your market watch list.')
  .addIntegerOption(option =>
    option
      .setName('itemid')
      .setDescription('The Torn item ID to stop watching')
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const itemId = interaction.options.getInteger('itemid', true);
  const discordUserId = interaction.user.id;

  await interaction.deferReply({ ephemeral: true });

  try {
    // Find and delete the watch
    const watch = await MarketWatchlistItem.findOneAndDelete({
      discordUserId,
      itemId,
    });

    if (!watch) {
      await interaction.editReply({
        content: `❌ You are not watching item ID ${itemId}.`,
      });
      return;
    }

    logInfo('Removed market watch item', {
      discordUserId,
      itemId,
      name: watch.name,
    });

    await interaction.editReply({
      content: `✅ Removed **${watch.name}** (ID: ${itemId}) from your watch list.`,
    });
  } catch (err) {
    logError('Error in /removewatch command', err instanceof Error ? err : new Error(String(err)));
    await interaction.editReply({
      content: '❌ Failed to remove item from watch list. Please try again later.',
    });
  }
}

export default { data, execute };
