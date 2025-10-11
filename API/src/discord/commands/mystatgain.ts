import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { DiscordUser } from '../../models/DiscordUser';
import { DiscordUserManager } from '../../services/DiscordUserManager';
import { logInfo, logError } from '../../utils/logger';
import axios from 'axios';

export const data = new SlashCommandBuilder()
  .setName('mystatgain')
  .setDescription('Get your predicted stat gain based on your current Torn stats.')
  .addNumberOption(option =>
    option
      .setName('strengthweight')
      .setDescription('Weight for strength training (0-1.5, e.g., 1.0)')
      .setRequired(true)
      .setMinValue(0)
  )
  .addNumberOption(option =>
    option
      .setName('speedweight')
      .setDescription('Weight for speed training (0-1.5, e.g., 1.0)')
      .setRequired(true)
      .setMinValue(0)
  )
  .addNumberOption(option =>
    option
      .setName('dexterityweight')
      .setDescription('Weight for dexterity training (0-1.5, e.g., 1.5)')
      .setRequired(true)
      .setMinValue(0)
  )
  .addNumberOption(option =>
    option
      .setName('defenseweight')
      .setDescription('Weight for defense training (0-1.5, e.g., 0)')
      .setRequired(true)
      .setMinValue(0)
  )
  .addIntegerOption(option =>
    option
      .setName('type')
      .setDescription('Happiness boost type')
      .setRequired(true)
      .addChoices(
        { name: 'None', value: 1 },
        { name: 'eDvD jump', value: 2 },
        { name: 'Lollipop / e jump', value: 3 },
        { name: 'Box of chocolates / e jump', value: 4 }
      )
  )
  .addIntegerOption(option =>
    option
      .setName('numxanax')
      .setDescription('Number of Xanax to use')
      .setRequired(true)
      .addChoices(
        { name: '0', value: 0 },
        { name: '1', value: 1 },
        { name: '2', value: 2 },
        { name: '3', value: 3 },
        { name: '4', value: 4 }
      )
  )
  .addBooleanOption(option =>
    option
      .setName('pointsrefill')
      .setDescription('Use points refill for energy (adds 150E)')
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const strengthWeight = interaction.options.getNumber('strengthweight', true);
  const speedWeight = interaction.options.getNumber('speedweight', true);
  const dexterityWeight = interaction.options.getNumber('dexterityweight', true);
  const defenseWeight = interaction.options.getNumber('defenseweight', true);
  const type = interaction.options.getInteger('type', true);
  const numXanax = interaction.options.getInteger('numxanax', true);
  const pointsRefill = interaction.options.getBoolean('pointsrefill', true);
  const discordId = interaction.user.id;

  await interaction.deferReply({ ephemeral: true });

  try {
    // Check if user exists
    const user = await DiscordUser.findOne({ discordId });
    
    if (!user) {
      await interaction.editReply({
        content: '❌ You need to set your Torn API key first using `/setkey`.',
      });
      return;
    }

    // Fetch user data for display purposes
    const userData = await DiscordUserManager.getUserStatGainData(discordId);
    if (!userData) {
      await interaction.editReply({
        content: '❌ Failed to fetch your data from Torn API.',
      });
      return;
    }

    const { bars, battleStats, perks, gymInfo } = userData;
    const { gymDetails } = gymInfo;

    // Get values for display
    const originalHappy = bars.happy.current;
    const adjustedHappy = DiscordUserManager.calculateAdjustedHappiness(originalHappy, type);
    const currentEnergy = bars.energy.current;
    const energyPerTrain = gymDetails.energy;

    // Calculate estimated energy
    // If not using Xanax, assume full natural energy bar (150)
    // Otherwise, cap Xanax energy at 1000, then add points refill (can reach 1150)
    let estimatedEnergy;
    if (numXanax === 0) {
      // No Xanax: use full natural energy (150)
      estimatedEnergy = 150;
    } else {
      // With Xanax: cap at 1000
      estimatedEnergy = Math.min(currentEnergy + (numXanax * 250), 1000);
    }
    if (pointsRefill) {
      estimatedEnergy += 150;
    }

    // Define stat weights
    const weights = {
      strength: strengthWeight,
      speed: speedWeight,
      dexterity: dexterityWeight,
      defense: defenseWeight
    };

    // Check which stats can be trained at this gym and filter weights
    const trainableStats: { stat: string; weight: number; dots: number }[] = [];
    for (const [stat, weight] of Object.entries(weights)) {
      const statDots = gymDetails[stat as keyof typeof gymDetails] as number;
      if (statDots > 0 && weight > 0) {
        trainableStats.push({ stat, weight, dots: statDots / 10 });
      }
    }

    // Check if there are any trainable stats
    if (trainableStats.length === 0) {
      await interaction.editReply({
        content: '❌ No stats can be trained with the given weights at your current gym, or all weights are 0.',
      });
      return;
    }

    // Calculate total weight
    const totalWeight = trainableStats.reduce((sum, s) => sum + s.weight, 0);

    // Calculate energy distribution and gains for each stat
    interface StatResult {
      stat: string;
      statName: string;
      energySpent: number;
      trainsCount: number;
      perTrain: number;
      totalGain: number;
      statValue: number;
    }

    const statResults: StatResult[] = [];
    let totalGain = 0;

    for (const { stat, weight, dots } of trainableStats) {
      // Calculate energy for this stat
      const energyForStat = Math.floor((estimatedEnergy * weight) / totalWeight);
      const trainsCount = Math.floor(energyForStat / energyPerTrain);
      const actualEnergySpent = trainsCount * energyPerTrain;

      // Get stat value
      const statValue = battleStats[stat as keyof typeof battleStats] as number;

      // Get perk percentage for this stat
      const perkPerc = DiscordUserManager.parsePerkPercentage(perks, stat);

      // Calculate per train gain using the stat gain calculator
      const result = await DiscordUserManager.getPredictedStatGains(discordId, stat, type);
      if (!result) {
        continue;
      }

      const perTrain = result.perTrain;
      
      // Calculate cumulative gain accounting for stat increases during training
      const { computeCumulativeStatGain } = await import('../../utils/statGainCalculator');
      const cumulativeResult = computeCumulativeStatGain(
        stat,
        statValue,
        adjustedHappy,
        perkPerc,
        dots,
        energyPerTrain,
        trainsCount
      );
      
      const totalGainForStat = cumulativeResult.totalGain;
      totalGain += totalGainForStat;

      const statName = stat.charAt(0).toUpperCase() + stat.slice(1);
      statResults.push({
        stat,
        statName,
        energySpent: actualEnergySpent,
        trainsCount,
        perTrain,
        totalGain: totalGainForStat,
        statValue
      });
    }

    // Calculate leftover energy and add it to the stat with the highest weight
    const totalEnergySpent = statResults.reduce((sum, r) => sum + r.energySpent, 0);
    const leftoverEnergy = estimatedEnergy - totalEnergySpent;
    
    if (leftoverEnergy >= energyPerTrain) {
      // Find the stat with the highest weight
      const highestWeightStat = trainableStats.reduce((max, current) => 
        current.weight > max.weight ? current : max
      );
      
      // Find the corresponding result
      const statResultIndex = statResults.findIndex(r => r.stat === highestWeightStat.stat);
      if (statResultIndex !== -1) {
        const extraTrains = Math.floor(leftoverEnergy / energyPerTrain);
        const extraEnergy = extraTrains * energyPerTrain;
        
        statResults[statResultIndex].trainsCount += extraTrains;
        statResults[statResultIndex].energySpent += extraEnergy;
        statResults[statResultIndex].totalGain += statResults[statResultIndex].perTrain * extraTrains;
        totalGain += statResults[statResultIndex].perTrain * extraTrains;
      }
    }

    // Get estimated cost including Xanax and points refill
    let costInfo: { total: number; breakdown: string } | null = null;
    if (type !== 1 || numXanax > 0 || pointsRefill) {
      costInfo = await DiscordUserManager.calculateEstimatedCost(type, numXanax, pointsRefill);
    }

    // Format numbers with commas
    const formatNumber = (num: number): string => {
      return num.toLocaleString('en-US', { 
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
    };

    // Create table display for stats
    let tableDisplay = '```\n';
    tableDisplay += 'Stat       | Per Train | Energy | Gain\n';
    tableDisplay += '-----------|-----------|--------|------------\n';
    
    for (const result of statResults) {
      const statPadded = result.statName.padEnd(10);
      const perTrainStr = `+${result.perTrain.toFixed(2)}`.padStart(9);
      const energyStr = formatNumber(result.energySpent).padStart(6);
      const gainStr = `+${formatNumber(Math.round(result.totalGain))}`.padStart(11);
      tableDisplay += `${statPadded} | ${perTrainStr} | ${energyStr} | ${gainStr}\n`;
    }
    
    tableDisplay += '-----------|-----------|--------|------------\n';
    tableDisplay += `${'Total'.padEnd(10)} | ${' '.padStart(9)} | ${formatNumber(statResults.reduce((sum, r) => sum + r.energySpent, 0)).padStart(6)} | ${`+${formatNumber(Math.round(totalGain))}`.padStart(11)}\n`;
    tableDisplay += '```';

    // Create embed
    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('🏋️ Your Stat Gain Prediction')
      .addFields(
        { name: 'Gym', value: `${gymDetails.name} (${energyPerTrain}E per train)`, inline: false },
        { name: 'Happy', value: type === 1 ? formatNumber(originalHappy) : `${formatNumber(originalHappy)} → ${formatNumber(adjustedHappy)}`, inline: true },
        { name: 'Current Energy', value: formatNumber(currentEnergy), inline: true },
        { name: 'Estimated Energy', value: formatNumber(estimatedEnergy), inline: true },
        { name: '\u200B', value: '\u200B', inline: false },
        { name: 'Training Distribution', value: tableDisplay, inline: false }
      );

    // Add cost information if available
    if (costInfo) {
      embed.addFields(
        { name: '\u200B', value: '\u200B', inline: false },
        { name: '💰 Estimated Cost', value: `**Total: $${formatNumber(costInfo.total)}**\n${costInfo.breakdown}`, inline: false }
      );
    }

    embed.setTimestamp();

    await interaction.editReply({
      embeds: [embed],
    });

    logInfo('Multi-stat gain calculated for user', {
      discordUserId: interaction.user.id,
      tornId: user.tornId,
      weights: { strengthWeight, speedWeight, dexterityWeight, defenseWeight },
      type,
      numXanax,
      pointsRefill,
      originalHappy,
      adjustedHappy,
      currentEnergy,
      estimatedEnergy,
      gym: gymDetails.name,
      totalGain,
      statResults: statResults.map(r => ({ stat: r.stat, energy: r.energySpent, gain: r.totalGain }))
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
