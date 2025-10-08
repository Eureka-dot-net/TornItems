import mongoose, { Schema, Document } from 'mongoose';

/**
 * MarketWatchlistItem tracks items to monitor for price alerts.
 * When an item is listed below the alert_below threshold, a Discord notification is sent.
 * Now supports per-user watchlists with Discord integration.
 */
export interface IMarketWatchlistItem extends Document {
  itemId: number;
  name: string;
  alert_below: number;  // Price threshold for alerts
  lastAlertPrice?: number | null;  // Last price that triggered an alert (to prevent duplicates)
  lastAlertTimestamp?: Date | null;  // When the last alert was sent
  discordUserId: string;  // Discord user ID who created this watch
  apiKey: string;  // Encrypted API key to use for monitoring this item
  guildId: string;  // Discord server/guild ID
  channelId: string;  // Discord channel ID where alerts should be sent
  enabled: boolean;  // Whether this watch is active
}

const MarketWatchlistItemSchema = new Schema<IMarketWatchlistItem>({
  itemId: { type: Number, required: true, index: true },
  name: { type: String, required: true },
  alert_below: { type: Number, required: true },
  lastAlertPrice: { type: Number, default: null },
  lastAlertTimestamp: { type: Date, default: null },
  discordUserId: { type: String, required: true, index: true },
  apiKey: { type: String, required: true },  // Stored encrypted
  guildId: { type: String, required: true },
  channelId: { type: String, required: true },
  enabled: { type: Boolean, default: true, index: true },
});

// Compound index to prevent duplicate watches by same user for same item
MarketWatchlistItemSchema.index({ discordUserId: 1, itemId: 1 }, { unique: true });

export const MarketWatchlistItem = mongoose.model<IMarketWatchlistItem>('MarketWatchlistItem', MarketWatchlistItemSchema);
