import mongoose, { Schema, Document } from 'mongoose';

export interface IStockTransactionHistory extends Document {
  stock_id: number;
  ticker: string;
  name: string;
  action: 'SELL';
  shares_sold: number;
  sell_price: number;
  bought_price: number;
  profit_per_share: number;
  total_profit: number;
  timestamp: Date;
  score_at_buy: number | null;
  recommendation_at_buy: string | null;
  score_at_sale: number | null;
  recommendation_at_sale: string | null;
  linked_buy_id: mongoose.Types.ObjectId;
}

const StockTransactionHistorySchema = new Schema<IStockTransactionHistory>({
  stock_id: { type: Number, required: true },
  ticker: { type: String, required: true },
  name: { type: String, required: true },
  action: { type: String, enum: ['SELL'], required: true, default: 'SELL' },
  shares_sold: { type: Number, required: true },
  sell_price: { type: Number, required: true },
  bought_price: { type: Number, required: true },
  profit_per_share: { type: Number, required: true },
  total_profit: { type: Number, required: true },
  timestamp: { type: Date, required: true, default: Date.now },
  score_at_buy: { type: Number, default: null },
  recommendation_at_buy: { type: String, default: null },
  score_at_sale: { type: Number, default: null },
  recommendation_at_sale: { type: String, default: null },
  linked_buy_id: { type: Schema.Types.ObjectId, required: true, ref: 'StockHoldingLot' },
});

// Compound index on { stock_id, timestamp } to optimize queries
StockTransactionHistorySchema.index({ stock_id: 1, timestamp: -1 });

// Index on timestamp to support sorting by most recent
StockTransactionHistorySchema.index({ timestamp: -1 });

export const StockTransactionHistory = mongoose.model<IStockTransactionHistory>('StockTransactionHistory', StockTransactionHistorySchema);
