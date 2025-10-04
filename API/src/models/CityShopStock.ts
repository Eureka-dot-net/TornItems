import mongoose, { Schema, Document } from 'mongoose';

export interface ICityShopStock extends Document {
  shopId: string;
  shopName: string;
  itemId: string;
  itemName: string;
  type: string;
  price: number;
  in_stock: number;
  lastUpdated: Date;
}

const CityShopStockSchema = new Schema<ICityShopStock>({
  shopId: { type: String, required: true, index: true },
  shopName: { type: String, required: true },
  itemId: { type: String, required: true },
  itemName: { type: String, required: true },
  type: { type: String, required: true },
  price: { type: Number, required: true },
  in_stock: { type: Number, required: true },
  lastUpdated: { type: Date, default: Date.now },
});

// Compound index for unique shop-item combinations
CityShopStockSchema.index({ shopId: 1, itemId: 1 }, { unique: true });

export const CityShopStock = mongoose.model<ICityShopStock>('CityShopStock', CityShopStockSchema);
