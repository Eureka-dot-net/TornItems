import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Job } from '../../models/Job';
import { logInfo, logError } from '../../utils/logger';

export const data = new SlashCommandBuilder()
  .setName('disablejob')
  .setDescription('Disable a background job to limit API usage')
  .addStringOption(option =>
    option
      .setName('jobname')
      .setDescription('The name of the job to disable')
      .setRequired(true)
      .setAutocomplete(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const jobName = interaction.options.getString('jobname', true);

  await interaction.deferReply({ ephemeral: true });

  try {
    // Find the job
    const job = await Job.findOne({ name: jobName });

    if (!job) {
      await interaction.editReply({
        content: `❌ Job "${jobName}" not found. Use \`/listjobs\` to see available jobs.`,
      });
      return;
    }

    // Check if already disabled
    if (!job.enabled) {
      await interaction.editReply({
        content: `ℹ️ Job "${jobName}" is already disabled.`,
      });
      return;
    }

    // Disable the job
    job.enabled = false;
    await job.save();

    logInfo('Disabled job', {
      discordUserId: interaction.user.id,
      jobName,
    });

    await interaction.editReply({
      content: `✅ Disabled job: **${jobName}**\n\nThe job will stop running. Use \`/enablejob\` to re-enable it.`,
    });
  } catch (err) {
    logError('Error in /disablejob command', err instanceof Error ? err : new Error(String(err)));
    await interaction.editReply({
      content: '❌ Failed to disable job. Please try again later.',
    });
  }
}

// Autocomplete handler for job names
export async function autocomplete(interaction: any) {
  try {
    const focusedValue = interaction.options.getFocused();
    const jobs = await Job.find({ enabled: true }).sort({ name: 1 });
    
    const filtered = jobs
      .filter(job => job.name.toLowerCase().includes(focusedValue.toLowerCase()))
      .slice(0, 25); // Discord limits autocomplete to 25 options

    await interaction.respond(
      filtered.map(job => ({
        name: `${job.name} - ${job.description}`,
        value: job.name,
      }))
    );
  } catch (error) {
    logError('Error in disablejob autocomplete', error instanceof Error ? error : new Error(String(error)));
    await interaction.respond([]);
  }
}

export default { data, execute, autocomplete };
