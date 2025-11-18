import { useState, useCallback, useRef } from 'react';
import axios from 'axios';

export interface HistoricalStat {
  timestamp: number;
  strength: number;
  speed: number;
  defense: number;
  dexterity: number;
  totalstats: number;
}

export interface HistoricalDataConfig {
  enabled: boolean;
  samplingFrequencyDays: number;
  cachingMode: 'store' | 'refetch';
}

interface FetchHistoricalStatsParams {
  apiKey: string;
  startDate: Date;
  endDate: Date;
  samplingFrequencyDays: number;
  onProgress?: (current: number, total: number) => void;
  timestampsToFetch?: number[]; // Optional: specific timestamps to fetch
  signal?: AbortSignal; // Optional: for cancellation
}

export function useHistoricalStats() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<HistoricalStat[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelFetch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  const fetchHistoricalStats = useCallback(async ({
    apiKey,
    startDate,
    endDate,
    samplingFrequencyDays,
    onProgress,
    timestampsToFetch,
    signal,
  }: FetchHistoricalStatsParams): Promise<HistoricalStat[]> => {
    setIsLoading(true);
    setError(null);
    
    // Create abort controller if not provided
    if (!signal) {
      abortControllerRef.current = new AbortController();
      signal = abortControllerRef.current.signal;
    }
    
    try {
      // Calculate timestamps to fetch
      let timestamps: number[];
      
      if (timestampsToFetch && timestampsToFetch.length > 0) {
        // Use provided timestamps
        timestamps = timestampsToFetch;
      } else {
        // Calculate from date range
        timestamps = [];
        const currentDate = new Date(startDate);
        const endTime = endDate.getTime();
        
        while (currentDate.getTime() <= endTime) {
          timestamps.push(Math.floor(currentDate.getTime() / 1000));
          currentDate.setDate(currentDate.getDate() + samplingFrequencyDays);
        }
        
        // Ensure we include the end date
        const endTimestamp = Math.floor(endTime / 1000);
        if (timestamps[timestamps.length - 1] !== endTimestamp) {
          timestamps.push(endTimestamp);
        }
      }
      
      const results: HistoricalStat[] = [];
      const RATE_LIMIT_DELAY = 2000; // 2 seconds between requests = 30 requests/minute
      
      for (let i = 0; i < timestamps.length; i++) {
        // Check if cancelled
        if (signal?.aborted) {
          throw new Error('Fetch cancelled by user');
        }
        
        const timestamp = timestamps[i];
        
        try {
          // Call Torn API v2 personalstats endpoint
          const response = await axios.get('https://api.torn.com/v2/user/personalstats', {
            params: {
              stat: 'strength,speed,defense,dexterity,totalstats',
              timestamp,
              key: apiKey,
            },
            signal, // Pass abort signal to axios
          });
          
          // Parse response
          const personalstats = response.data.personalstats;
          const stat: HistoricalStat = {
            timestamp,
            strength: 0,
            speed: 0,
            defense: 0,
            dexterity: 0,
            totalstats: 0,
          };
          
          // Map stats from response
          if (Array.isArray(personalstats)) {
            personalstats.forEach((item: { name: string; value: number }) => {
              if (item.name === 'strength') stat.strength = item.value;
              else if (item.name === 'speed') stat.speed = item.value;
              else if (item.name === 'defense') stat.defense = item.value;
              else if (item.name === 'dexterity') stat.dexterity = item.value;
              else if (item.name === 'totalstats') stat.totalstats = item.value;
            });
          }
          
          results.push(stat);
          
          // Update progress
          if (onProgress) {
            onProgress(i + 1, timestamps.length);
          }
          
          // Rate limiting: wait before next request (except for last one)
          if (i < timestamps.length - 1) {
            await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
          }
        } catch (err) {
          console.error(`Failed to fetch stats for timestamp ${timestamp}:`, err);
          // Continue with next timestamp even if one fails
        }
      }
      
      setData(results);
      setIsLoading(false);
      abortControllerRef.current = null;
      return results;
    } catch (err) {
      if (axios.isCancel(err) || (err instanceof Error && err.message === 'Fetch cancelled by user')) {
        setError('Fetch cancelled');
        setIsLoading(false);
        abortControllerRef.current = null;
        return [];
      }
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch historical stats';
      setError(errorMessage);
      setIsLoading(false);
      abortControllerRef.current = null;
      throw err;
    }
  }, []);

  return {
    fetchHistoricalStats,
    cancelFetch,
    isLoading,
    error,
    data,
  };
}
