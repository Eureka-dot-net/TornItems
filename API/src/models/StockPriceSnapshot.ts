import mongoose, { Schema, Document } from 'mongoose';

export interface IStockPriceSnapshot extends Document {
  stock_id: number;
  ticker: string;
  name: string;
  price: number;
  timestamp: Date;
}

const StockPriceSnapshotSchema = new Schema<IStockPriceSnapshot>({
  stock_id: { type: Number, required: true },
  ticker: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  timestamp: { type: Date, required: true, default: Date.now },
});

// Compound index on { ticker, timestamp } to avoid duplicates and optimize queries
StockPriceSnapshotSchema.index({ ticker: 1, timestamp: -1 });

// TTL index to automatically delete records older than 14 days (14 days * 24 hours * 60 minutes * 60 seconds)
StockPriceSnapshotSchema.index({ timestamp: 1 }, { expireAfterSeconds: 14 * 24 * 60 * 60 });

export const StockPriceSnapshot = mongoose.model<IStockPriceSnapshot>('StockPriceSnapshot', StockPriceSnapshotSchema);
