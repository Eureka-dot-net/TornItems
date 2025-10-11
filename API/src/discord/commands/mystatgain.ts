import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import axios from 'axios';
import { DiscordUser } from '../../models/DiscordUser';
import { Gym } from '../../models/Gym';
import { decrypt } from '../../utils/encryption';
import { logInfo, logError } from '../../utils/logger';

export const data = new SlashCommandBuilder()
  .setName('mystatgain')
  .setDescription('Get your predicted stat gain based on your current Torn stats.')
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
  );

interface TornBarsResponse {
  bars: {
    energy: {
      current: number;
      maximum: number;
    };
    happy: {
      current: number;
      maximum: number;
    };
  };
}

interface TornBattleStatsResponse {
  battlestats: {
    strength: {
      value: number;
      modifier: number;
      modifiers?: Array<{ effect: string; value: number; type: string }>;
    };
    defense: {
      value: number;
      modifier: number;
      modifiers?: Array<{ effect: string; value: number; type: string }>;
    };
    speed: {
      value: number;
      modifier: number;
      modifiers?: Array<{ effect: string; value: number; type: string }>;
    };
    dexterity: {
      value: number;
      modifier: number;
      modifiers?: Array<{ effect: string; value: number; type: string }>;
    };
    total: number;
  };
}

interface TornPerksResponse {
  faction_perks: string[];
  job_perks: string[];
  property_perks: string[];
  education_perks: string[];
  enhancer_perks: string[];
  book_perks: string[];
  stock_perks: string[];
  merit_perks: string[];
}

interface TornGymResponse {
  active_gym: number;
}

interface TornGymsResponse {
  gyms: {
    [key: string]: {
      name: string;
      stage: number;
      cost: number;
      energy: number;
      strength: number;
      speed: number;
      defense: number;
      dexterity: number;
      note: string;
    };
  };
}

interface StatGainResult {
  perTrain: number;
  per150Energy: number;
  perCurrentEnergy: number;
}

/**
 * Parse perk percentage from perk strings
 * @param perks - All perks from the user
 * @param stat - The stat to filter for
 * @returns The total perk percentage bonus
 */
function parsePerkPercentage(perks: TornPerksResponse, stat: string): number {
  // Combine all perk arrays
  const allPerks = [
    ...perks.faction_perks,
    ...perks.property_perks,
    ...perks.merit_perks,
    ...perks.education_perks,
    ...perks.job_perks,
    ...perks.book_perks,
    ...perks.stock_perks,
    ...perks.enhancer_perks
  ];

  let totalMultiplier = 1;

  // Look for gym gain perks
  const gymGainPattern = /\+\s*(\d+)%\s+gym\s+gains/i;
  const statGymGainPattern = new RegExp(`\\+\\s*(\\d+)%\\s+${stat}\\s+gym\\s+gains`, 'i');

  for (const perk of allPerks) {
    // Check for general gym gains
    const generalMatch = perk.match(gymGainPattern);
    if (generalMatch) {
      const percentage = parseInt(generalMatch[1], 10);
      totalMultiplier *= (1 + percentage / 100);
    }

    // Check for stat-specific gym gains
    const statMatch = perk.match(statGymGainPattern);
    if (statMatch) {
      const percentage = parseInt(statMatch[1], 10);
      totalMultiplier *= (1 + percentage / 100);
    }
  }

  // Convert multiplier back to percentage (e.g., 1.02 * 1.01 = 1.0302 -> 3.02%)
  const totalPercentage = (totalMultiplier - 1) * 100;
  
  return totalPercentage;
}

/**
 * Compute stat gain using Vladar's formula
 */
