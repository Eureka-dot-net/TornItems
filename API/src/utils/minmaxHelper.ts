import axios from 'axios';
import { DiscordUser } from '../models/DiscordUser';
import { UserActivityCache } from '../models/UserActivityCache';
import { decrypt } from '../utils/encryption';
import { logApiCall } from '../utils/apiCallLogger';
import { logError } from '../utils/logger';

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

export interface MinMaxStatus {
  userId: number;
  cityItemsBought: {
    current: number;
    target: number;
    completed: boolean;
  };
  xanaxTaken: {
    current: number;
    target: number;
    completed: boolean;
  };
  energyRefill: {
    current: number;
    target: number;
    completed: boolean;
  };
  education?: {
    active: boolean;
    until: number | null;
  };
  investment?: {
    active: boolean;
    until: number | null;
  };
  virusCoding?: {
    active: boolean;
    until: number | null;
  };
}

/**
 * Fetch minmax status for a user
 * @param discordId - Discord user ID
 * @param targetUserId - Optional target user ID (defaults to user's own tornId)
 * @param includeActivities - Whether to include education, investment, virus data
 * @returns MinMaxStatus object
 */
export async function fetchMinMaxStatus(
  discordId: string,
  targetUserId?: number,
  includeActivities: boolean = true
): Promise<MinMaxStatus> {
  // Get the user's API key from the database
  const user = await DiscordUser.findOne({ discordId });
  
  if (!user || !user.apiKey) {
    throw new Error('User has not set their API key');
  }

  // Decrypt the API key
  const apiKey = decrypt(user.apiKey);

  // Determine which user's stats to fetch (default to the user's own tornId)
  const userId = targetUserId || user.tornId;

  // Get current UTC midnight timestamp
  const now = new Date();
  const midnightUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const midnightTimestamp = Math.floor(midnightUTC.getTime() / 1000);

  // Fetch current stats (using cat=all for current data)
  let currentStats: PersonalStatsCurrentResponse;
  try {
    const response = await axios.get<PersonalStatsCurrentResponse>(
      `https://api.torn.com/v2/user/${userId}/personalstats?cat=all&key=${apiKey}`
    );
    currentStats = response.data;
    await logApiCall('user/personalstats', 'minmax-helper');
  } catch (error: any) {
    if (error.isAxiosError || (error.response && error.response.status)) {
      throw new Error('Failed to fetch personal stats from Torn API');
    }
    throw error;
  }

  // Fetch stats at midnight UTC (using stat=cityitemsbought,xantaken,refills for historical data)
  let midnightStats: PersonalStatsMidnightResponse;
  try {
    const response = await axios.get<PersonalStatsMidnightResponse>(
      `https://api.torn.com/v2/user/${userId}/personalstats?stat=cityitemsbought,xantaken,refills&key=${apiKey}`
    );
    midnightStats = response.data;
    await logApiCall('user/personalstats', 'minmax-helper');
  } catch (error: any) {
    if (error.isAxiosError || (error.response && error.response.status)) {
      throw new Error('Failed to fetch historical personal stats from Torn API');
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

  // Build base response
  const result: MinMaxStatus = {
    userId,
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

  // Fetch education, investment, and virus data only if requested and checking own user
  const shouldFetchActivityData = includeActivities && (!targetUserId || userId === user.tornId);

  if (shouldFetchActivityData) {
    // Check if we have cached data
    const cachedData = await UserActivityCache.findOne({ discordId });
    const currentTime = new Date();
    const currentTimestamp = currentTime.getTime();
    const oneHourAgo = currentTimestamp - 3600000; // 1 hour in milliseconds
    
    // Helper function to check if we need to refresh an activity
    const needsRefresh = (activity: { active: boolean; until: number | null; lastFetched: Date | null } | null): boolean => {
      if (!activity || !activity.lastFetched) {
        return true; // Never fetched before
      }
      
      // If not active, always refresh (no caching for inactive activities)
      if (!activity.active) {
        return true;
      }
      
      // If active, check if we're past the until time
      if (activity.until && currentTimestamp > activity.until * 1000) {
        return true;
      }
      
      // Refresh if data is older than 1 hour
      if (activity.lastFetched.getTime() < oneHourAgo) {
        return true;
      }
      
      return false;
    };

    // Determine which activities need to be fetched
    const fetchEducation = !cachedData || needsRefresh(cachedData.education);
    const fetchInvestment = !cachedData || needsRefresh(cachedData.investment);
    const fetchVirusCoding = !cachedData || needsRefresh(cachedData.virusCoding);

    // Initialize activity data from cache if available
    const activityData: {
      education?: { active: boolean; until: number | null };
      investment?: { active: boolean; until: number | null };
      virusCoding?: { active: boolean; until: number | null };
    } = {
      education: cachedData?.education && !fetchEducation ? { active: cachedData.education.active, until: cachedData.education.until } : undefined,
      investment: cachedData?.investment && !fetchInvestment ? { active: cachedData.investment.active, until: cachedData.investment.until } : undefined,
      virusCoding: cachedData?.virusCoding && !fetchVirusCoding ? { active: cachedData.virusCoding.active, until: cachedData.virusCoding.until } : undefined
    };

    // Fetch only the activities that need refreshing
    if (fetchEducation || fetchInvestment || fetchVirusCoding) {
      try {
        const apiCalls: Promise<any>[] = [];
        
        if (fetchEducation) {
          apiCalls.push(
            axios.get<EducationResponse>(`https://api.torn.com/v2/user/education?key=${apiKey}`)
              .then(response => ({ type: 'education', data: response.data }))
              .catch(() => ({ type: 'education', data: {} as EducationResponse }))
          );
        }
        
        if (fetchInvestment) {
          apiCalls.push(
            axios.get<MoneyResponse>(`https://api.torn.com/v2/user/money?key=${apiKey}`)
              .then(response => ({ type: 'investment', data: response.data }))
              .catch(() => ({ type: 'investment', data: {} as MoneyResponse }))
          );
        }
        
        if (fetchVirusCoding) {
          apiCalls.push(
            axios.get<VirusResponse>(`https://api.torn.com/v2/user/virus?key=${apiKey}`)
              .then(response => ({ type: 'virusCoding', data: response.data }))
              .catch(() => ({ type: 'virusCoding', data: {} as VirusResponse }))
          );
        }

        const responses = await Promise.all(apiCalls);

        // Process each response
        for (const response of responses as Array<{ type: string; data: any }>) {
          if (response.type === 'education') {
            await logApiCall('user/education', 'minmax-helper');
            const educationResponse = response.data as EducationResponse;
            const educationActive = !!(educationResponse.education?.current && educationResponse.education.current.id > 0);
            const educationUntil = educationActive ? (educationResponse.education?.current?.until || null) : null;
            
            activityData.education = { active: educationActive, until: educationUntil };
            
            // Update cache for education
            if (cachedData) {
              cachedData.education = { active: educationActive, until: educationUntil, lastFetched: currentTime };
            }
          } else if (response.type === 'investment') {
            await logApiCall('user/money', 'minmax-helper');
            const moneyResponse = response.data as MoneyResponse;
            const investmentActive = !!(moneyResponse.money?.city_bank && moneyResponse.money.city_bank.amount > 0);
            const investmentUntil = investmentActive ? (moneyResponse.money?.city_bank?.until || null) : null;
            
            activityData.investment = { active: investmentActive, until: investmentUntil };
            
            // Update cache for investment
            if (cachedData) {
              cachedData.investment = { active: investmentActive, until: investmentUntil, lastFetched: currentTime };
            }
          } else if (response.type === 'virusCoding') {
            await logApiCall('user/virus', 'minmax-helper');
            const virusResponse = response.data as VirusResponse;
            const virusActive = !!(virusResponse.virus?.item && virusResponse.virus.item.id > 0);
            const virusUntil = virusActive ? (virusResponse.virus?.until || null) : null;
            
            activityData.virusCoding = { active: virusActive, until: virusUntil };
            
            // Update cache for virus coding
            if (cachedData) {
              cachedData.virusCoding = { active: virusActive, until: virusUntil, lastFetched: currentTime };
            }
          }
        }

        // Save or create cache
        if (cachedData) {
          await cachedData.save();
        } else {
          const newCache = new UserActivityCache({
            discordId,
            tornId: user.tornId,
            education: activityData.education ? { ...activityData.education, lastFetched: currentTime } : null,
            investment: activityData.investment ? { ...activityData.investment, lastFetched: currentTime } : null,
            virusCoding: activityData.virusCoding ? { ...activityData.virusCoding, lastFetched: currentTime } : null
          });
          await newCache.save();
        }
      } catch (error) {
        // Log error but don't fail the request
        logError('Failed to fetch activity data in helper', error instanceof Error ? error : new Error(String(error)), {
          discordId,
          userId
        });
      }
    }

    // Add activity data to result
    if (activityData.education) {
      result.education = activityData.education;
    }
    if (activityData.investment) {
      result.investment = activityData.investment;
    }
    if (activityData.virusCoding) {
      result.virusCoding = activityData.virusCoding;
    }
  }

  return result;
}
