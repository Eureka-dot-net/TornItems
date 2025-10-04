import mongoose, { Schema, Document } from 'mongoose';

export interface ITornItem extends Document {
  itemId: number;
  name: string;
  description: string;
  type: string;
  sub_type?: string | null;
  is_tradable: boolean;
  is_found_in_city: boolean;
  vendor_country?: string | null;
  vendor_name?: string | null;
  buy_price?: number | null;
  sell_price?: number | null;
  market_price?: number | null;
  lastUpdated: Date;
}

const TornItemSchema = new Schema<ITornItem>({
  itemId: { type: Number, required: true, unique: true, index: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, required: true },
  sub_type: { type: String, default: null },
  is_tradable: { type: Boolean, required: true },
  is_found_in_city: { type: Boolean, required: true },
  vendor_country: { type: String, default: null },
  vendor_name: { type: String, default: null },
  buy_price: { type: Number, default: null },
  sell_price: { type: Number, default: null },
  market_price: { type: Number, default: null },
  lastUpdated: { type: Date, default: Date.now },
});

export const TornItem = mongoose.model<ITornItem>('TornItem', TornItemSchema);
