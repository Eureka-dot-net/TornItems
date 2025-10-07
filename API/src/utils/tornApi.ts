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
