import mongoose, { Schema, Document } from 'mongoose';

/**
 * MarketWatchlistItem tracks items to monitor for price alerts.
 * When an item is listed below the alert_below threshold, a Discord notification is sent.
 */
export interface IMarketWatchlistItem extends Document {
  itemId: number;
  name: string;
  alert_below: number;  // Price threshold for alerts
  lastAlertPrice?: number | null;  // Last price that triggered an alert (to prevent duplicates)
  lastAlertTimestamp?: Date | null;  // When the last alert was sent
}

const MarketWatchlistItemSchema = new Schema<IMarketWatchlistItem>({
  itemId: { type: Number, required: true, unique: true, index: true },
  name: { type: String, required: true },
  alert_below: { type: Number, required: true },
  lastAlertPrice: { type: Number, default: null },
  lastAlertTimestamp: { type: Date, default: null },
});

export const MarketWatchlistItem = mongoose.model<IMarketWatchlistItem>('MarketWatchlistItem', MarketWatchlistItemSchema);
