import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { MinMaxSubscription } from '../../models/MinMaxSubscription';
import { DiscordUser } from '../../models/DiscordUser';
import { logInfo, logError } from '../../utils/logger';

export const data = new SlashCommandBuilder()
  .setName('minmaxunsub')
  .setDescription('Unsubscribe from daily minmax reminder notifications.');

export async function execute(interaction: ChatInputCommandInteraction) {
  const discordUserId = interaction.user.id;

  await interaction.deferReply({ ephemeral: true });

  try {
    // Check if user has registered their API key
    const user = await DiscordUser.findOne({ discordId: discordUserId });
    
    if (!user) {
      await interaction.editReply({
        content: '❌ You must first set your API key using `/minmaxsetkey` before managing minmax notifications.',
      });
      return;
    }

    // Find and delete subscription
    const subscription = await MinMaxSubscription.findOneAndDelete({ discordUserId });

    if (!subscription) {
      await interaction.editReply({
        content: '❌ You don\'t have an active minmax subscription.\n\nUse `/minmaxsub` to create one.',
      });
      return;
    }

    await interaction.editReply({
      content: '✅ **Minmax subscription removed successfully.**\n\nYou will no longer receive daily minmax reminders.\n\nTo subscribe again, use `/minmaxsub`',
    });

    logInfo('Deleted minmax subscription', { discordUserId });
  } catch (err) {
    logError('Error in /minmaxunsub command', err instanceof Error ? err : new Error(String(err)));
    await interaction.editReply({
      content: '❌ Failed to remove minmax subscription. Please try again later.',
    });
  }
}

export default { data, execute };
