import mongoose, { Schema, Document } from 'mongoose';

export interface IStockBenefit extends Document {
  stock_id: number;
  ticker: string;
  name: string;
  benefit_requirement: number;
  benefit_type: string; // 'Active' or 'Passive'
  benefit_frequency: number | null; // days (7, 31, or null for passive)
  benefit_description: string; // e.g., "1x Six Pack of Alcohol" or "$80,000,000"
  benefit_item_id: number | null; // itemId if benefit is an item, null otherwise
}

const StockBenefitSchema = new Schema<IStockBenefit>({
  stock_id: { type: Number, required: true, unique: true },
  ticker: { type: String, required: true },
  name: { type: String, required: true },
  benefit_requirement: { type: Number, required: true },
  benefit_type: { type: String, required: true },
  benefit_frequency: { type: Number, required: false, default: null },
  benefit_description: { type: String, required: true },
  benefit_item_id: { type: Number, required: false, default: null },
});

// Index on ticker for quick lookups
StockBenefitSchema.index({ ticker: 1 });

export const StockBenefit = mongoose.model<IStockBenefit>('StockBenefit', StockBenefitSchema);
