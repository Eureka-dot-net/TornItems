import { useQuery } from "@tanstack/react-query";
import type { StockRecommendationsData } from "../types/stockRecommendations";
import { agent } from "../api/agent";

export function useStockRecommendations() {
    const { data: recommendationsData, isLoading: recommendationsLoading, error: recommendationsError, refetch } = useQuery<StockRecommendationsData>({
        queryKey: ["stockRecommendations"],
        queryFn: async () => {
            const res = await agent.get(`/stocks/recommendations`);
            return res.data as StockRecommendationsData;
        },
        staleTime: 3600000, // 1 hour
        gcTime: 3600000, // 1 hour
    });

    return { 
        recommendationsData,
        recommendationsLoading, 
        recommendationsError,
        refetch
    };
}
