import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { MinMaxSubscription } from '../../models/MinMaxSubscription';
import { DiscordUser } from '../../models/DiscordUser';
import { logInfo, logError } from '../../utils/logger';

export const data = new SlashCommandBuilder()
  .setName('minmaxsub')
  .setDescription('Subscribe to daily minmax reminder notifications before server reset.')
  .addIntegerOption(option =>
    option
      .setName('hours-before-reset')
      .setDescription('Hours before UTC midnight (server reset) to notify you')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(23)
  )
  .addBooleanOption(option =>
    option
      .setName('notifyeducation')
      .setDescription('Notify if not enrolled in education (default: true)')
      .setRequired(false)
  )
  .addBooleanOption(option =>
    option
      .setName('notifyinvestment')
      .setDescription('Notify if not invested in city bank (default: true)')
      .setRequired(false)
  )
  .addBooleanOption(option =>
    option
      .setName('notifyvirus')
      .setDescription('Notify if not coding a virus (default: true)')
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const hoursBeforeReset = interaction.options.getInteger('hours-before-reset', true);
  const notifyEducation = interaction.options.getBoolean('notifyeducation');
  const notifyInvestment = interaction.options.getBoolean('notifyinvestment');
  const notifyVirus = interaction.options.getBoolean('notifyvirus');
  const discordUserId = interaction.user.id;
  const channelId = interaction.channelId;

  await interaction.deferReply({ ephemeral: true });

  try {
    // Check if user has registered their API key
    const user = await DiscordUser.findOne({ discordId: discordUserId });
    
    if (!user) {
      await interaction.editReply({
        content: '❌ You must first set your API key using `/minmaxsetkey` before setting up minmax notifications.',
      });
      return;
    }

    // Check if subscription already exists
    let subscription = await MinMaxSubscription.findOne({ discordUserId });

    const effectiveNotifyEducation = notifyEducation !== null ? notifyEducation : true;
    const effectiveNotifyInvestment = notifyInvestment !== null ? notifyInvestment : true;
    const effectiveNotifyVirus = notifyVirus !== null ? notifyVirus : true;

    if (subscription) {
      // Update existing subscription
      subscription.channelId = channelId;
      subscription.hoursBeforeReset = hoursBeforeReset;
      subscription.notifyEducation = effectiveNotifyEducation;
      subscription.notifyInvestment = effectiveNotifyInvestment;
      subscription.notifyVirus = effectiveNotifyVirus;
      subscription.enabled = true;
      subscription.lastNotificationSent = null; // Reset to ensure notification is sent
      await subscription.save();

      logInfo('Updated minmax subscription', {
        discordUserId,
        channelId,
        hoursBeforeReset,
        notifyEducation: effectiveNotifyEducation,
        notifyInvestment: effectiveNotifyInvestment,
        notifyVirus: effectiveNotifyVirus
      });
    } else {
      // Create new subscription
      subscription = new MinMaxSubscription({
        discordUserId,
        channelId,
        hoursBeforeReset,
        notifyEducation: effectiveNotifyEducation,
        notifyInvestment: effectiveNotifyInvestment,
        notifyVirus: effectiveNotifyVirus,
        enabled: true,
        lastNotificationSent: null
      });
      await subscription.save();

      logInfo('Created minmax subscription', {
        discordUserId,
        channelId,
        hoursBeforeReset,
        notifyEducation: effectiveNotifyEducation,
        notifyInvestment: effectiveNotifyInvestment,
        notifyVirus: effectiveNotifyVirus
      });
    }

    // Calculate notification time
    const notificationHour = (24 - hoursBeforeReset) % 24;
    const notificationTimeStr = `${notificationHour.toString().padStart(2, '0')}:00 UTC`;

    // Build notification settings message
    const notificationSettings = [];
    if (effectiveNotifyEducation) notificationSettings.push('Education');
    if (effectiveNotifyInvestment) notificationSettings.push('Investment');
    if (effectiveNotifyVirus) notificationSettings.push('Virus Coding');

    const message = [
      `✅ **Minmax Subscription Active**`,
      '',
      `📅 **Notification Time:** ${notificationTimeStr} (${hoursBeforeReset} hours before reset)`,
      `📍 **Channel:** <#${channelId}>`,
      '',
      `**What we'll check:**`,
      `• ✅ City items bought (100/day)`,
      `• ✅ Xanax taken (3/day)`,
      `• ✅ Energy refills (1/day)`,
      notificationSettings.length > 0 ? `• ✅ Activities: ${notificationSettings.join(', ')}` : '',
      '',
      `You'll receive ONE notification per day if you haven't completed these tasks.`,
      '',
      `To unsubscribe, use \`/minmaxunsub\``
    ].filter(line => line !== '').join('\n');

    await interaction.editReply({
      content: message,
    });
  } catch (err) {
    logError('Error in /minmaxsub command', err instanceof Error ? err : new Error(String(err)));
    await interaction.editReply({
      content: '❌ Failed to set up minmax subscription. Please try again later.',
    });
  }
}

export default { data, execute };
