import { useQuery } from '@tanstack/react-query';
import { agent } from '../api/agent';

export interface GymStatsResponse {
  battlestats: {
    strength: number;
    speed: number;
    defense: number;
    dexterity: number;
    total: number;
  };
  activeGym: number;
  perkPerc: number;
}

export function useGymStats(apiKey: string | null) {
  return useQuery<GymStatsResponse>({
    queryKey: ['gymStats', apiKey],
    queryFn: async () => {
      if (!apiKey) {
        throw new Error('API key is required');
      }
      const response = await agent.get(`/gym/stats?apiKey=${encodeURIComponent(apiKey)}`);
      return response.data;
    },
    enabled: !!apiKey && apiKey.trim().length > 0,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
