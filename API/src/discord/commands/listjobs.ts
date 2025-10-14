import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Job } from '../../models/Job';
import { logInfo, logError } from '../../utils/logger';

export const data = new SlashCommandBuilder()
  .setName('listjobs')
  .setDescription('List all background jobs and their status');

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    // Fetch all jobs from the database
    const jobs = await Job.find().sort({ name: 1 });

    if (jobs.length === 0) {
      await interaction.editReply({
        content: '❌ No jobs found in the database. Please run the initialization script first.',
      });
      return;
    }

    // Create an embed to display the jobs
    const embed = new EmbedBuilder()
      .setTitle('📋 Background Jobs')
      .setDescription('Current status of all background jobs')
      .setColor(0x0099ff);

    // Add fields for each job
    for (const job of jobs) {
      const statusIcon = job.enabled ? '✅' : '❌';
      const statusText = job.enabled ? 'ENABLED' : 'DISABLED';
      const lastRunText = job.lastRun 
        ? `Last run: <t:${Math.floor(job.lastRun.getTime() / 1000)}:R>`
        : 'Never run';
      
      embed.addFields({
        name: `${statusIcon} ${job.name}`,
        value: `**Status:** ${statusText}\n**Schedule:** ${job.cronSchedule}\n${lastRunText}\n${job.description}`,
        inline: false,
      });
    }

    embed.setFooter({ 
      text: 'Use /enablejob or /disablejob to manage jobs' 
    });

    await interaction.editReply({
      embeds: [embed],
    });

    logInfo('Listed all jobs', {
      discordUserId: interaction.user.id,
      jobCount: jobs.length,
    });

  } catch (err) {
    logError('Error in /listjobs command', err instanceof Error ? err : new Error(String(err)));
    await interaction.editReply({
      content: '❌ Failed to retrieve jobs. Please try again later.',
    });
  }
}

export default { data, execute };
