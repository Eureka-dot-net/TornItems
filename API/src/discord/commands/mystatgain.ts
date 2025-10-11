import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { DiscordUser } from '../../models/DiscordUser';
import { DiscordUserManager } from '../../services/DiscordUserManager';
import { logInfo, logError } from '../../utils/logger';
import axios from 'axios';

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
  const stat = interaction.options.getString('stat', true);
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

    // Get predicted stat gains using DiscordUserManager with type
    const result = await DiscordUserManager.getPredictedStatGains(discordId, stat, type);
    
    if (!result) {
      await interaction.editReply({
        content: '❌ Failed to fetch your data from Torn API. Please make sure your API key is valid.',
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
    const statValue = battleStats[stat as keyof typeof battleStats] as number;
    const originalHappy = bars.happy.current;
    const adjustedHappy = DiscordUserManager.calculateAdjustedHappiness(originalHappy, type);
    const currentEnergy = bars.energy.current;
    const perkPerc = DiscordUserManager.parsePerkPercentage(perks, stat);
    const statDots = gymDetails[stat as keyof typeof gymDetails] as number;
    const dots = statDots / 10;

    // Calculate estimated energy
    let estimatedEnergy = currentEnergy + (numXanax * 250);
    if (pointsRefill) {
      estimatedEnergy += 150;
    }
    // Cap at 1000 for display purposes, but can go up to 1150 with points refill
    const cappedEstimatedEnergy = estimatedEnergy;

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

    // Capitalize stat name
    const statName = stat.charAt(0).toUpperCase() + stat.slice(1);

    // Create embed
    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('🏋️ Your Stat Gain Prediction')
      .addFields(
        { name: 'Stat', value: statName, inline: true },
        { name: 'Gym', value: `${gymDetails.name} (${dots} dots, ${gymDetails.energy}E)`, inline: false },
        { name: 'Stat Total', value: formatNumber(statValue), inline: true },
        { name: 'Happy', value: type === 1 ? formatNumber(originalHappy) : `${formatNumber(originalHappy)} → ${formatNumber(adjustedHappy)}`, inline: true },
        { name: 'Current Energy', value: formatNumber(currentEnergy), inline: true },
        { name: 'Estimated Energy', value: formatNumber(cappedEstimatedEnergy), inline: true },
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

    logInfo('Stat gain calculated for user', {
      discordUserId: interaction.user.id,
      tornId: user.tornId,
      stat,
      type,
      numXanax,
      pointsRefill,
      statValue,
      originalHappy,
      adjustedHappy,
      currentEnergy,
      estimatedEnergy: cappedEstimatedEnergy,
      perkPerc,
      gym: gymDetails.name,
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
