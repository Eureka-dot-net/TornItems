import { useQuery } from "@tanstack/react-query";
import type { StockRecommendationsData, StockSummary } from "../types/stockRecommendations";
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

export function useStockSummary() {
    const { data: summaryData, isLoading: summaryLoading, error: summaryError, refetch } = useQuery<StockSummary>({
        queryKey: ["stockSummary"],
        queryFn: async () => {
            const res = await agent.get(`/stocks/summary`);
            return res.data as StockSummary;
        },
        staleTime: 3600000, // 1 hour
        gcTime: 3600000, // 1 hour
    });

    return {
        summaryData,
        summaryLoading,
        summaryError,
        refetch
    };
}
