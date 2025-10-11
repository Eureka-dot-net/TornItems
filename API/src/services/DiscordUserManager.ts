import axios from 'axios';
import { DiscordUser } from '../models/DiscordUser';
import { BattleStats } from '../models/BattleStats';
import { decrypt } from '../utils/encryption';
import { logInfo, logError } from '../utils/logger';
import { computeStatGain, computeStatGainWithCurrentEnergy, StatGainResult, StatGainResultWithCurrentEnergy } from '../utils/statGainCalculator';
import { 
  TornBarsResponse, 
  TornBattleStatsResponse, 
  TornPerksResponse, 
  TornGymResponse, 
  TornGymData, 
  TornGymsResponse 
} from '../types/tornApiTypes';

/**
 * User Data Aggregation
 */
export interface UserBars {
  energy: {
    current: number;
    maximum: number;
  };
  happy: {
    current: number;
    maximum: number;
  };
  nerve: {
    current: number;
    maximum: number;
  };
  life: {
    current: number;
    maximum: number;
  };
}

export interface UserBattleStats {
  strength: number;
  defense: number;
  speed: number;
  dexterity: number;
  total: number;
}

export interface UserGymInfo {
  activeGymId: number;
  gymDetails: TornGymData;
}

/**
 * DiscordUserManager
 * Centralized service for fetching and managing Discord user data from Torn API
 */
export class DiscordUserManager {
  /**
   * Get user's API key from database
   */
  static async getUserApiKey(discordId: string): Promise<string | null> {
    try {
      const user = await DiscordUser.findOne({ discordId });
      if (!user) {
        return null;
      }
      return decrypt(user.apiKey);
    } catch (error) {
      logError('Failed to get user API key', error instanceof Error ? error : new Error(String(error)), {
        discordId
      });
      throw error;
    }
  }

  /**
   * Get user's bars (energy, happy, nerve, life) from Torn API
   */
  static async getUserBars(discordId: string): Promise<UserBars | null> {
    try {
      const apiKey = await this.getUserApiKey(discordId);
      if (!apiKey) {
        return null;
      }

      const response = await axios.get<TornBarsResponse>(
        `https://api.torn.com/v2/user/bars?key=${apiKey}`
      );

      const { bars } = response.data;
      return {
        energy: {
          current: bars.energy.current,
          maximum: bars.energy.maximum,
        },
        happy: {
          current: bars.happy.current,
          maximum: bars.happy.maximum,
        },
        nerve: {
          current: bars.nerve.current,
          maximum: bars.nerve.maximum,
        },
        life: {
          current: bars.life.current,
          maximum: bars.life.maximum,
        },
      };
    } catch (error) {
      logError('Failed to fetch user bars', error instanceof Error ? error : new Error(String(error)), {
        discordId
      });
      throw error;
    }
  }

  /**
   * Get user's battle stats from Torn API
   */
  static async getUserBattleStats(discordId: string): Promise<UserBattleStats | null> {
    try {
      const apiKey = await this.getUserApiKey(discordId);
      if (!apiKey) {
        return null;
      }

      const response = await axios.get<TornBattleStatsResponse>(
        `https://api.torn.com/v2/user/battlestats?key=${apiKey}`
      );

      const { battlestats } = response.data;
      return {
        strength: battlestats.strength.value,
        defense: battlestats.defense.value,
        speed: battlestats.speed.value,
        dexterity: battlestats.dexterity.value,
        total: battlestats.total,
      };
    } catch (error) {
      logError('Failed to fetch user battle stats', error instanceof Error ? error : new Error(String(error)), {
        discordId
      });
      throw error;
    }
  }

  /**
   * Fetch and store user's battle stats in database
   */
  static async fetchAndStoreBattleStats(discordId: string): Promise<void> {
    try {
      const user = await DiscordUser.findOne({ discordId });
      if (!user) {
        throw new Error('User not found');
      }

      const apiKey = decrypt(user.apiKey);
      const response = await axios.get<TornBattleStatsResponse>(
        `https://api.torn.com/v2/user/battlestats?key=${apiKey}`
      );

      const { battlestats } = response.data;

      // Create new battle stats record
      const stats = new BattleStats({
        tornId: user.tornId,
        strength: battlestats.strength.value,
        defense: battlestats.defense.value,
        speed: battlestats.speed.value,
        dexterity: battlestats.dexterity.value,
        total: battlestats.total,
        recordedAt: new Date()
      });

      await stats.save();

      logInfo(`Battle stats saved for Torn ID: ${user.tornId}`, {
        total: battlestats.total
      });
    } catch (error) {
      logError('Failed to fetch and store battle stats', error instanceof Error ? error : new Error(String(error)), {
        discordId
      });
      throw error;
    }
  }