function computeStatGain(
  stat: string,
  statTotal: number,
  happy: number,
  perkPerc: number,
  dots: number,
  energyPerTrain: number,
  currentEnergy: number
): StatGainResult {
  const lookupTable: Record<string, [number, number]> = {
    strength: [1600, 1700],
    speed: [1600, 2000],
    defense: [2100, -600],
    dexterity: [1800, 1500],
  };
  
  const [lookup2, lookup3] = lookupTable[stat];

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

  // Vladar's formula
  // The entire expression (adjustedStat * happyMult + 8*happy^1.05 + lookup2*(1-(happy/99999)^2) + lookup3)
  // is multiplied by (1/200000) * dots * energyPerTrain * perkBonus
  const multiplier = (1 / 200000) * dots * energyPerTrain * perkBonus;
  const innerExpression = 
    adjustedStat * happyMult + 
    8 * Math.pow(happy, 1.05) + 
    lookup2 * (1 - Math.pow(happy / 99999, 2)) + 
    lookup3;

  const gain = multiplier * innerExpression;

  return {
    perTrain: gain,
    per150Energy: gain * (150 / energyPerTrain),
    perCurrentEnergy: gain * (currentEnergy / energyPerTrain),
  };
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const stat = interaction.options.getString('stat', true);
  const discordId = interaction.user.id;

  await interaction.deferReply({ ephemeral: true });

  try {
    // Get the user from the database
    const user = await DiscordUser.findOne({ discordId });
    
    if (!user) {
      await interaction.editReply({
        content: '❌ You need to set your Torn API key first using `/setkey`.',
      });
      return;
    }

    // Decrypt the API key
    const apiKey = decrypt(user.apiKey);

    // Fetch all required data from Torn API
    const [barsResponse, battleStatsResponse, perksResponse, gymResponse] = await Promise.all([
      axios.get<TornBarsResponse>(`https://api.torn.com/v2/user/bars?key=${apiKey}`),
      axios.get<TornBattleStatsResponse>(`https://api.torn.com/v2/user/battlestats?key=${apiKey}`),
      axios.get<TornPerksResponse>(`https://api.torn.com/v2/user?selections=perks&key=${apiKey}`),
      axios.get<TornGymResponse>(`https://api.torn.com/v2/user?selections=gym&key=${apiKey}`),
    ]);

    const { bars } = barsResponse.data;
    const { battlestats } = battleStatsResponse.data;
    const perks = perksResponse.data;
    const { active_gym } = gymResponse.data;

    // Get gym data from Torn API
    const gymsResponse = await axios.get<TornGymsResponse>(
      `https://api.torn.com/v2/torn?selections=gyms&key=${apiKey}`
    );
    const tornGym = gymsResponse.data.gyms[active_gym.toString()];

    if (!tornGym) {
      await interaction.editReply({
        content: `❌ Could not find your active gym (ID: ${active_gym}).`,
      });
      return;
    }

    // Get the stat value
    const statValue = battlestats[stat as keyof typeof battlestats].value;
    const happy = bars.happy.current;
    const currentEnergy = bars.energy.current;

    // Parse perk percentage
    const perkPerc = parsePerkPercentage(perks, stat);

    // Get the dots value for this stat (convert from Torn API format to dots)
    const statDots = tornGym[stat as keyof typeof tornGym] as number;
    if (statDots === 0) {
      await interaction.editReply({
        content: `❌ ${tornGym.name} does not support training ${stat}.`,
      });
      return;
    }

    // Convert Torn API gym value to dots (divide by 10)
    const dots = statDots / 10;
    const energyPerTrain = tornGym.energy;

    // Compute stat gain
    const result = computeStatGain(stat, statValue, happy, perkPerc, dots, energyPerTrain, currentEnergy);

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
      .setTitle('🏋️ Your Stat Gain Prediction')
      .addFields(
        { name: 'Stat', value: statName, inline: true },
        { name: 'Gym', value: `${tornGym.name} (${dots} dots, ${energyPerTrain}E)`, inline: false },
        { name: 'Stat Total', value: formatNumber(statValue), inline: true },
        { name: 'Happy', value: formatNumber(happy), inline: true },
        { name: 'Current Energy', value: formatNumber(currentEnergy), inline: true },
        { name: 'Perks', value: `+${perkPerc.toFixed(2)}%`, inline: true },
        { name: '\u200B', value: '\u200B', inline: false }
      );

    // Add energy-specific calculations
    if (currentEnergy > 0 && currentEnergy !== 150) {
      embed.addFields(
        { name: 'Per Train', value: `+${result.perTrain.toFixed(2)} ${statName}`, inline: true },
        { name: `Per ${formatNumber(currentEnergy)} Energy`, value: `+${result.perCurrentEnergy.toFixed(2)} ${statName}`, inline: true },
        { name: 'Per 150 Energy', value: `+${result.per150Energy.toFixed(2)} ${statName}`, inline: true }
      );
    } else {
      embed.addFields(
        { name: 'Per Train', value: `+${result.perTrain.toFixed(2)} ${statName}`, inline: true },
        { name: 'Per 150 Energy', value: `+${result.per150Energy.toFixed(2)} ${statName}`, inline: true }
      );
    }

    embed.setTimestamp();

    await interaction.editReply({
      embeds: [embed],
    });

    logInfo('Stat gain calculated for user', {
      discordUserId: interaction.user.id,
      tornId: user.tornId,
      stat,
      statValue,
      happy,
      currentEnergy,
      perkPerc,
      gym: tornGym.name,
      perTrain: result.perTrain,
      per150Energy: result.per150Energy,
    });
  } catch (err: any) {
    logError('Error in /mystatgain command', err instanceof Error ? err : new Error(String(err)));
    
    // Check if it's an API error
    if (axios.isAxiosError(err) && err.response) {
      if (err.response.status === 401 || err.response.status === 403) {
        await interaction.editReply({
          content: '❌ Your API key is invalid or expired. Please update it using `/setkey`.',
        });
        return;
      }
    }
    
    await interaction.editReply({
      content: '❌ Failed to calculate stat gain. Please try again later.',
    });
  }
}

export default { data, execute };
