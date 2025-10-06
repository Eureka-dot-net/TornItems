import mongoose, { Schema, Document } from 'mongoose';

export interface IShopItemStockHistory extends Document {
  shopId: string;
  shopName: string;
  itemId: string;
  itemName: string;
  date: string; // YYYY-MM-DD format
  average_sellout_duration_minutes: number;
  cycles_skipped: number;
}

const ShopItemStockHistorySchema = new Schema<IShopItemStockHistory>({
  shopId: { type: String, required: true, index: true },
  shopName: { type: String, required: true },
  itemId: { type: String, required: true, index: true },
  itemName: { type: String, required: true },
  date: { type: String, required: true, index: true },
  average_sellout_duration_minutes: { type: Number, required: true },
  cycles_skipped: { type: Number, required: true },
});

// Compound unique index on shopId, itemId, and date
ShopItemStockHistorySchema.index({ shopId: 1, itemId: 1, date: 1 }, { unique: true });

// Index on date for efficient date-range queries and cleanup
ShopItemStockHistorySchema.index({ date: 1 });

export const ShopItemStockHistory = mongoose.model<IShopItemStockHistory>('ShopItemStockHistory', ShopItemStockHistorySchema);
