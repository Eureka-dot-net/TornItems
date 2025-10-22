import mongoose, { Schema, Document } from 'mongoose';

export interface IUserActivityCache extends Document {
  discordId: string;
  tornId: number;
  education: {
    active: boolean;
    until: number | null;
  } | null;
  investment: {
    active: boolean;
    until: number | null;
  } | null;
  virusCoding: {
    active: boolean;
    until: number | null;
  } | null;
  lastFetched: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserActivityCacheSchema = new Schema<IUserActivityCache>({
  discordId: { type: String, required: true, unique: true, index: true },
  tornId: { type: Number, required: true, index: true },
  education: {
    active: { type: Boolean, default: false },
    until: { type: Number, default: null }
  },
  investment: {
    active: { type: Boolean, default: false },
    until: { type: Number, default: null }
  },
  virusCoding: {
    active: { type: Boolean, default: false },
    until: { type: Number, default: null }
  },
  lastFetched: { type: Date, required: true },
  expiresAt: { type: Date, required: true, index: true }
}, {
  timestamps: true
});

export const UserActivityCache = mongoose.model<IUserActivityCache>('UserActivityCache', UserActivityCacheSchema);
