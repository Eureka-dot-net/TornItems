import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { MinMaxSubscription } from '../../models/MinMaxSubscription';
import { DiscordUser } from '../../models/DiscordUser';
import { logInfo, logError } from '../../utils/logger';

export const data = new SlashCommandBuilder()
  .setName('minmaxsub')
  .setDescription('Subscribe to daily minmax reminder notifications before 00:00 tct.')
  .addIntegerOption(option =>
    option
      .setName('hours-before-midnight-tct')
      .setDescription('Hours before tct midnight to notify you')
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
  )
  .addBooleanOption(option =>
    option
      .setName('notifyoc')
      .setDescription('Notify if not in faction OC (default: true)')
      .setRequired(false)
  )
  .addBooleanOption(option =>
    option
      .setName('notifywheellame')
      .setDescription('Notify if Wheel of Lame not spun (default: true)')
      .setRequired(false)
  )
  .addBooleanOption(option =>
    option
      .setName('notifywheelmediocre')
      .setDescription('Notify if Wheel of Mediocrity not spun (default: true)')
      .setRequired(false)
  )
  .addBooleanOption(option =>
    option
      .setName('notifywheelawesomeness')
      .setDescription('Notify if Wheel of Awesomeness not spun (default: true)')
      .setRequired(false)
  )
  .addBooleanOption(option =>
    option
      .setName('notifyskimmers')
      .setDescription('Notify if not having 20 skimmers active (default: true)')
      .setRequired(false)
  )
  .addBooleanOption(option =>
    option
      .setName('notifyenergyrefill')
      .setDescription('Notify if energy refill not used (default: false)')
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const hoursBeforeReset = interaction.options.getInteger('hours-before-midnight-tct', true);
  const notifyEducation = interaction.options.getBoolean('notifyeducation');
  const notifyInvestment = interaction.options.getBoolean('notifyinvestment');
  const notifyVirus = interaction.options.getBoolean('notifyvirus');
  const notifyOC = interaction.options.getBoolean('notifyoc');
  const notifyWheelLame = interaction.options.getBoolean('notifywheellame');
  const notifyWheelMediocre = interaction.options.getBoolean('notifywheelmediocre');
  const notifyWheelAwesomeness = interaction.options.getBoolean('notifywheelawesomeness');
  const notifySkimmers = interaction.options.getBoolean('notifyskimmers');
  const notifyEnergyRefill = interaction.options.getBoolean('notifyenergyrefill');
  const discordUserId = interaction.user.id;
  const channelId = interaction.channelId;

  await interaction.deferReply();

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

    const effectiveNotifyEducation = notifyEducation !== null ? notifyEducation : false;
    const effectiveNotifyInvestment = notifyInvestment !== null ? notifyInvestment : false;
    const effectiveNotifyVirus = notifyVirus !== null ? notifyVirus : false;
    const effectiveNotifyOC = notifyOC !== null ? notifyOC : false;
    const effectiveNotifyWheelLame = notifyWheelLame !== null ? notifyWheelLame : false;
    const effectiveNotifyWheelMediocre = notifyWheelMediocre !== null ? notifyWheelMediocre : false;
    const effectiveNotifyWheelAwesomeness = notifyWheelAwesomeness !== null ? notifyWheelAwesomeness : false;
    const effectiveNotifySkimmers = notifySkimmers !== null ? notifySkimmers : false;
    const effectiveNotifyEnergyRefill = notifyEnergyRefill !== null ? notifyEnergyRefill : false;

    if (subscription) {
      // Update existing subscription
      subscription.channelId = channelId;
      subscription.hoursBeforeReset = hoursBeforeReset;
      subscription.notifyEducation = effectiveNotifyEducation;
      subscription.notifyInvestment = effectiveNotifyInvestment;
      subscription.notifyVirus = effectiveNotifyVirus;
      subscription.notifyOC = effectiveNotifyOC;
      subscription.notifyWheelLame = effectiveNotifyWheelLame;
      subscription.notifyWheelMediocre = effectiveNotifyWheelMediocre;
      subscription.notifyWheelAwesomeness = effectiveNotifyWheelAwesomeness;
      subscription.notifySkimmers = effectiveNotifySkimmers;
      subscription.notifyEnergyRefill = effectiveNotifyEnergyRefill;
      subscription.enabled = true;
      subscription.lastNotificationSent = null; // Reset to ensure notification is sent
      await subscription.save();

      logInfo('Updated minmax subscription', {
        discordUserId,
        channelId,
        hoursBeforeReset,
        notifyEducation: effectiveNotifyEducation,
        notifyInvestment: effectiveNotifyInvestment,
        notifyVirus: effectiveNotifyVirus,
        notifyOC: effectiveNotifyOC,
        notifyWheelLame: effectiveNotifyWheelLame,
        notifyWheelMediocre: effectiveNotifyWheelMediocre,
        notifyWheelAwesomeness: effectiveNotifyWheelAwesomeness,
        notifySkimmers: effectiveNotifySkimmers,
        notifyEnergyRefill: effectiveNotifyEnergyRefill
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
        notifyOC: effectiveNotifyOC,
        notifyWheelLame: effectiveNotifyWheelLame,
        notifyWheelMediocre: effectiveNotifyWheelMediocre,
        notifyWheelAwesomeness: effectiveNotifyWheelAwesomeness,
        notifySkimmers: effectiveNotifySkimmers,
        notifyEnergyRefill: effectiveNotifyEnergyRefill,
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
        notifyVirus: effectiveNotifyVirus,
        notifyOC: effectiveNotifyOC,
        notifyWheelLame: effectiveNotifyWheelLame,
        notifyWheelMediocre: effectiveNotifyWheelMediocre,
        notifyWheelAwesomeness: effectiveNotifyWheelAwesomeness,
        notifySkimmers: effectiveNotifySkimmers,
        notifyEnergyRefill: effectiveNotifyEnergyRefill
      });
    }

    const notificationHour = (24 - hoursBeforeReset) % 24;

    const now = new Date();
    let notificationDateUTC = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      notificationHour,
      0,
      0
    ));

    if (notificationDateUTC.getTime() < now.getTime()) {
      notificationDateUTC = new Date(notificationDateUTC.getTime() + 24 * 60 * 60 * 1000);
    }

    const unixTimestamp = Math.floor(notificationDateUTC.getTime() / 1000);
    const localTimeTag = `<t:${unixTimestamp}:t>`;
    const relativeTimeTag = `<t:${unixTimestamp}:R>`;

    const notificationSettings = [];
    if (effectiveNotifyEducation) notificationSettings.push('Education');
    if (effectiveNotifyInvestment) notificationSettings.push('Investment');
    if (effectiveNotifyVirus) notificationSettings.push('Virus Coding');
    if (effectiveNotifyOC) notificationSettings.push('Faction OC');
    if (effectiveNotifyWheelLame) notificationSettings.push('Wheel of Lame');
    if (effectiveNotifyWheelMediocre) notificationSettings.push('Wheel of Mediocrity');
    if (effectiveNotifyWheelAwesomeness) notificationSettings.push('Wheel of Awesomeness');
    if (effectiveNotifySkimmers) notificationSettings.push('Skimmers');
    if (effectiveNotifyEnergyRefill) notificationSettings.push('Energy Refill');

    const embed = new EmbedBuilder()
      .setTitle('✅ Minmax Subscription Active')
      .setColor(0x2ecc71)
      .addFields(
        { name: '📅 Local Time', value: localTimeTag, inline: true },
        { name: '⏱ When', value: relativeTimeTag, inline: true },
        { name: '🌐 Offset', value: `${hoursBeforeReset} hours before 00:00 tct`, inline: true },
        { name: '📍 Channel', value: `<#${channelId}>`, inline: false },
        {
          name: 'What we’ll check',
          value: [
            '• ✅ City items bought (100/day)',
            '• ✅ Casino tickets (75/day) - requires full API key',
            notificationSettings.length > 0 ? `• ✅ Optional: ${notificationSettings.join(', ')}` : ''
          ].filter(Boolean).join('\n')
        },
        { name: '\u200B', value: "You'll receive ONE notification per day if you haven't completed these tasks.\n\nTo unsubscribe, use `/minmaxunsub`" }
      );

    await interaction.editReply({
      embeds: [embed], 
    });
  } catch (err) {
    logError('Error in /minmaxsub command', err instanceof Error ? err : new Error(String(err)));
    await interaction.editReply({
      content: '❌ Failed to set up minmax subscription. Please try again later.',
    });
  }
}

export default { data, execute };
