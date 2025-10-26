import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { ChainWatch } from '../../models/ChainWatch';
import { logInfo, logError } from '../../utils/logger';

export const data = new SlashCommandBuilder()
  .setName('disablewatchchain')
  .setDescription('Disable chain timeout notifications.');

export async function execute(interaction: ChatInputCommandInteraction) {
  const discordUserId = interaction.user.id;

  await interaction.deferReply({ ephemeral: true });

  try {
    const chainWatch = await ChainWatch.findOneAndUpdate(
      { discordId: discordUserId },
      { enabled: false },
      { new: true }
    );

    if (!chainWatch) {
      await interaction.editReply({
        content: '❌ You do not have chain notifications enabled.',
      });
      return;
    }

    logInfo('Disabled chain watch', {
      discordUserId,
      factionId: chainWatch.factionId,
    });

    await interaction.editReply({
      content: `✅ Chain notifications disabled. Use \`/watchchain\` to re-enable them.`,
    });
  } catch (err) {
    logError('Error in /disablewatchchain command', err instanceof Error ? err : new Error(String(err)));
    await interaction.editReply({
      content: '❌ Failed to disable chain notifications. Please try again later.',
    });
  }
}

export default { data, execute };
