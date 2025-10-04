import mongoose, { Schema, Document } from 'mongoose';

export interface IItemMarket extends Document {
  itemId: number;
  weightedAveragePrice: number;
  timestamp: Date;
}

const ItemMarketSchema = new Schema<IItemMarket>({
  itemId: { type: Number, required: true, unique: true, index: true },
  weightedAveragePrice: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
});

export const ItemMarket = mongoose.model<IItemMarket>('ItemMarket', ItemMarketSchema);
