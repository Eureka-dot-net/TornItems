import mongoose, { Schema, Document } from 'mongoose';

export interface IMarketSnapshot extends Document {
  country: string;
  itemId: number;
  name: string;
  type: string;
  shopName?: string;
  buy_price: number;
  market_price: number;
  profitPer1: number;
  in_stock?: number | null;
  listings: { price: number; amount: number }[];
  cache_timestamp: number;
  fetched_at: Date;
}

const MarketSnapshotSchema = new Schema<IMarketSnapshot>({
  country: { type: String, required: true, index: true },
  itemId: { type: Number, required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  shopName: { type: String },
  buy_price: { type: Number, required: true },
  market_price: { type: Number, required: true },
  profitPer1: { type: Number, required: true },
  in_stock: { type: Number, default: null },
  listings: [{ 
    price: { type: Number, required: true }, 
    amount: { type: Number, required: true } 
  }],
  cache_timestamp: { type: Number, required: true },
  fetched_at: { type: Date, default: Date.now, index: true },
});

// Compound index for efficient querying
MarketSnapshotSchema.index({ country: 1, itemId: 1, fetched_at: -1 });

export const MarketSnapshot = mongoose.model<IMarketSnapshot>('MarketSnapshot', MarketSnapshotSchema);
