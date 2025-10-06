import { useQuery } from "@tanstack/react-query";
import type { StockTransactionsData } from "../types/stockTransactions";
import { agent } from "../api/agent";

export function useStockTransactions() {
    const { data: transactionsData, isLoading: transactionsLoading, error: transactionsError, refetch } = useQuery<StockTransactionsData>({
        queryKey: ["stockTransactions"],
        queryFn: async () => {
            const res = await agent.get(`/stocks/profit`);
            return res.data as StockTransactionsData;
        },
        staleTime: 60000, // 1 minute
        gcTime: 300000, // 5 minutes
    });

    return { 
        transactionsData,
        transactionsLoading, 
        transactionsError,
        refetch
    };
}
