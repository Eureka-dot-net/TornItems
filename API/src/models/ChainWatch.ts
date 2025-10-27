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
  // Notification tracking (moved from in-memory cache)
  lastNotificationTimestamp?: number; // Timestamp of last notification sent
  lastNotificationChainCurrent?: number; // Chain current value at last notification
  // Round-robin tracking for API key usage
  lastUsedKeyIndex?: number; // Last used API key index for this faction
  createdAt: Date;
  updatedAt: Date;
}

const ChainWatchSchema = new Schema<IChainWatch>({
  discordId: { type: String, required: true, unique: true, index: true },
  channelId: { type: String, required: true },
  secondsBeforeFail: { type: Number, required: true, min: 1 },
  factionId: { type: Number, required: true, index: true },
  enabled: { type: Boolean, default: true, index: true },
  // Notification tracking (moved from in-memory cache)
  lastNotificationTimestamp: { type: Number },
  lastNotificationChainCurrent: { type: Number },
  // Round-robin tracking for API key usage
  lastUsedKeyIndex: { type: Number },
}, {
  timestamps: true
});

export const ChainWatch = mongoose.model<IChainWatch>('ChainWatch', ChainWatchSchema);
