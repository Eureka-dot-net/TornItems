import mongoose, { Schema, Document } from 'mongoose';

export interface IApiCall extends Document {
  endpoint: string;
  timestamp: Date;
  source: string; // e.g., 'backgroundFetcher', 'tornApi', 'discord-command'
}

const ApiCallSchema = new Schema<IApiCall>({
  endpoint: { type: String, required: true },
  timestamp: { type: Date, required: true, default: Date.now, index: true },
  source: { type: String, required: true, index: true },
});

// Add TTL index to automatically delete records older than 7 days
ApiCallSchema.index({ timestamp: 1 }, { expireAfterSeconds: 604800 }); // 7 days in seconds

export const ApiCall = mongoose.model<IApiCall>('ApiCall', ApiCallSchema);
