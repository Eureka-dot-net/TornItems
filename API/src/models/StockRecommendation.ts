import mongoose, { Schema, Document } from 'mongoose';

export interface IStockRecommendation extends Document {
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
  date: string; // YYYY-MM-DD format
  timestamp: Date;
}

const StockRecommendationSchema = new Schema<IStockRecommendation>({
  stock_id: { type: Number, required: true },
  ticker: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  change_7d_pct: { type: Number, default: null },
  volatility_7d_pct: { type: Number, required: true },
  score: { type: Number, default: null },
  sell_score: { type: Number, default: null },
  recommendation: { type: String, required: true },
  owned_shares: { type: Number, required: true, default: 0 },
  avg_buy_price: { type: Number, default: null },
  unrealized_profit_value: { type: Number, default: null },
  unrealized_profit_pct: { type: Number, default: null },
  can_sell: { type: Boolean, required: true, default: false },
  max_shares_to_sell: { type: Number, required: true, default: 0 },
  benefit_requirement: { type: Number, default: null },
  date: { type: String, required: true },
  timestamp: { type: Date, required: true, default: Date.now },
});

// Compound unique index on stock_id and date
StockRecommendationSchema.index({ stock_id: 1, date: 1 }, { unique: true });

// Index on date for efficient cleanup
StockRecommendationSchema.index({ date: 1 });

// TTL index to automatically delete records older than 48 hours
StockRecommendationSchema.index({ timestamp: 1 }, { expireAfterSeconds: 48 * 60 * 60 });

export const StockRecommendation = mongoose.model<IStockRecommendation>('StockRecommendation', StockRecommendationSchema);
