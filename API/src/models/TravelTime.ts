import mongoose, { Schema, Document } from 'mongoose';

export interface ITravelTime extends Document {
  countryCode: string;
  countryName: string;
  travelTimeMinutes: number;
  lastUpdated: Date;
}

const TravelTimeSchema = new Schema<ITravelTime>({
  countryCode: { type: String, required: true, unique: true, index: true },
  countryName: { type: String, required: true },
  travelTimeMinutes: { type: Number, required: true },
  lastUpdated: { type: Date, default: Date.now },
});

export const TravelTime = mongoose.model<ITravelTime>('TravelTime', TravelTimeSchema);
