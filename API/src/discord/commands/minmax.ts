import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import axios from 'axios';
import { DiscordUser } from '../../models/DiscordUser';
import { UserActivityCache } from '../../models/UserActivityCache';
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

// Response format for education API
interface EducationResponse {
  education?: {
    complete?: number[];
    current?: {
      id: number;
      until: number;
    } | null;
  };
}

// Response format for money API (city_bank)
interface MoneyResponse {
  money?: {
    points?: number;
    wallet?: number;
    company?: number;
    vault?: number;
    cayman_bank?: number;
    city_bank?: {
      amount: number;
      until: number;
    } | null;
    faction?: {
      money: number;
      points: number;
    };
    daily_networth?: number;
  };
}

// Response format for virus API
interface VirusResponse {
  virus?: {
    item?: {
      id: number;
      name: string;
    } | null;
    until?: number;
  } | null;
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
        content: '❌ You need to set your API key first.\nUse `/minmaxsetkey` to store your Torn API key.\n\n**Note:** Please use a limited API key for security purposes.',
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

    // Fetch education, investment, and virus data only if userId is not provided or matches the calling user
    let activityData: {
      education?: { active: boolean; until: number | null };
      investment?: { active: boolean; until: number | null };
      virusCoding?: { active: boolean; until: number | null };
    } | undefined;

    const shouldFetchActivityData = !userId || userId === user.tornId;

    if (shouldFetchActivityData) {
      // Check if we have cached data that is still valid
      const cachedData = await UserActivityCache.findOne({ discordId });
      const currentTime = new Date();
      
      let needsRefresh = true;
      if (cachedData && cachedData.expiresAt > currentTime) {
        needsRefresh = false;
        activityData = {
          education: cachedData.education ? cachedData.education : undefined,
          investment: cachedData.investment ? cachedData.investment : undefined,
          virusCoding: cachedData.virusCoding ? cachedData.virusCoding : undefined
        };
      }

      if (needsRefresh) {
        try {
          // Fetch all three APIs in parallel
          const [educationResponse, moneyResponse, virusResponse] = await Promise.all([
            axios.get<EducationResponse>(`https://api.torn.com/v2/user/education?key=${apiKey}`).catch(() => ({ data: {} as EducationResponse })),
            axios.get<MoneyResponse>(`https://api.torn.com/v2/user/money?key=${apiKey}`).catch(() => ({ data: {} as MoneyResponse })),
            axios.get<VirusResponse>(`https://api.torn.com/v2/user/virus?key=${apiKey}`).catch(() => ({ data: {} as VirusResponse }))
          ]);

          // Log the API calls
          await logApiCall('user/education', 'discord-command-minmax');
          await logApiCall('user/money', 'discord-command-minmax');
          await logApiCall('user/virus', 'discord-command-minmax');

          // Process education data
          const educationActive = !!(educationResponse.data.education?.current && educationResponse.data.education.current.id > 0);
          const educationUntil = educationActive ? (educationResponse.data.education?.current?.until || null) : null;

          // Process investment data (city_bank)
          const investmentActive = !!(moneyResponse.data.money?.city_bank && moneyResponse.data.money.city_bank.amount > 0);
          const investmentUntil = investmentActive ? (moneyResponse.data.money?.city_bank?.until || null) : null;

          // Process virus coding data
          const virusActive = !!(virusResponse.data.virus?.item && virusResponse.data.virus.item.id > 0);
          const virusUntil = virusActive ? (virusResponse.data.virus?.until || null) : null;

          // Calculate expiration time: minimum of 1 hour from now and the earliest "until" time
          const oneHourFromNow = Date.now() + 3600000; // 1 hour in milliseconds
          const untilTimes = [
            educationUntil ? educationUntil * 1000 : Infinity,
            investmentUntil ? investmentUntil * 1000 : Infinity,
            virusUntil ? virusUntil * 1000 : Infinity
          ];
          const earliestUntil = Math.min(...untilTimes);
          const expiresAtTimestamp = Math.min(oneHourFromNow, earliestUntil === Infinity ? oneHourFromNow : earliestUntil);

          // Save to cache
          activityData = {
            education: { active: educationActive, until: educationUntil },
            investment: { active: investmentActive, until: investmentUntil },
            virusCoding: { active: virusActive, until: virusUntil }
          };

          if (cachedData) {
            cachedData.education = activityData.education || null;
            cachedData.investment = activityData.investment || null;
            cachedData.virusCoding = activityData.virusCoding || null;
            cachedData.lastFetched = currentTime;
            cachedData.expiresAt = new Date(expiresAtTimestamp);
            await cachedData.save();
          } else {
            const newCache = new UserActivityCache({
              discordId,
              tornId: user.tornId,
              education: activityData.education || null,
              investment: activityData.investment || null,
              virusCoding: activityData.virusCoding || null,
              lastFetched: currentTime,
              expiresAt: new Date(expiresAtTimestamp)
            });
            await newCache.save();
          }
        } catch (error) {
          // Log error but don't fail the request
          logError('Failed to fetch activity data, continuing without it', error instanceof Error ? error : new Error(String(error)), {
            discordId,
            targetUserId
          });
        }
      }
    }

    // Format the response
    const itemsIcon = itemsBoughtToday >= 100 ? '✅' : '❌';
    const xanIcon = xanTakenToday >= 3 ? '✅' : '❌';
    const refillIcon = refillsToday >= 1 ? '✅' : '❌';

    const messageParts = [
      `**Daily Task Completion${userId ? ` for User ID ${userId}` : ''}:**`,
      '',
      `${itemsIcon} **City Items Bought:** ${itemsBoughtToday}/100`,
      `${xanIcon} **Xanax Taken:** ${xanTakenToday}/3`,
      `${refillIcon} **Energy Refill:** ${refillsToday}/1`,
    ];

    // Add activity data if available
    if (activityData && (activityData.education || activityData.investment || activityData.virusCoding)) {
      messageParts.push('');
      messageParts.push('**Active Activities:**');
      
      if (activityData.education) {
        const educationIcon = activityData.education.active ? '✅' : '❌';
        messageParts.push(`${educationIcon} **Education:** ${activityData.education.active ? 'Yes' : 'No'}`);
      }
      
      if (activityData.investment) {
        const investmentIcon = activityData.investment.active ? '✅' : '❌';
        messageParts.push(`${investmentIcon} **Investment:** ${activityData.investment.active ? 'Yes' : 'No'}`);
      }
      
      if (activityData.virusCoding) {
        const virusIcon = activityData.virusCoding.active ? '✅' : '❌';
        messageParts.push(`${virusIcon} **Virus Coding:** ${activityData.virusCoding.active ? 'Yes' : 'No'}`);
      }
    }

    const message = messageParts.join('\n');

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
