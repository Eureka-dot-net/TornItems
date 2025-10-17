import { ApiCall } from '../models/ApiCall';
import { logInfo } from './logger';

/**
 * Log a Torn API call to the database for tracking
 * @param endpoint - The API endpoint called (e.g., 'user', 'torn/items', 'user/travel')
 * @param source - The source of the API call (e.g., 'backgroundFetcher', 'tornApi', 'discord-command')
 */
export async function logApiCall(endpoint: string, source: string): Promise<void> {
  try {
    await ApiCall.create({
      endpoint,
      timestamp: new Date(),
      source,
    });
  } catch (error) {
    // Don't throw - logging should never break the application
    logInfo('Failed to log API call', { endpoint, source, error });
  }
}

/**
 * Get the count of API calls made in the last X minutes
 * @param minutes - Number of minutes to look back
 * @returns The count of API calls made in the specified timeframe
 */
export async function getApiCallCount(minutes: number): Promise<number> {
  try {
    const timeAgo = new Date(Date.now() - minutes * 60 * 1000);
    const count = await ApiCall.countDocuments({
      timestamp: { $gte: timeAgo },
    });
    return count;
  } catch (error) {
    logInfo('Failed to get API call count', { minutes, error });
    return 0;
  }
}

/**
 * Get detailed API call statistics for the last X minutes
 * @param minutes - Number of minutes to look back
 * @returns Object with total count and breakdown by source
 */
export async function getApiCallStats(minutes: number): Promise<{
  total: number;
  bySource: Record<string, number>;
  byEndpoint: Record<string, number>;
}> {
  try {
    const timeAgo = new Date(Date.now() - minutes * 60 * 1000);
    
    const calls = await ApiCall.find({
      timestamp: { $gte: timeAgo },
    }).lean();

    const bySource: Record<string, number> = {};
    const byEndpoint: Record<string, number> = {};

    for (const call of calls) {
      bySource[call.source] = (bySource[call.source] || 0) + 1;
      byEndpoint[call.endpoint] = (byEndpoint[call.endpoint] || 0) + 1;
    }

    return {
      total: calls.length,
      bySource,
      byEndpoint,
    };
  } catch (error) {
    logInfo('Failed to get API call stats', { minutes, error });
    return { total: 0, bySource: {}, byEndpoint: {} };
  }
}