  /**
   * Get user's perks from Torn API
   */
  static async getUserPerks(discordId: string): Promise<TornPerksResponse | null> {
    try {
      const apiKey = await this.getUserApiKey(discordId);
      if (!apiKey) {
        return null;
      }

      const response = await axios.get<TornPerksResponse>(
        `https://api.torn.com/v2/user?selections=perks&key=${apiKey}`
      );

      return response.data;
    } catch (error) {
      logError('Failed to fetch user perks', error instanceof Error ? error : new Error(String(error)), {
        discordId
      });
      throw error;
    }
  }

  /**
   * Get user's active gym and gym details from Torn API
   */
  static async getUserGymInfo(discordId: string): Promise<UserGymInfo | null> {
    try {
      const apiKey = await this.getUserApiKey(discordId);
      if (!apiKey) {
        return null;
      }

      // Fetch active gym ID
      const gymResponse = await axios.get<TornGymResponse>(
        `https://api.torn.com/v2/user?selections=gym&key=${apiKey}`
      );
      const { active_gym } = gymResponse.data;

      // Fetch all gyms to get details
      const gymsResponse = await axios.get<TornGymsResponse>(
        `https://api.torn.com/v2/torn?selections=gyms&key=${apiKey}`
      );
      const gymDetails = gymsResponse.data.gyms[active_gym.toString()];

      if (!gymDetails) {
        throw new Error(`Gym with ID ${active_gym} not found`);
      }

      return {
        activeGymId: active_gym,
        gymDetails,
      };
    } catch (error) {
      logError('Failed to fetch user gym info', error instanceof Error ? error : new Error(String(error)), {
        discordId
      });
      throw error;
    }
  }

  /**
   * Get all user data needed for stat gain calculations
   */
  static async getUserStatGainData(discordId: string): Promise<{
    bars: UserBars;
    battleStats: UserBattleStats;
    perks: TornPerksResponse;
    gymInfo: UserGymInfo;
  } | null> {
    try {
      const apiKey = await this.getUserApiKey(discordId);
      if (!apiKey) {
        return null;
      }

      // Fetch all data in parallel for efficiency
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

      // Get gym details
      const gymsResponse = await axios.get<TornGymsResponse>(
        `https://api.torn.com/v2/torn?selections=gyms&key=${apiKey}`
      );
      const gymDetails = gymsResponse.data.gyms[active_gym.toString()];

      if (!gymDetails) {
        throw new Error(`Gym with ID ${active_gym} not found`);
      }

      return {
        bars: {
          energy: {
            current: bars.energy.current,
            maximum: bars.energy.maximum,
          },
          happy: {
            current: bars.happy.current,
            maximum: bars.happy.maximum,
          },
          nerve: {
            current: bars.nerve.current,
            maximum: bars.nerve.maximum,
          },
          life: {
            current: bars.life.current,
            maximum: bars.life.maximum,
          },
        },
        battleStats: {
          strength: battlestats.strength.value,
          defense: battlestats.defense.value,
          speed: battlestats.speed.value,
          dexterity: battlestats.dexterity.value,
          total: battlestats.total,
        },
        perks,
        gymInfo: {
          activeGymId: active_gym,
          gymDetails,
        },
      };
    } catch (error) {
      logError('Failed to fetch user stat gain data', error instanceof Error ? error : new Error(String(error)), {
        discordId
      });
      throw error;
    }
  }

