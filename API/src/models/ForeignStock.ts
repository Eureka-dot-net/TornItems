import mongoose, { Schema, Document } from 'mongoose';

export interface IForeignStock extends Document {
  countryCode: string;
  countryName: string;
  itemId: number;
  itemName: string;
  quantity: number;
  cost: number;
  lastUpdated: Date;
}

const ForeignStockSchema = new Schema<IForeignStock>({
  countryCode: { type: String, required: true, index: true },
  countryName: { type: String, required: true },
  itemId: { type: Number, required: true },
  itemName: { type: String, required: true },
  quantity: { type: Number, required: true },
  cost: { type: Number, required: true },
  lastUpdated: { type: Date, default: Date.now },
});

// Compound index for unique country-item combinations
ForeignStockSchema.index({ countryCode: 1, itemId: 1 }, { unique: true });

export const ForeignStock = mongoose.model<IForeignStock>('ForeignStock', ForeignStockSchema);
