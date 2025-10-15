import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { getApiCallStats } from '../../utils/apiCallLogger';
import { logInfo, logError } from '../../utils/logger';

export const data = new SlashCommandBuilder()
  .setName('numapicalls')
  .setDescription('Show the number of Torn API calls made in the last X minutes')
  .addIntegerOption(option =>
    option
      .setName('minutes')
      .setDescription('Number of minutes to look back (1-1440)')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(1440) // Max 24 hours
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    const minutes = interaction.options.getInteger('minutes', true);

    logInfo('Fetching API call statistics', {
      discordUserId: interaction.user.id,
      minutes,
    });

    // Get API call statistics
    const stats = await getApiCallStats(minutes);

    // Create an embed to display the statistics
    const embed = new EmbedBuilder()
      .setTitle('📊 Torn API Call Statistics')
      .setDescription(`API calls made in the last **${minutes}** minute${minutes !== 1 ? 's' : ''}`)
      .setColor(0x0099ff)
      .setTimestamp();

    // Add total count
    embed.addFields({
      name: '🔢 Total API Calls',
      value: `**${stats.total}** calls`,
      inline: false,
    });

    // Add breakdown by source
    if (Object.keys(stats.bySource).length > 0) {
      const sourceBreakdown = Object.entries(stats.bySource)
        .sort(([, a], [, b]) => b - a) // Sort by count descending
        .map(([source, count]) => `• **${source}**: ${count} calls`)
        .join('\n');
      
      embed.addFields({
        name: '📍 By Source',
        value: sourceBreakdown,
        inline: false,
      });
    }

    // Add breakdown by endpoint
    if (Object.keys(stats.byEndpoint).length > 0) {
      const endpointBreakdown = Object.entries(stats.byEndpoint)
        .sort(([, a], [, b]) => b - a) // Sort by count descending
        .slice(0, 10) // Show top 10 endpoints
        .map(([endpoint, count]) => `• **${endpoint}**: ${count} calls`)
        .join('\n');
      
      embed.addFields({
        name: '🎯 Top Endpoints',
        value: endpointBreakdown + (Object.keys(stats.byEndpoint).length > 10 ? '\n*... and more*' : ''),
        inline: false,
      });
    }

    // Add rate information
    const callsPerMinute = stats.total / minutes;
    embed.addFields({
      name: '⚡ Average Rate',
      value: `${callsPerMinute.toFixed(2)} calls/minute`,
      inline: false,
    });

    await interaction.editReply({
      embeds: [embed],
    });

    logInfo('API call statistics displayed', {
      discordUserId: interaction.user.id,
      minutes,
      totalCalls: stats.total,
    });

  } catch (err) {
    logError('Error in /numapicalls command', err instanceof Error ? err : new Error(String(err)));
    await interaction.editReply({
      content: '❌ Failed to retrieve API call statistics. Please try again later.',
    });
  }
}

export default { data, execute };
