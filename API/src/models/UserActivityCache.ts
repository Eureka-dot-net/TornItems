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
  factionOC: {
    active: boolean;
    lastFetched: Date | null;
  } | null;
  casinoTickets: {
    used: number;
    lastFetched: Date | null;
    completedToday: boolean;
  } | null;
  wheels: {
    lame: { spun: boolean; lastFetched: Date | null };
    mediocre: { spun: boolean; lastFetched: Date | null };
    awesomeness: { spun: boolean; lastFetched: Date | null };
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
  },
  factionOC: {
    active: { type: Boolean, default: false },
    lastFetched: { type: Date, default: null }
  },
  casinoTickets: {
    used: { type: Number, default: 0 },
    lastFetched: { type: Date, default: null },
    completedToday: { type: Boolean, default: false }
  },
  wheels: {
    lame: {
      spun: { type: Boolean, default: false },
      lastFetched: { type: Date, default: null }
    },
    mediocre: {
      spun: { type: Boolean, default: false },
      lastFetched: { type: Date, default: null }
    },
    awesomeness: {
      spun: { type: Boolean, default: false },
      lastFetched: { type: Date, default: null }
    }
  }
}, {
  timestamps: true
});

export const UserActivityCache = mongoose.model<IUserActivityCache>('UserActivityCache', UserActivityCacheSchema);
