import mongoose, { Schema, Document } from 'mongoose';

export interface IStockTransactionHistory extends Document {
  stock_id: number;
  ticker: string;
  name: string;
  time: Date;
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

const StockTransactionHistorySchema = new Schema<IStockTransactionHistory>({
  stock_id: { type: Number, required: true },
  ticker: { type: String, required: true },
  name: { type: String, required: true },
  time: { type: Date, required: true, default: Date.now },
  action: { type: String, enum: ['BUY', 'SELL'], required: true },
  shares: { type: Number, required: true },
  price: { type: Number, required: true },
  previous_shares: { type: Number, required: true },
  new_shares: { type: Number, required: true },
  bought_price: { type: Number, default: null },
  profit_per_share: { type: Number, default: null },
  total_profit: { type: Number, default: null },
  score_at_buy: { type: Number, default: null },
  score_at_sale: { type: Number, default: null },
  recommendation_at_buy: { type: String, default: null },
  recommendation_at_sale: { type: String, default: null },
  trend_7d_pct: { type: Number, default: null },
  volatility_7d_pct: { type: Number, default: null },
});

// Compound index on { stock_id, time } to optimize queries
StockTransactionHistorySchema.index({ stock_id: 1, time: -1 });

// Index on time to support sorting by most recent
StockTransactionHistorySchema.index({ time: -1 });

export const StockTransactionHistory = mongoose.model<IStockTransactionHistory>('StockTransactionHistory', StockTransactionHistorySchema);
