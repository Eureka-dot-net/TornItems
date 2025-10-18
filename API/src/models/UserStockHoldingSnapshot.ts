import mongoose, { Schema, Document } from 'mongoose';

export interface IUserStockHoldingSnapshot extends Document {
  stock_id: number;
  total_shares: number;
  avg_buy_price: number | null;
  transaction_count: number;
  timestamp: Date;
}

const UserStockHoldingSnapshotSchema = new Schema<IUserStockHoldingSnapshot>({
  stock_id: { type: Number, required: true },
  total_shares: { type: Number, required: true },
  avg_buy_price: { type: Number, default: null },
  transaction_count: { type: Number, required: true },
  timestamp: { type: Date, required: true, default: Date.now },
});

// Compound index on { stock_id, timestamp } to optimize queries
UserStockHoldingSnapshotSchema.index({ stock_id: 1, timestamp: -1 });

// TTL index to automatically delete records older than 24 hours (24 hours * 60 minutes * 60 seconds)
// Only the most recent snapshot per stock is used, so we don't need long history
UserStockHoldingSnapshotSchema.index({ timestamp: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

export const UserStockHoldingSnapshot = mongoose.model<IUserStockHoldingSnapshot>('UserStockHoldingSnapshot', UserStockHoldingSnapshotSchema);
