import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { MarketWatchlistItem } from '../../models/MarketWatchlistItem';
import { logError } from '../../utils/logger';

export const data = new SlashCommandBuilder()
  .setName('listwatch')
  .setDescription('List all your market watch items.');

export async function execute(interaction: ChatInputCommandInteraction) {
  const discordUserId = interaction.user.id;

  await interaction.deferReply({ ephemeral: true });

  try {
    const watches = await MarketWatchlistItem.find({ discordUserId }).sort({ name: 1 });

    if (watches.length === 0) {
      await interaction.editReply({
        content: '📋 You have no items in your watch list.\nUse `/addwatch` to add items.',
      });
      return;
    }

    const watchList = watches.map(watch => {
      const status = watch.enabled ? '✅' : '❌';
      return `${status} **${watch.name}** (ID: ${watch.itemId}) - Alert below $${watch.alert_below.toLocaleString()}`;
    }).join('\n');

    await interaction.editReply({
      content: `📋 **Your Market Watch List:**\n\n${watchList}\n\n✅ = Enabled | ❌ = Disabled`,
    });
  } catch (err) {
    logError('Error in /listwatch command', err instanceof Error ? err : new Error(String(err)));
    await interaction.editReply({
      content: '❌ Failed to retrieve watch list. Please try again later.',
    });
  }
}

export default { data, execute };
