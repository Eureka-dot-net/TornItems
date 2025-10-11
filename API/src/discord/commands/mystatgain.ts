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
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const stat = interaction.options.getString('stat', true);
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

    // Get predicted stat gains using DiscordUserManager
    const result = await DiscordUserManager.getPredictedStatGains(discordId, stat);
    
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
    const happy = bars.happy.current;
    const currentEnergy = bars.energy.current;
    const perkPerc = DiscordUserManager.parsePerkPercentage(perks, stat);
    const statDots = gymDetails[stat as keyof typeof gymDetails] as number;
    const dots = statDots / 10;

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
