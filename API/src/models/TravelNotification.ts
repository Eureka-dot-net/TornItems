import mongoose, { Schema, Document } from 'mongoose';

/**
 * TravelNotification stores user preferences for travel notifications.
 * - Per-user global settings: hasPrivateIsland, itemsToBuy
 * - Per-destination settings: watchItems
 */
export interface ITravelNotification extends Document {
  discordUserId: string;
  countryCode: string; // e.g., 'mex', 'can', 'jap'
  notifyBeforeSeconds: number; // Default 10 seconds
  hasPrivateIsland: boolean; // Reduces travel time by 30%
  watchItems: number[]; // Up to 3 item IDs to watch for this destination
  itemsToBuy: number; // Number of items to buy (max 19 for foreign)
  enabled: boolean;
  lastNotificationSent?: Date | null;
  scheduledDepartureTime?: Date | null; // When user should start travelling
  scheduledArrivalTime?: Date | null; // When user should arrive (15-min slot)
  createdAt: Date;
  updatedAt: Date;
}

const TravelNotificationSchema = new Schema<ITravelNotification>({
  discordUserId: { type: String, required: true, index: true },
  countryCode: { type: String, required: true, index: true },
  notifyBeforeSeconds: { type: Number, default: 10 },
  hasPrivateIsland: { type: Boolean, default: false },
  watchItems: { type: [Number], default: [] },
  itemsToBuy: { type: Number, default: 19 },
  enabled: { type: Boolean, default: true, index: true },
  lastNotificationSent: { type: Date, default: null },
  scheduledDepartureTime: { type: Date, default: null },
  scheduledArrivalTime: { type: Date, default: null },
}, {
  timestamps: true
});

// Compound index to prevent duplicate travel notifications for same user+country
TravelNotificationSchema.index({ discordUserId: 1, countryCode: 1 }, { unique: true });

export const TravelNotification = mongoose.model<ITravelNotification>('TravelNotification', TravelNotificationSchema);
