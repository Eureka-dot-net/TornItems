import { useQuery } from '@tanstack/react-query';
import { agent } from '../api/agent';

export interface ItemPrices {
  prices: Record<number, number | null>;
}

/**
 * Fetch market prices for specific items
 * @param itemIds - Array of item IDs to fetch prices for
 */
export function useItemPrices(itemIds: number[]) {
  return useQuery<ItemPrices>({
    queryKey: ['itemPrices', itemIds.sort().join(',')],
    queryFn: async () => {
      const response = await agent.get(`/items/market-prices?itemIds=${itemIds.join(',')}`);
      return response.data;
    },
    enabled: itemIds.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
