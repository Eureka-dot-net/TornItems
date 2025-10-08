import axios from 'axios';
import { BattleStats } from '../models/BattleStats';
import { logInfo, logError } from './logger';

interface TornBattleStatsResponse {
  battlestats: {
    strength: {
      value: number;
      modifier: number;
    };
    defense: {
      value: number;
      modifier: number;
    };
    speed: {
      value: number;
      modifier: number;
    };
    dexterity: {
      value: number;
      modifier: number;
    };
    total: number;
  };
}

export interface TravelStatus {
  destination: string;
  method: string;
  departed_at: number;
  arrival_at: number;
  time_left: number;
}

interface TornTravelResponse {
  travel?: TravelStatus;
}

/**
 * Fetch and store battle stats for a user from the Torn API
 * @param tornId - The Torn user ID
 * @param apiKey - The user's Torn API key
 * @returns The saved battle stats document
 */
export async function fetchAndStoreBattleStats(tornId: number, apiKey: string) {
  try {
    logInfo(`Fetching battle stats for Torn ID: ${tornId}`);
    
    const response = await axios.get<TornBattleStatsResponse>(
      `https://api.torn.com/v2/user?selections=battlestats&key=${apiKey}`
    );
    
    const { battlestats } = response.data;
    
    // Create new battle stats record
    const stats = new BattleStats({
      tornId,
      strength: battlestats.strength.value,
      defense: battlestats.defense.value,
      speed: battlestats.speed.value,
      dexterity: battlestats.dexterity.value,
      total: battlestats.total,
      recordedAt: new Date()
    });
    
    await stats.save();
    
    logInfo(`Battle stats saved for Torn ID: ${tornId}`, {
      total: battlestats.total
    });
    
    return stats;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      logError(`Failed to fetch battle stats for Torn ID: ${tornId}`, error, {
        status: error.response.status,
        data: error.response.data
      });
    } else {
      logError(`Failed to fetch battle stats for Torn ID: ${tornId}`, error instanceof Error ? error : new Error(String(error)));
    }
    throw error;
  }
}

/**
 * Fetch travel status for a user from the Torn API
 * @param apiKey - The user's Torn API key
 * @returns The travel status or null if not traveling
 */
export async function fetchTravelStatus(apiKey: string): Promise<TravelStatus | null> {
  try {
    logInfo('Fetching travel status from Torn API');
    
    const response = await axios.get<TornTravelResponse>(
      `https://api.torn.com/v2/user/travel?key=${apiKey}`
    );
    
    // If the user is not traveling, the API may not return a travel object
    if (!response.data.travel) {
      logInfo('User is not currently traveling');
      return null;
    }
    
    logInfo('Travel status retrieved', {
      destination: response.data.travel.destination,
      arrival_at: response.data.travel.arrival_at
    });
    
    return response.data.travel;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      logError('Failed to fetch travel status', error, {
        status: error.response.status,
        data: error.response.data
      });
    } else {
      logError('Failed to fetch travel status', error instanceof Error ? error : new Error(String(error)));
    }
    // Return null instead of throwing to handle gracefully when travel API fails
    return null;
  }
}
