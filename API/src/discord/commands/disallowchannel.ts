import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { AllowedChannel } from '../../models/AllowedChannel';
import { logInfo, logError } from '../../utils/logger';

export const data = new SlashCommandBuilder()
  .setName('disallowchannel')
  .setDescription('Disallow market watch commands in this channel (Admin only)')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId;
  const channelId = interaction.channelId;
  const userId = interaction.user.id;

  if (!guildId) {
    await interaction.reply({
      content: '❌ This command can only be used in a server.',
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const channel = await AllowedChannel.findOne({ guildId, channelId });

    if (!channel) {
      await interaction.editReply({
        content: '❌ This channel was never explicitly allowed for market watch commands.',
      });
      return;
    }

    if (!channel.enabled) {
      await interaction.editReply({
        content: '❌ This channel is already disabled for market watch commands.',
      });
      return;
    }

    // Disable the channel
    channel.enabled = false;
    channel.configuredBy = userId;
    channel.configuredAt = new Date();
    await channel.save();

    logInfo('Disabled channel for market watch', { guildId, channelId, userId });

    await interaction.editReply({
      content: '✅ This channel is now disabled for market watch commands.\nUsers can no longer add watches here.',
    });
  } catch (err) {
    logError('Error in /disallowchannel command', err instanceof Error ? err : new Error(String(err)));
    await interaction.editReply({
      content: '❌ Failed to configure channel. Please try again later.',
    });
  }
}

export default { data, execute };
