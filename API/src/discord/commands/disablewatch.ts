import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { MarketWatchlistItem } from '../../models/MarketWatchlistItem';
import { logInfo, logError } from '../../utils/logger';

export const data = new SlashCommandBuilder()
  .setName('disablewatch')
  .setDescription('Disable a market watch item without removing it.')
  .addIntegerOption(option =>
    option
      .setName('itemid')
      .setDescription('The Torn item ID to disable (omit to disable all)')
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const itemId = interaction.options.getInteger('itemid');
  const discordUserId = interaction.user.id;

  await interaction.deferReply({ ephemeral: true });

  try {
    // If no itemId provided, disable all items for the user
    if (itemId === null) {
      const result = await MarketWatchlistItem.updateMany(
        { discordUserId, enabled: true },
        { enabled: false }
      );

      if (result.modifiedCount === 0) {
        await interaction.editReply({
          content: '❌ You have no enabled watch items to disable.',
        });
        return;
      }

      logInfo('Disabled all market watch items', {
        discordUserId,
        count: result.modifiedCount,
      });

      await interaction.editReply({
        content: `✅ Disabled ${result.modifiedCount} watch item${result.modifiedCount !== 1 ? 's' : ''}. Use \`/enablewatch\` to re-enable them.`,
      });
      return;
    }

    // Find and update the watch
    const watch = await MarketWatchlistItem.findOneAndUpdate(
      { discordUserId, itemId },
      { enabled: false },
      { new: true }
    );

    if (!watch) {
      await interaction.editReply({
        content: `❌ You are not watching item ID ${itemId}.`,
      });
      return;
    }

    logInfo('Disabled market watch item', {
      discordUserId,
      itemId,
      name: watch.name,
    });

    await interaction.editReply({
      content: `✅ Disabled watch for **${watch.name}** (ID: ${itemId}). Use \`/enablewatch\` to re-enable it.`,
    });
  } catch (err) {
    logError('Error in /disablewatch command', err instanceof Error ? err : new Error(String(err)));
    await interaction.editReply({
      content: '❌ Failed to disable watch. Please try again later.',
    });
  }
}

export default { data, execute };
