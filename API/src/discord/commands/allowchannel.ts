import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { AllowedChannel } from '../../models/AllowedChannel';
import { logInfo, logError } from '../../utils/logger';

export const data = new SlashCommandBuilder()
  .setName('allowchannel')
  .setDescription('Allow market watch commands in this channel (Admin only)')
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
    // Check if channel is already allowed
    const existingChannel = await AllowedChannel.findOne({ guildId, channelId });

    if (existingChannel) {
      if (existingChannel.enabled) {
        await interaction.editReply({
          content: '✅ This channel is already allowed for market watch commands.',
        });
      } else {
        // Re-enable if it was disabled
        existingChannel.enabled = true;
        existingChannel.configuredBy = userId;
        existingChannel.configuredAt = new Date();
        await existingChannel.save();

        logInfo('Re-enabled channel for market watch', { guildId, channelId, userId });

        await interaction.editReply({
          content: '✅ This channel has been re-enabled for market watch commands.',
        });
      }
      return;
    }

    // Create new allowed channel
    const newChannel = new AllowedChannel({
      guildId,
      channelId,
      enabled: true,
      configuredBy: userId,
      configuredAt: new Date(),
    });

    await newChannel.save();

    logInfo('Added allowed channel for market watch', { guildId, channelId, userId });

    await interaction.editReply({
      content: '✅ This channel is now allowed for market watch commands.\nUsers can now use `/addwatch` and other watch commands here.',
    });
  } catch (err) {
    logError('Error in /allowchannel command', err instanceof Error ? err : new Error(String(err)));
    await interaction.editReply({
      content: '❌ Failed to configure channel. Please try again later.',
    });
  }
}

export default { data, execute };
