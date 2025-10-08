import { useQuery } from "@tanstack/react-query";
import type { ProfitData } from "../types/profit";
import { agent } from "../api/agent";

export function useProfit(apiKey?: string) {
    const { data: profitData, isLoading: profitLoading, error: profitError, refetch } = useQuery<ProfitData>({
        queryKey: ["profit", apiKey],
        queryFn: async () => {
            const url = apiKey ? `/profit?key=${apiKey}` : '/profit';
            const res = await agent.get(url);
            return res.data as ProfitData;
        },
        staleTime: 3600000, // 1 hour
        gcTime: 3600000, // 1 hour
    });

    return { 
        profitData,
        profitLoading, 
        profitError,
        refetch
    };
}
