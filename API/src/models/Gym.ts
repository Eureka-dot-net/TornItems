import mongoose, { Schema, Document } from 'mongoose';

export interface IGym extends Document {
  name: string;
  displayName: string;
  strength: number | null;
  speed: number | null;
  defense: number | null;
  dexterity: number | null;
  energyPerTrain: number;
}

const GymSchema = new Schema<IGym>({
  name: { type: String, required: true, unique: true, index: true },
  displayName: { type: String, required: true },
  strength: { type: Number, default: null },
  speed: { type: Number, default: null },
  defense: { type: Number, default: null },
  dexterity: { type: Number, default: null },
  energyPerTrain: { type: Number, required: true },
});

export const Gym = mongoose.model<IGym>('Gym', GymSchema);
