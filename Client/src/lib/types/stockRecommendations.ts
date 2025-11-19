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
  avg_buy_price: number | null;
  unrealized_profit_value: number | null;
  unrealized_profit_pct: number | null;
  can_sell: boolean;
  max_shares_to_sell: number;
  benefit_requirement: number | null;
  benefit_blocks_owned: number;
  benefit_type: string | null;
  benefit_frequency: number | null;
  benefit_description: string | null;
  benefit_item_id: number | null;
  daily_income: number | null;
  yearly_roi: number | null;
}

export type StockRecommendationsData = StockRecommendation[];
