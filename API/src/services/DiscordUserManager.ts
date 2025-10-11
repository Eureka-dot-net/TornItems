import axios from 'axios';
import { DiscordUser } from '../models/DiscordUser';
import { BattleStats } from '../models/BattleStats';
import { decrypt } from '../utils/encryption';
import { logInfo, logError } from '../utils/logger';

/**
 * Torn API Response Types
 */
export interface TornBarsResponse {
  bars: {
    energy: {
      current: number;
      maximum: number;
      increment: number;
      interval: number;
      tick_time: number;
      full_time: number;
    };
    happy: {
      current: number;
      maximum: number;
      increment: number;
      interval: number;
      tick_time: number;
      full_time: number;
    };
    nerve: {
      current: number;
      maximum: number;
      increment: number;
      interval: number;
      tick_time: number;
      full_time: number;
    };
    life: {
      current: number;
      maximum: number;
      increment: number;
      interval: number;
      tick_time: number;
      full_time: number;
    };
    chain: {
      id: number;
      current: number;
      max: number;
      timeout: number;
      modifier: number;
      cooldown: number;
      start: number;
      end: number;
    };
  };
}

export interface TornBattleStatsResponse {
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

export interface TornPerksResponse {
  faction_perks: string[];
  job_perks: string[];
  property_perks: string[];
  education_perks: string[];
  enhancer_perks: string[];
  book_perks: string[];
  stock_perks: string[];
  merit_perks: string[];
}

export interface TornGymResponse {
  active_gym: number;
}

export interface TornGymData {
  name: string;
  stage: number;
  cost: number;
  energy: number;
  strength: number;
  speed: number;
  defense: number;
  dexterity: number;
  note: string;
}

export interface TornGymsResponse {
  gyms: {
    [key: string]: TornGymData;
  };
}

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
}
