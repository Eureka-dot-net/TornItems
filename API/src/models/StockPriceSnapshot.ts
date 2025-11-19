import mongoose, { Schema, Document } from 'mongoose';

export interface IStockPriceSnapshot extends Document {
  stock_id: number;
  ticker: string;
  name: string;
  price: number;
  benefit_requirement?: number | null;
  benefit_type?: string | null; // 'Active' or 'Passive'
  benefit_frequency?: number | null; // days (7, 31, or null for passive)
  benefit_description?: string | null; // e.g., "1x Six Pack of Alcohol" or "$80,000,000"
  benefit_item_id?: number | null; // itemId if benefit is an item, null otherwise
  timestamp: Date;
}

const StockPriceSnapshotSchema = new Schema<IStockPriceSnapshot>({
  stock_id: { type: Number, required: true },
  ticker: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  benefit_requirement: { type: Number, required: false, default: null },
  benefit_type: { type: String, required: false, default: null },
  benefit_frequency: { type: Number, required: false, default: null },
  benefit_description: { type: String, required: false, default: null },
  benefit_item_id: { type: Number, required: false, default: null },
  timestamp: { type: Date, required: true, default: Date.now },
});

// Compound index on { ticker, timestamp } to avoid duplicates and optimize queries
StockPriceSnapshotSchema.index({ ticker: 1, timestamp: -1 });

// TTL index to automatically delete records older than 24 hours (24 hours * 60 minutes * 60 seconds)
// Historical data is now maintained in StockMarketHistory, so we only need recent snapshots
StockPriceSnapshotSchema.index({ timestamp: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

export const StockPriceSnapshot = mongoose.model<IStockPriceSnapshot>('StockPriceSnapshot', StockPriceSnapshotSchema);
