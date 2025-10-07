import mongoose, { Schema, Document } from 'mongoose';

export interface IBattleStats extends Document {
  tornId: number;
  strength: number;
  defense: number;
  speed: number;
  dexterity: number;
  total: number;
  recordedAt: Date;
}

const BattleStatsSchema = new Schema<IBattleStats>({
  tornId: { type: Number, required: true, index: true },
  strength: { type: Number, required: true },
  defense: { type: Number, required: true },
  speed: { type: Number, required: true },
  dexterity: { type: Number, required: true },
  total: { type: Number, required: true },
  recordedAt: { type: Date, default: Date.now, index: true }
});

// Compound index for querying stats by user and time
BattleStatsSchema.index({ tornId: 1, recordedAt: -1 });

export const BattleStats = mongoose.model<IBattleStats>('BattleStats', BattleStatsSchema);
