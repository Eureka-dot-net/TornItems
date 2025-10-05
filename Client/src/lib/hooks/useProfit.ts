import { useQuery } from "@tanstack/react-query";
import type { ProfitData } from "../types/profit";
import { agent } from "../api/agent";

export function useProfit() {
    const { data: profitData, isLoading: profitLoading, error: profitError, refetch } = useQuery<ProfitData>({
        queryKey: ["profit"],
        queryFn: async () => {
            const res = await agent.get(`/profit`);
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
