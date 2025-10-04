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
  items_sold?: number | null;  // Number of items sold since previous snapshot (based on listings)
  sell_velocity?: number | null;
  trend?: number | null;
  expected_sell_time_minutes?: number | null;
  hour_velocity_24?: number | null;
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
  items_sold: { type: Number, default: null },
  sell_velocity: { type: Number, default: null },
  trend: { type: Number, default: null },
  expected_sell_time_minutes: { type: Number, default: null },
  hour_velocity_24: { type: Number, default: null },
});

// Compound index for efficient querying
MarketSnapshotSchema.index({ country: 1, itemId: 1, fetched_at: -1 });

export const MarketSnapshot = mongoose.model<IMarketSnapshot>('MarketSnapshot', MarketSnapshotSchema);
