import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Job } from '../../models/Job';
import { logInfo, logError } from '../../utils/logger';

export const data = new SlashCommandBuilder()
  .setName('enablejob')
  .setDescription('Enable a disabled background job')
  .addStringOption(option =>
    option
      .setName('jobname')
      .setDescription('The name of the job to enable')
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

    // Check if already enabled
    if (job.enabled) {
      await interaction.editReply({
        content: `ℹ️ Job "${jobName}" is already enabled.`,
      });
      return;
    }

    // Enable the job
    job.enabled = true;
    await job.save();

    logInfo('Enabled job', {
      discordUserId: interaction.user.id,
      jobName,
    });

    await interaction.editReply({
      content: `✅ Enabled job: **${jobName}**\n\nThe job will start running according to its schedule.`,
    });
  } catch (err) {
    logError('Error in /enablejob command', err instanceof Error ? err : new Error(String(err)));
    await interaction.editReply({
      content: '❌ Failed to enable job. Please try again later.',
    });
  }
}

// Autocomplete handler for job names
export async function autocomplete(interaction: any) {
  try {
    const focusedValue = interaction.options.getFocused();
    const jobs = await Job.find({ enabled: false }).sort({ name: 1 });
    
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
    logError('Error in enablejob autocomplete', error instanceof Error ? error : new Error(String(error)));
    await interaction.respond([]);
  }
}

export default { data, execute, autocomplete };
