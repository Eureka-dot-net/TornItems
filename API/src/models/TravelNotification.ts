import mongoose, { Schema, Document } from 'mongoose';

/**
 * TravelNotification stores user preferences for travel notifications.
 * - Per-destination settings: watchItems, scheduled notification times
 * - Global settings (hasPrivateIsland, itemsToBuy) are stored in DiscordUser
 */
export interface ITravelNotification extends Document {
  discordUserId: string;
  countryCode: string; // e.g., 'mex', 'can', 'jap'
  notifyBeforeSeconds: number; // Default 10 seconds
  notifyBeforeSeconds2?: number | null; // Optional second notification time
  watchItems: number[]; // Up to 3 item IDs to watch for this destination
  enabled: boolean;
  // One-time scheduled notification times
  scheduledNotifyBeforeTime?: Date | null; // When to send the "X seconds before" notification
  scheduledNotifyBeforeTime2?: Date | null; // When to send the second "X seconds before" notification
  scheduledBoardingTime?: Date | null; // When to send the "board now" notification
  scheduledArrivalTime?: Date | null; // When user should arrive (15-min slot)
  notificationsSent: boolean; // Track if boarding notification has been sent
  notificationsSent1: boolean; // Track if first warning notification has been sent
  notificationsSent2: boolean; // Track if second warning notification has been sent
  shopUrlSent: boolean; // Track if shop URL has been sent to prevent duplicates
  createdAt: Date;
  updatedAt: Date;
}

const TravelNotificationSchema = new Schema<ITravelNotification>({
  discordUserId: { type: String, required: true, index: true },
  countryCode: { type: String, required: true, index: true },
  notifyBeforeSeconds: { type: Number, default: 10 },
  notifyBeforeSeconds2: { type: Number, default: null },
  watchItems: { type: [Number], default: [] },
  enabled: { type: Boolean, default: true, index: true },
  scheduledNotifyBeforeTime: { type: Date, default: null },
  scheduledNotifyBeforeTime2: { type: Date, default: null },
  scheduledBoardingTime: { type: Date, default: null },
  scheduledArrivalTime: { type: Date, default: null },
  notificationsSent: { type: Boolean, default: false, index: true },
  notificationsSent1: { type: Boolean, default: false, index: true },
  notificationsSent2: { type: Boolean, default: false, index: true },
  shopUrlSent: { type: Boolean, default: false, index: true },
}, {
  timestamps: true
});

// Compound index to prevent duplicate travel notifications for same user+country
TravelNotificationSchema.index({ discordUserId: 1, countryCode: 1 }, { unique: true });

export const TravelNotification = mongoose.model<ITravelNotification>('TravelNotification', TravelNotificationSchema);
