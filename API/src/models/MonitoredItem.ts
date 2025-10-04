import mongoose, { Schema, Document } from 'mongoose';

/**
 * MonitoredItem tracks items with positive profit and manages adaptive monitoring frequency.
 * Items with more frequent changes are checked more often, while quiet items are checked less frequently.
 */
export interface IMonitoredItem extends Document {
  country: string;
  itemId: number;
  name: string;
  
  // Adaptive monitoring fields
  MonitorFrequency: number;  // How many cycles to wait between checks (1-10)
  cycles_since_last_check: number;  // Increments each monitoring cycle
  
  // Movement detection - cached data from last check
  lastCheckedData: {
    stock?: number | null;
    price?: number | null;
    sales?: number | null;
  };
  
  lastCheckTimestamp: Date;
  lastUpdated: Date;
}

const MonitoredItemSchema = new Schema<IMonitoredItem>({
  country: { type: String, required: true, index: true },
  itemId: { type: Number, required: true, index: true },
  name: { type: String, required: true },
  
  // Adaptive monitoring fields
  MonitorFrequency: { type: Number, default: 1, min: 1, max: 10 },
  cycles_since_last_check: { type: Number, default: 0 },
  
  // Cached data for movement detection
  lastCheckedData: {
    stock: { type: Number, default: null },
    price: { type: Number, default: null },
    sales: { type: Number, default: null },
  },
  
  lastCheckTimestamp: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now },
});

// Compound index for efficient querying
MonitoredItemSchema.index({ country: 1, itemId: 1 }, { unique: true });

export const MonitoredItem = mongoose.model<IMonitoredItem>('MonitoredItem', MonitoredItemSchema);
