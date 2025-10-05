export interface StockRecommendation {
  stock_id: number;
  ticker: string;
  name: string;
  price: number;
  change_7d_pct: number | null;
  volatility_7d_pct: number;
  score: number | null;
  sell_score: number | null;
  recommendation: string;
  owned_shares: number;
  can_sell: boolean;
}

export type StockRecommendationsData = StockRecommendation[];
