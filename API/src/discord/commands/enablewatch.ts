import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { MarketWatchlistItem } from '../../models/MarketWatchlistItem';
import { logInfo, logError } from '../../utils/logger';

export const data = new SlashCommandBuilder()
  .setName('enablewatch')
  .setDescription('Enable a disabled market watch item.')
  .addIntegerOption(option =>
    option
      .setName('itemid')
      .setDescription('The Torn item ID to enable')
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const itemId = interaction.options.getInteger('itemid', true);
  const discordUserId = interaction.user.id;

  await interaction.deferReply({ ephemeral: true });

  try {
    // Find and update the watch
    const watch = await MarketWatchlistItem.findOneAndUpdate(
      { discordUserId, itemId },
      { enabled: true },
      { new: true }
    );

    if (!watch) {
      await interaction.editReply({
        content: `❌ You are not watching item ID ${itemId}. Use \`/addwatch\` to add it first.`,
      });
      return;
    }

    logInfo('Enabled market watch item', {
      discordUserId,
      itemId,
      name: watch.name,
    });

    await interaction.editReply({
      content: `✅ Enabled watch for **${watch.name}** (ID: ${itemId}).`,
    });
  } catch (err) {
    logError('Error in /enablewatch command', err instanceof Error ? err : new Error(String(err)));
    await interaction.editReply({
      content: '❌ Failed to enable watch. Please try again later.',
    });
  }
}

export default { data, execute };
