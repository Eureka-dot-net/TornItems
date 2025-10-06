import mongoose, { Schema, Document } from 'mongoose';

export interface IStockMarketHistory extends Document {
  ticker: string;
  name: string;
  date: string; // YYYY-MM-DD format
  opening_price: number;
  closing_price: number;
  lowest_price: number;
  highest_price: number;
  daily_volatility: number;
}

const StockMarketHistorySchema = new Schema<IStockMarketHistory>({
  ticker: { type: String, required: true, index: true },
  name: { type: String, required: true },
  date: { type: String, required: true, index: true },
  opening_price: { type: Number, required: true },
  closing_price: { type: Number, required: true },
  lowest_price: { type: Number, required: true },
  highest_price: { type: Number, required: true },
  daily_volatility: { type: Number, required: true },
});

// Compound unique index on ticker and date
StockMarketHistorySchema.index({ ticker: 1, date: 1 }, { unique: true });

// Index on date for efficient date-range queries and cleanup
StockMarketHistorySchema.index({ date: 1 });

export const StockMarketHistory = mongoose.model<IStockMarketHistory>('StockMarketHistory', StockMarketHistorySchema);
