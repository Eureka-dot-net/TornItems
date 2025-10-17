import axios from 'axios';
import { BattleStats } from '../models/BattleStats';
import { logInfo, logError } from './logger';
import { TornBattleStatsResponse, TornTravelResponse, TravelStatus } from '../types/tornApiTypes';
import { logApiCall } from './apiCallLogger';

// Re-export TravelStatus for backward compatibility
export { TravelStatus } from '../types/tornApiTypes';

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
    
    // Log the API call
    await logApiCall('user/battlestats', 'tornApi');
    
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
 * Fetch travel status from the Torn API
 * @param apiKey - The user's Torn API key
 * @returns The travel status or null if not travelling
 */
export async function fetchTravelStatus(apiKey: string): Promise<TravelStatus | null> {
  try {
    logInfo('Fetching travel status from Torn API');
    
    const response = await axios.get<TornTravelResponse>(
      `https://api.torn.com/v2/user/travel?key=${apiKey}`
    );
    
    // Log the API call
    await logApiCall('user/travel', 'tornApi');
    
    // If the response has travel data, return it; otherwise return null
    if (response.data && response.data.travel) {
      logInfo('Travel status fetched successfully', {
        destination: response.data.travel.destination,
        time_left: response.data.travel.time_left
      });
      return response.data.travel;
    }
    
    logInfo('User is not currently travelling');
    return null;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      logError('Failed to fetch travel status', error, {
        status: error.response.status,
        data: error.response.data
      });
    } else {
      logError('Failed to fetch travel status', error instanceof Error ? error : new Error(String(error)));
    }
    // Return null instead of throwing - travel status is optional
    return null;
  }
}
