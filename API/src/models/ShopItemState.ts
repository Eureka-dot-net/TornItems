import mongoose, { Schema, Document } from 'mongoose';

export interface IShopItemState extends Document {
  shopId: string;
  itemId: string;
  itemName: string;
  shopName: string;
  type: string;
  price: number;
  in_stock: number;
  lastUpdated: Date;
  
  // Stock tracking fields
  lastRestockTime?: Date;
  lastSelloutTime?: Date;
  selloutDurationMinutes?: number;
  cyclesSkipped?: number;  // Cycles skipped in last 24 hours
  cyclesSkipped24h?: number;  // Total cycles skipped in last 24 hours (for prediction)
  restocksLast24h?: number;  // Number of restocks in last 24 hours
  averageSelloutMinutes?: number;
  averageCyclesSkipped?: number;
}

const ShopItemStateSchema = new Schema<IShopItemState>({
  shopId: { type: String, required: true, index: true },
  shopName: { type: String, required: true },
  itemId: { type: String, required: true },
  itemName: { type: String, required: true },
  type: { type: String, required: true },
  price: { type: Number, required: true },
  in_stock: { type: Number, required: true },
  lastUpdated: { type: Date, default: Date.now },
  
  // Stock tracking fields
  lastRestockTime: { type: Date },
  lastSelloutTime: { type: Date },
  selloutDurationMinutes: { type: Number },
  cyclesSkipped: { type: Number },
  cyclesSkipped24h: { type: Number },  // Total cycles skipped in last 24 hours
  restocksLast24h: { type: Number },  // Number of restocks in last 24 hours
  averageSelloutMinutes: { type: Number },
  averageCyclesSkipped: { type: Number },
});

// Compound unique index on shopId and itemId
ShopItemStateSchema.index({ shopId: 1, itemId: 1 }, { unique: true });

export const ShopItemState = mongoose.model<IShopItemState>('ShopItemState', ShopItemStateSchema);
