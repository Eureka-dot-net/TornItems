export interface StockTransaction {
  _id: string;
  stock_id: number;
  ticker: string;
  name: string;
  timestamp: string;
  action: 'SELL';
  shares_sold: number;
  sell_price: number;
  bought_price: number;
  profit_per_share: number;
  total_profit: number;
  score_at_buy: number | null;
  recommendation_at_buy: string | null;
  score_at_sale: number | null;
  recommendation_at_sale: string | null;
  linked_buy_id: string;
}

export type StockTransactionsData = StockTransaction[];
