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
  watchItems: number[]; // Up to 3 item IDs to watch for this destination
  enabled: boolean;
  // One-time scheduled notification times
  scheduledNotifyBeforeTime?: Date | null; // When to send the "X seconds before" notification
  scheduledBoardingTime?: Date | null; // When to send the "board now" notification
  scheduledArrivalTime?: Date | null; // When user should arrive (15-min slot)
  notificationsSent: boolean; // Track if notifications have been sent
  createdAt: Date;
  updatedAt: Date;
}

const TravelNotificationSchema = new Schema<ITravelNotification>({
  discordUserId: { type: String, required: true, index: true },
  countryCode: { type: String, required: true, index: true },
  notifyBeforeSeconds: { type: Number, default: 10 },
  watchItems: { type: [Number], default: [] },
  enabled: { type: Boolean, default: true, index: true },
  scheduledNotifyBeforeTime: { type: Date, default: null },
  scheduledBoardingTime: { type: Date, default: null },
  scheduledArrivalTime: { type: Date, default: null },
  notificationsSent: { type: Boolean, default: false, index: true },
}, {
  timestamps: true
});

// Compound index to prevent duplicate travel notifications for same user+country
TravelNotificationSchema.index({ discordUserId: 1, countryCode: 1 }, { unique: true });

export const TravelNotification = mongoose.model<ITravelNotification>('TravelNotification', TravelNotificationSchema);
