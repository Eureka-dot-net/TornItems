import mongoose, { Schema, Document } from 'mongoose';

/**
 * ChainWatch stores user preferences for faction chain timeout notifications.
 * Users are notified when their faction's chain timeout is below their specified threshold.
 */
export interface IChainWatch extends Document {
  discordId: string;
  channelId: string; // Channel where user signed up, where notifications will be sent
  secondsBeforeFail: number; // Notify when chain timeout is below this many seconds
  factionId: number; // User's faction ID
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChainWatchSchema = new Schema<IChainWatch>({
  discordId: { type: String, required: true, unique: true, index: true },
  channelId: { type: String, required: true },
  secondsBeforeFail: { type: Number, required: true, min: 1 },
  factionId: { type: Number, required: true, index: true },
  enabled: { type: Boolean, default: true, index: true },
}, {
  timestamps: true
});

export const ChainWatch = mongoose.model<IChainWatch>('ChainWatch', ChainWatchSchema);
