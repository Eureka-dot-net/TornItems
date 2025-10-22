import mongoose, { Schema, Document } from 'mongoose';

export interface IUserActivityCache extends Document {
  discordId: string;
  tornId: number;
  education: {
    active: boolean;
    until: number | null;
    lastFetched: Date | null;
  } | null;
  investment: {
    active: boolean;
    until: number | null;
    lastFetched: Date | null;
  } | null;
  virusCoding: {
    active: boolean;
    until: number | null;
    lastFetched: Date | null;
  } | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserActivityCacheSchema = new Schema<IUserActivityCache>({
  discordId: { type: String, required: true, unique: true, index: true },
  tornId: { type: Number, required: true, index: true },
  education: {
    active: { type: Boolean, default: false },
    until: { type: Number, default: null },
    lastFetched: { type: Date, default: null }
  },
  investment: {
    active: { type: Boolean, default: false },
    until: { type: Number, default: null },
    lastFetched: { type: Date, default: null }
  },
  virusCoding: {
    active: { type: Boolean, default: false },
    until: { type: Number, default: null },
    lastFetched: { type: Date, default: null }
  }
}, {
  timestamps: true
});

export const UserActivityCache = mongoose.model<IUserActivityCache>('UserActivityCache', UserActivityCacheSchema);
