export interface StockTransaction {
  _id: string;
  stock_id: number;
  ticker: string;
  name: string;
  time: string;
  action: 'BUY' | 'SELL';
  shares: number;
  price: number;
  previous_shares: number;
  new_shares: number;
  bought_price: number | null;
  profit_per_share: number | null;
  total_profit: number | null;
  score_at_buy: number | null;
  score_at_sale: number | null;
  recommendation_at_buy: string | null;
  recommendation_at_sale: string | null;
  trend_7d_pct: number | null;
  volatility_7d_pct: number | null;
}

export type StockTransactionsData = StockTransaction[];
