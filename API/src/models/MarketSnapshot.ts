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
  total_revenue_sold?: number | null;  // Total revenue from items sold since previous snapshot (sum of price × amount)
  sales_24h_current?: number | null;  // Total sales in last 24 hours
  sales_24h_previous?: number | null;  // Total sales in previous 24-hour period
  total_revenue_24h_current?: number | null;  // Total revenue from sales in last 24 hours
  trend_24h?: number | null;  // Percentage change between previous and current 24h periods
  hour_velocity_24?: number | null;  // Sales per hour (sales_24h_current / 24)
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
  total_revenue_sold: { type: Number, default: null },
  sales_24h_current: { type: Number, default: null },
  sales_24h_previous: { type: Number, default: null },
  total_revenue_24h_current: { type: Number, default: null },
  trend_24h: { type: Number, default: null },
  hour_velocity_24: { type: Number, default: null },
});

// Compound index for efficient querying
MarketSnapshotSchema.index({ country: 1, itemId: 1, fetched_at: -1 });

export const MarketSnapshot = mongoose.model<IMarketSnapshot>('MarketSnapshot', MarketSnapshotSchema);
