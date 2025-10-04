import mongoose, { Schema, Document } from 'mongoose';

export interface IForeignStockHistory extends Document {
  countryCode: string;
  countryName: string;
  itemId: number;
  itemName: string;
  quantity: number;
  cost: number;
  fetched_at: Date;
}

const ForeignStockHistorySchema = new Schema<IForeignStockHistory>({
  countryCode: { type: String, required: true, index: true },
  countryName: { type: String, required: true },
  itemId: { type: Number, required: true, index: true },
  itemName: { type: String, required: true },
  quantity: { type: Number, required: true },
  cost: { type: Number, required: true },
  fetched_at: { type: Date, default: Date.now, index: true },
});

// Compound index for efficient querying by country, item, and time
ForeignStockHistorySchema.index({ countryCode: 1, itemId: 1, fetched_at: -1 });

export const ForeignStockHistory = mongoose.model<IForeignStockHistory>('ForeignStockHistory', ForeignStockHistorySchema);
