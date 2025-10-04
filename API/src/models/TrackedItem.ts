import mongoose, { Schema, Document } from 'mongoose';

export interface ITrackedItem extends Document {
  country: string;
  itemIds: number[];
  lastUpdated: Date;
}

const TrackedItemSchema = new Schema<ITrackedItem>({
  country: { type: String, required: true, unique: true, index: true },
  itemIds: [{ type: Number, required: true }],
  lastUpdated: { type: Date, default: Date.now },
});

export const TrackedItem = mongoose.model<ITrackedItem>('TrackedItem', TrackedItemSchema);
