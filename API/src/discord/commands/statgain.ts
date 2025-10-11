import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Gym, IGym } from '../../models/Gym';
import { logInfo, logError } from '../../utils/logger';

// Function to build the command data with gym choices
export async function buildCommandData() {
  const builder = new SlashCommandBuilder()
    .setName('statgain')
    .setDescription('Predict stat gain per train and per 150 energy using Vladar\'s gym formula.')
    .addStringOption(option =>
      option
        .setName('stat')
        .setDescription('The stat to train')
        .setRequired(true)
        .addChoices(
          { name: 'Strength', value: 'strength' },
          { name: 'Speed', value: 'speed' },
          { name: 'Defense', value: 'defense' },
          { name: 'Dexterity', value: 'dexterity' }
        )
    )
    .addNumberOption(option =>
      option
        .setName('amount')
        .setDescription('Your current stat total')
        .setRequired(true)
        .setMinValue(0)
    )
    .addNumberOption(option =>
      option
        .setName('happy')
        .setDescription('Your current happy value')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(100000)
    )
    .addNumberOption(option =>
      option
        .setName('perkperc')
        .setDescription('Your perk percentage bonus (e.g., 2 for 2%)')
        .setRequired(true)
        .setMinValue(0)
    );

  // Fetch gyms from database and add as choices (limit to 25 due to Discord API limit)
  try {
    const gyms = await Gym.find().sort({ displayName: 1 }).limit(25);
    const gymChoices = gyms.map(gym => ({
      name: gym.displayName,
      value: gym.name,
    }));

    builder.addStringOption(option => {
      const opt = option
        .setName('gym')
        .setDescription('Select a gym (default: Pour Femme)')
        .setRequired(false);
      
      if (gymChoices.length > 0) {
        opt.addChoices(...gymChoices);
      }
      
      return opt;
    });
  } catch (error) {
    // If we can't fetch gyms, just add a basic string option
    console.warn('Could not fetch gyms for command choices:', error);
    builder.addStringOption(option =>
      option
        .setName('gym')
        .setDescription('Gym name (default: pourfemme)')
        .setRequired(false)
    );
  }

  return builder;
}

// Export a static data object for compatibility
export const data = new SlashCommandBuilder()
  .setName('statgain')
  .setDescription('Predict stat gain per train and per 150 energy using Vladar\'s gym formula.')
  .addStringOption(option =>
    option
      .setName('stat')
      .setDescription('The stat to train')
      .setRequired(true)
      .addChoices(
        { name: 'Strength', value: 'strength' },
        { name: 'Speed', value: 'speed' },
        { name: 'Defense', value: 'defense' },
        { name: 'Dexterity', value: 'dexterity' }
      )
  )
  .addNumberOption(option =>
    option
      .setName('amount')
      .setDescription('Your current stat total')
      .setRequired(true)
      .setMinValue(0)
  )
  .addNumberOption(option =>
    option
      .setName('happy')
      .setDescription('Your current happy value')
      .setRequired(true)
      .setMinValue(0)
      .setMaxValue(100000)
  )
  .addNumberOption(option =>
    option
      .setName('perkperc')
      .setDescription('Your perk percentage bonus (e.g., 2 for 2%)')
      .setRequired(true)
      .setMinValue(0)
  )
  .addStringOption(option =>
    option
      .setName('gym')
      .setDescription('Gym name (default: pourfemme)')
      .setRequired(false)
  );

interface StatGainResult {
  perTrain: number;
  per150Energy: number;
}

