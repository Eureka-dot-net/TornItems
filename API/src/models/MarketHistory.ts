import mongoose, { Schema, Document } from 'mongoose';

export interface IMarketHistory extends Document {
  country: string;
  id: number;
  name: string;
  date: string; // YYYY-MM-DD
  buy_price: number;
  market_price: number;
  profitPer1: number;
  shop_name: string;
  in_stock: number;
  sales_24h_current: number;
  sales_24h_previous: number;
  trend_24h: number;
  hour_velocity_24: number;
  average_price_items_sold: number;
  estimated_market_value_profit: number;
  lowest_50_profit: number;
  sold_profit: number;
}

const MarketHistorySchema = new Schema<IMarketHistory>({
  country: { type: String, required: true, index: true },
  id: { type: Number, required: true, index: true },
  name: { type: String, required: true },
  date: { type: String, required: true, index: true }, // YYYY-MM-DD
  buy_price: { type: Number, required: true },
  market_price: { type: Number, required: true },
  profitPer1: { type: Number, required: true },
  shop_name: { type: String, required: true },
  in_stock: { type: Number, required: true },
  sales_24h_current: { type: Number, required: true },
  sales_24h_previous: { type: Number, required: true },
  trend_24h: { type: Number, required: true },
  hour_velocity_24: { type: Number, required: true },
  average_price_items_sold: { type: Number, required: true },
  estimated_market_value_profit: { type: Number, required: true },
  lowest_50_profit: { type: Number, required: true },
  sold_profit: { type: Number, required: true },
});

// Compound unique index - each country-item combination only has one record per day
MarketHistorySchema.index({ country: 1, id: 1, date: 1 }, { unique: true });

export const MarketHistory = mongoose.model<IMarketHistory>('MarketHistory', MarketHistorySchema);
