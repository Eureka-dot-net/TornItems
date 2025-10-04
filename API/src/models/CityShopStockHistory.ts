import mongoose, { Schema, Document } from 'mongoose';

export interface ICityShopStockHistory extends Document {
  shopId: string;
  shopName: string;
  itemId: string;
  itemName: string;
  type: string;
  price: number;
  in_stock: number;
  fetched_at: Date;
}

const CityShopStockHistorySchema = new Schema<ICityShopStockHistory>({
  shopId: { type: String, required: true, index: true },
  shopName: { type: String, required: true },
  itemId: { type: String, required: true, index: true },
  itemName: { type: String, required: true },
  type: { type: String, required: true },
  price: { type: Number, required: true },
  in_stock: { type: Number, required: true },
  fetched_at: { type: Date, default: Date.now, index: true },
});

// Compound index for efficient querying by shop, item, and time
CityShopStockHistorySchema.index({ shopId: 1, itemId: 1, fetched_at: -1 });

export const CityShopStockHistory = mongoose.model<ICityShopStockHistory>('CityShopStockHistory', CityShopStockHistorySchema);