function computeStatGain(
  stat: string,
  statTotal: number,
  happy: number,
  perkPerc: number,
  gym: IGym
): StatGainResult {
  const lookupTable: Record<string, [number, number]> = {
    strength: [1600, 1700],
    speed: [1600, 2000],
    defense: [2100, -600],
    dexterity: [1800, 1500],
  };
  
  const [lookup2, lookup3] = lookupTable[stat];

  // Get the dots value for this stat from the gym
  const dots = (gym as any)[stat];
  if (dots === null || dots === undefined) {
    throw new Error(`This gym does not support training ${stat}`);
  }

  // Adjusted stat for values over 50M (cap adjustment)
  const adjustedStat =
    statTotal < 50_000_000
      ? statTotal
      : (statTotal - 50_000_000) / (8.77635 * Math.log(statTotal)) + 50_000_000;

  // Happy multiplier with proper rounding as in spreadsheet
  const innerRound = Math.round(Math.log(1 + happy / 250) * 10000) / 10000;
  const happyMult = Math.round((1 + 0.07 * innerRound) * 10000) / 10000;
  
  // Perk bonus multiplier
  const perkBonus = 1 + perkPerc / 100;

  // Vladar's formula components
  const baseTerm = (1 / 200000) * dots * gym.energyPerTrain * perkBonus * adjustedStat * happyMult;
  const happyPowerTerm = (8 * Math.pow(happy, 1.05)) / 10000;
  const lookup2Term = (lookup2 * (1 - Math.pow(happy / 99999, 2))) / 10000;
  const lookup3Term = lookup3 / 10000;

  const gain = baseTerm + happyPowerTerm + lookup2Term + lookup3Term;

  return {
    perTrain: gain,
    per150Energy: gain * (150 / gym.energyPerTrain),
  };
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const stat = interaction.options.getString('stat', true);
  const amount = interaction.options.getNumber('amount', true);
  const happy = interaction.options.getNumber('happy', true);
  const perkPerc = interaction.options.getNumber('perkperc', true);
  const gymName = interaction.options.getString('gym') || 'pourfemme';

  await interaction.deferReply({ ephemeral: true });

  try {
    // Validate inputs
    if (amount < 0) {
      await interaction.editReply({
        content: '❌ Stat amount cannot be negative.',
      });
      return;
    }

    if (happy < 0 || happy > 100000) {
      await interaction.editReply({
        content: '❌ Happy value must be between 0 and 100,000.',
      });
      return;
    }

    if (perkPerc < 0) {
      await interaction.editReply({
        content: '❌ Perk percentage cannot be negative.',
      });
      return;
    }

    // Fetch the gym from the database
    const gym = await Gym.findOne({ name: gymName });
    
    if (!gym) {
      await interaction.editReply({
        content: `❌ Gym "${gymName}" not found. Please make sure gyms are seeded in the database.`,
      });
      return;
    }

    // Check if the gym supports training this stat
    const statDots = (gym as any)[stat];
    if (statDots === null || statDots === undefined) {
      await interaction.editReply({
        content: `❌ ${gym.displayName} does not support training ${stat}.`,
      });
      return;
    }

    // Compute stat gain
    const result = computeStatGain(stat, amount, happy, perkPerc, gym);

    // Format numbers with commas
    const formatNumber = (num: number): string => {
      return num.toLocaleString('en-US', { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
    };

    // Capitalize stat name
    const statName = stat.charAt(0).toUpperCase() + stat.slice(1);

    // Create embed
    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('🏋️ Stat Gain Prediction')
      .addFields(
        { name: 'Stat', value: statName, inline: true },
        { name: 'Gym', value: `${gym.displayName} (${statDots} dots, ${gym.energyPerTrain}E)`, inline: false },
        { name: 'Stat Total', value: formatNumber(amount), inline: true },
        { name: 'Happy', value: formatNumber(happy), inline: true },
        { name: 'Perks', value: `+${perkPerc}%`, inline: true },
        { name: '\u200B', value: '\u200B', inline: false },
        { name: 'Per Train', value: `+${result.perTrain.toFixed(2)} ${statName}`, inline: true },
        { name: 'Per 150 Energy', value: `+${result.per150Energy.toFixed(2)} ${statName}`, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({
      embeds: [embed],
    });

    logInfo('Stat gain calculated', {
      discordUserId: interaction.user.id,
      stat,
      amount,
      happy,
      perkPerc,
      gym: gymName,
      perTrain: result.perTrain,
      per150Energy: result.per150Energy,
    });
  } catch (err) {
    logError('Error in /statgain command', err instanceof Error ? err : new Error(String(err)));
    await interaction.editReply({
      content: '❌ Failed to calculate stat gain. Please try again later.',
    });
  }
}

export default { data, execute };
