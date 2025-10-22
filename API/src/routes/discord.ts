import express, { Request, Response } from 'express';
import axios from 'axios';
import { DiscordUser } from '../models/DiscordUser';
import { UserActivityCache } from '../models/UserActivityCache';
import { encrypt, decrypt } from '../utils/encryption';
import { DiscordUserManager } from '../services/DiscordUserManager';
import { logInfo, logError } from '../utils/logger';
import { authenticateDiscordBot } from '../middleware/discordAuth';
import { logApiCall } from '../utils/apiCallLogger';

const router = express.Router({ mergeParams: true });

interface TornUserBasicResponse {
  profile: {
    id: number;
    name: string;
    level: number;
    gender: string;
    status: {
      description: string;
      details: string | null;
      state: string;
      color: string;
      until: number | null;
    };
  };
}

interface SetKeyRequestBody {
  discordId: string;
  apiKey: string;
}

interface MinMaxRequestBody {
  discordId: string;
  userId?: number;
}

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

// POST /discord/setkey
router.post('/discord/setkey', authenticateDiscordBot, async (req: Request, res: Response): Promise<void> => {
  try {
    const { discordId, apiKey } = req.body as SetKeyRequestBody;

    // Validate input
    if (!discordId || !apiKey) {
      res.status(400).json({ 
        error: 'Missing required fields: discordId and apiKey are required' 
      });
      return;
    }

    logInfo('Setting Discord API key', { discordId });

    // Fetch user profile from Torn API to validate the key and get user info
    let tornUserData: TornUserBasicResponse;
    try {
      const response = await axios.get<TornUserBasicResponse>(
        `https://api.torn.com/v2/user?selections=basic&key=${apiKey}`
      );
      tornUserData = response.data;
      
      // Log the API call
      await logApiCall('user/basic', 'discord-route');
    } catch (error: any) {
      // Check if it's an axios error (either real or mocked)
      if (error.isAxiosError || (error.response && error.response.status)) {
        logError('Invalid Torn API key provided', error instanceof Error ? error : new Error(String(error)), {
          status: error.response?.status,
          discordId
        });
        res.status(400).json({ 
          error: 'Invalid API key or failed to fetch user data from Torn API' 
        });
        return;
      }
      throw error;
    }

    // Validate that the response has the expected structure
    if (!tornUserData || !tornUserData.profile || !tornUserData.profile.id) {
      logError('Invalid response from Torn API - missing profile data', new Error('Invalid API response structure'), {
        discordId,
        responseData: tornUserData
      });
      res.status(400).json({ 
        error: 'Invalid API key or failed to fetch user data from Torn API' 
      });
      return;
    }

    const { id: tornId, name, level } = tornUserData.profile;

    // Encrypt the API key before storing
    const encryptedApiKey = encrypt(apiKey);

    // Check if user already exists and update, or create new
    const existingUser = await DiscordUser.findOne({ discordId });

    if (existingUser) {
      // Update existing user
      existingUser.tornId = tornId;
      existingUser.name = name;
      existingUser.apiKey = encryptedApiKey;
      existingUser.level = level;
      await existingUser.save();

      logInfo('Updated existing Discord user', {
        discordId,
        tornId,
        name,
        level
      });
    } else {
      // Create new user
      const newUser = new DiscordUser({
        discordId,
        tornId,
        name,
        apiKey: encryptedApiKey,
        level
      });
      await newUser.save();

      logInfo('Created new Discord user', {
        discordId,
        tornId,
        name,
        level
      });
    }

    // Fetch and store battle stats
    try {
      await DiscordUserManager.fetchAndStoreBattleStats(discordId);
    } catch (error) {
      // Log the error but don't fail the request
      logError('Failed to fetch battle stats, but user was saved', error instanceof Error ? error : new Error(String(error)), {
        tornId,
        discordId
      });
    }

    res.status(200).json({
      success: true,
      message: 'API key set successfully',
      data: {
        discordId,
        tornId,
        name,
        level
      }
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      logError('Error setting Discord API key', err);
    } else {
      logError('Unknown error setting Discord API key', new Error(String(err)));
    }

    res.status(500).json({ error: 'Failed to set API key' });
  }
});

// POST /discord/minmax
router.post('/discord/minmax', authenticateDiscordBot, async (req: Request, res: Response): Promise<void> => {
  try {
    const { discordId, userId } = req.body as MinMaxRequestBody;

    // Validate input
    if (!discordId) {
      res.status(400).json({ 
        error: 'Missing required field: discordId' 
      });
      return;
    }

    logInfo('Fetching minmax stats', { discordId, userId });

    // Get the user's API key from the database
    const user = await DiscordUser.findOne({ discordId });
    
    if (!user || !user.apiKey) {
      res.status(400).json({
        error: 'You need to set your API key first. Use `/minmaxsetkey` to store your Torn API key. Note: Please use a limited API key for security purposes.'
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
      await logApiCall('user/personalstats', 'discord-minmax');
    } catch (error: any) {
      if (error.isAxiosError || (error.response && error.response.status)) {
        logError('Failed to fetch current personal stats', error instanceof Error ? error : new Error(String(error)), {
          status: error.response?.status,
          discordId,
          targetUserId
        });
        res.status(400).json({ 
          error: 'Failed to fetch personal stats from Torn API. Please check your API key and user ID.' 
        });
        return;
      }
      throw error;
    }

    // Fetch stats at midnight UTC (using stat=cityitemsbought,xantaken,refills for historical data)
    let midnightStats: PersonalStatsMidnightResponse;
    try {
      const response = await axios.get<PersonalStatsMidnightResponse>(
        `https://api.torn.com/v2/user/${targetUserId}/personalstats?stat=cityitemsbought,xantaken,refills&key=${apiKey}`
      );
      midnightStats = response.data;
      await logApiCall('user/personalstats', 'discord-minmax');
    } catch (error: any) {
      if (error.isAxiosError || (error.response && error.response.status)) {
        logError('Failed to fetch midnight personal stats', error instanceof Error ? error : new Error(String(error)), {
          status: error.response?.status,
          discordId,
          targetUserId,
          midnightTimestamp
        });
        res.status(400).json({ 
          error: 'Failed to fetch historical personal stats from Torn API.' 
        });
        return;
      }
      throw error;
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
          await logApiCall('user/education', 'discord-minmax');
          await logApiCall('user/money', 'discord-minmax');
          await logApiCall('user/virus', 'discord-minmax');

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

    const responseData: any = {
      userId: targetUserId,
      cityItemsBought: {
        current: itemsBoughtToday,
        target: 100,
        completed: itemsBoughtToday >= 100
      },
      xanaxTaken: {
        current: xanTakenToday,
        target: 3,
        completed: xanTakenToday >= 3
      },
      energyRefill: {
        current: refillsToday,
        target: 1,
        completed: refillsToday >= 1
      }
    };

    // Add activity data if available
    if (activityData) {
      if (activityData.education) {
        responseData.education = activityData.education;
      }
      if (activityData.investment) {
        responseData.investment = activityData.investment;
      }
      if (activityData.virusCoding) {
        responseData.virusCoding = activityData.virusCoding;
      }
    }

    res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      logError('Error fetching minmax stats', err);
    } else {
      logError('Unknown error fetching minmax stats', new Error(String(err)));
    }

    res.status(500).json({ error: 'Failed to fetch minmax stats' });
  }
});

export default router;