  /**
   * Parse perk percentage from user's perks
   * @param perks - User's perks from Torn API
   * @param stat - The stat to calculate perks for
   * @returns Total perk percentage bonus
   */
  static parsePerkPercentage(perks: TornPerksResponse, stat: string): number {
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
   * Calculate adjusted happiness based on happiness boost type
   * @param currentHappiness - Current happiness value
   * @param type - Type of happiness boost (1-4)
   * @returns Adjusted happiness value
   */
  static calculateAdjustedHappiness(currentHappiness: number, type: number): number {
    switch (type) {
      case 1: // None
        return currentHappiness;
      case 2: // eDvD jump
        return (currentHappiness + 52500) * 2;
      case 3: // Lollipop / e jump
        return (currentHappiness + 49 * 25) * 2;
      case 4: // Box of chocolates / e jump
        return (currentHappiness + 49 * 35) * 2;
      default:
        return currentHappiness;
    }
  }

  /**
   * Calculate estimated cost for happiness boost type
   * @param type - Type of happiness boost (1-4)
   * @returns Estimated cost or null if type is 1, object with cost and breakdown
   */
  static async calculateEstimatedCost(type: number): Promise<{ 
    total: number; 
    breakdown: string;
  } | null> {
    if (type === 1) {
      return null;
    }

    const { TornItem } = await import('../models/TornItem');
    
    let itemIds: number[] = [];
    let quantities: number[] = [];
    let itemNames: string[] = [];
    
    switch (type) {
      case 2: // 5 * item 366 + item 197
        itemIds = [366, 197];
        quantities = [5, 1];
        itemNames = ['eDvD (x5)', 'Energy Drink'];
        break;
      case 3: // 49 * item 310 + item 197
        itemIds = [310, 197];
        quantities = [49, 1];
        itemNames = ['Lollipop (x49)', 'Energy Drink'];
        break;
      case 4: // 49 * item 36 + item 197
        itemIds = [36, 197];
        quantities = [49, 1];
        itemNames = ['Box of Chocolates (x49)', 'Energy Drink'];
        break;
      default:
        return null;
    }

    try {
      const items = await TornItem.find({ itemId: { $in: itemIds } });
      let total = 0;
      const breakdownParts: string[] = [];

      for (let i = 0; i < itemIds.length; i++) {
        const item = items.find(it => it.itemId === itemIds[i]);
        if (item && item.market_price) {
          const cost = item.market_price * quantities[i];
          total += cost;
          breakdownParts.push(`${itemNames[i]}: $${cost.toLocaleString()}`);
        } else {
          breakdownParts.push(`${itemNames[i]}: Price unavailable`);
        }
      }

      return {
        total,
        breakdown: breakdownParts.join('\n')
      };
    } catch (error) {
      logError('Failed to calculate estimated cost', error instanceof Error ? error : new Error(String(error)), {
        type
      });
      return null;
    }
  }

  /**
   * Calculate predicted stat gains for a user
   * @param discordId - Discord user ID
   * @param stat - The stat to calculate gains for
   * @param type - Optional happiness boost type (1-4)
   * @returns Stat gain predictions or null if user not found
   */
  static async getPredictedStatGains(
    discordId: string, 
    stat: string,
    type: number = 1
  ): Promise<StatGainResultWithCurrentEnergy | null> {
    try {
      const data = await this.getUserStatGainData(discordId);
      if (!data) {
        return null;
      }

      const { bars, battleStats, perks, gymInfo } = data;
      const { gymDetails } = gymInfo;

      // Get stat value
      const statValue = battleStats[stat as keyof typeof battleStats] as number;
      let happy = bars.happy.current;
      const currentEnergy = bars.energy.current;

      // Adjust happiness based on type
      happy = this.calculateAdjustedHappiness(happy, type);

      // Parse perk percentage
      const perkPerc = this.parsePerkPercentage(perks, stat);

      // Get dots value for this stat (convert from Torn API format to dots)
      const statDots = gymDetails[stat as keyof typeof gymDetails] as number;
      if (statDots === 0) {
        throw new Error(`${gymDetails.name} does not support training ${stat}`);
      }

      // Convert Torn API gym value to dots (divide by 10)
      const dots = statDots / 10;
      const energyPerTrain = gymDetails.energy;

      // Compute stat gain
      return computeStatGainWithCurrentEnergy(
        stat, 
        statValue, 
        happy, 
        perkPerc, 
        dots, 
        energyPerTrain, 
        currentEnergy
      );
    } catch (error) {
      logError('Failed to get predicted stat gains', error instanceof Error ? error : new Error(String(error)), {
        discordId,
        stat
      });
      throw error;
    }
  }
}
