import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import axios from 'axios';
import { DiscordUser } from '../../models/DiscordUser';
import { decrypt } from '../../utils/encryption';
import { logInfo, logError } from '../../utils/logger';
import { logApiCall } from '../../utils/apiCallLogger';

export const data = new SlashCommandBuilder()
  .setName('minmax')
  .setDescription('Check daily task completion status (market items, xanax, energy refill).')
  .addIntegerOption(option =>
    option
      .setName('userid')
      .setDescription('Torn user ID to check (optional, defaults to yourself).')
      .setRequired(false)
  );

// Response format for current stats (cat=all)
interface PersonalStatsCurrentResponse {
  personalstats: {
    trading: {
      items: {
        bought: {
          market: number;
          shops: number;
        };
      };
    };
    drugs: {
      xanax: number;
    };
    other: {
      refills: {
        energy: number;
      };
    };
  };
}

// Response format for midnight stats (stat=cityitemsbought,xantaken,refills)
interface PersonalStatsMidnightResponse {
  personalstats: Array<{
    name: string;
    value: number;
    timestamp: number;
  }>;
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const userId = interaction.options.getInteger('userid');
  const discordId = interaction.user.id;

  await interaction.reply({ content: '📊 Fetching daily task status...', ephemeral: true });

  try {
    logInfo('Fetching minmax stats via bot command', { discordId, userId });

    // Get the user's API key from the database
    const user = await DiscordUser.findOne({ discordId });
    
    if (!user || !user.apiKey) {
      await interaction.editReply({
        content: '❌ You need to set your API key first.\nUse `/setkey` to store your Torn API key.',
      });
      return;
    }

    // Decrypt the API key
    const apiKey = decrypt(user.apiKey);

    // Determine which user's stats to fetch (default to the user's own tornId)
    const targetUserId = userId || user.tornId;

    // Get current UTC midnight timestamp
    const now = new Date();
    const midnightUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const midnightTimestamp = Math.floor(midnightUTC.getTime() / 1000);

    // Fetch current stats (using cat=all for current data)
    let currentStats: PersonalStatsCurrentResponse;
    try {
      const response = await axios.get<PersonalStatsCurrentResponse>(
        `https://api.torn.com/v2/user/${targetUserId}/personalstats?cat=all&key=${apiKey}`
      );
      currentStats = response.data;
      await logApiCall('user/personalstats', 'discord-command-minmax');
    } catch (error: any) {
      logError('Failed to fetch current personal stats', error instanceof Error ? error : new Error(String(error)), {
        status: error.response?.status,
        discordId,
        targetUserId
      });
      await interaction.editReply({
        content: '❌ Failed to fetch personal stats from Torn API. Please check your API key and user ID.',
      });
      return;
    }

    // Fetch stats at midnight UTC (using stat=cityitemsbought,xantaken,refills for historical data)
    let midnightStats: PersonalStatsMidnightResponse;
    try {
      const response = await axios.get<PersonalStatsMidnightResponse>(
        `https://api.torn.com/v2/user/${targetUserId}/personalstats?stat=cityitemsbought,xantaken,refills&key=${apiKey}`
      );
      midnightStats = response.data;
      await logApiCall('user/personalstats', 'discord-command-minmax');
    } catch (error: any) {
      logError('Failed to fetch midnight personal stats', error instanceof Error ? error : new Error(String(error)), {
        status: error.response?.status,
        discordId,
        targetUserId,
        midnightTimestamp
      });
      await interaction.editReply({
        content: '❌ Failed to fetch historical personal stats from Torn API.',
      });
      return;
    }

    // Helper function to find stat value from midnight stats array
    const getStatValue = (stats: PersonalStatsMidnightResponse, statName: string): number => {
      const stat = stats.personalstats.find(s => s.name === statName);
      return stat ? stat.value : 0;
    };

    // Extract current values from nested structure
    const currentItemsBought = currentStats.personalstats.trading.items.bought.shops;
    const currentXanTaken = currentStats.personalstats.drugs.xanax;
    const currentRefills = currentStats.personalstats.other.refills.energy;

    // Extract midnight values from flat array
    const midnightItemsBought = getStatValue(midnightStats, 'cityitemsbought');
    const midnightXanTaken = getStatValue(midnightStats, 'xantaken');
    const midnightRefills = getStatValue(midnightStats, 'refills');

    // Calculate daily progress
    const itemsBoughtToday = currentItemsBought - midnightItemsBought;
    const xanTakenToday = currentXanTaken - midnightXanTaken;
    const refillsToday = currentRefills - midnightRefills;

    // Format the response
    const itemsIcon = itemsBoughtToday >= 100 ? '✅' : '❌';
    const xanIcon = xanTakenToday >= 3 ? '✅' : '❌';
    const refillIcon = refillsToday >= 1 ? '✅' : '❌';

    const message = [
      `**Daily Task Completion${userId ? ` for User ID ${userId}` : ''}:**`,
      '',
      `${itemsIcon} **City Items Bought:** ${itemsBoughtToday}/100`,
      `${xanIcon} **Xanax Taken:** ${xanTakenToday}/3`,
      `${refillIcon} **Energy Refill:** ${refillsToday}/1`,
    ].join('\n');

    await interaction.editReply({
      content: message,
    });
  } catch (err) {
    logError('Error in /minmax command', err instanceof Error ? err : new Error(String(err)));
    await interaction.editReply({
      content: '❌ Failed to fetch daily task status. Please try again later.',
    });
  }
}

export default { data, execute };
