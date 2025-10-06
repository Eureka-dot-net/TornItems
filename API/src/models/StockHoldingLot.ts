import mongoose, { Schema, Document } from 'mongoose';

export interface IStockHoldingLot extends Document {
  stock_id: number;
  ticker: string;
  name: string;
  shares_total: number;
  shares_remaining: number;
  bought_price: number;
  score_at_buy: number | null;
  recommendation_at_buy: string | null;
  timestamp: Date;
  fully_sold: boolean;
}

const StockHoldingLotSchema = new Schema<IStockHoldingLot>({
  stock_id: { type: Number, required: true },
  ticker: { type: String, required: true },
  name: { type: String, required: true },
  shares_total: { type: Number, required: true },
  shares_remaining: { type: Number, required: true },
  bought_price: { type: Number, required: true },
  score_at_buy: { type: Number, default: null },
  recommendation_at_buy: { type: String, default: null },
  timestamp: { type: Date, required: true, default: Date.now },
  fully_sold: { type: Boolean, default: false },
});

// Compound index on { stock_id, timestamp } to support FIFO ordering (oldest first)
StockHoldingLotSchema.index({ stock_id: 1, timestamp: 1 });

// Index for querying open lots
StockHoldingLotSchema.index({ stock_id: 1, fully_sold: 1 });

export const StockHoldingLot = mongoose.model<IStockHoldingLot>('StockHoldingLot', StockHoldingLotSchema);
