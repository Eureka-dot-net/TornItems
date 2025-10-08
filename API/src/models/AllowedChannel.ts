import mongoose, { Schema, Document } from 'mongoose';

/**
 * AllowedChannel tracks which channels are allowed for market watch commands
 * Only users with appropriate permissions can configure this
 */
export interface IAllowedChannel extends Document {
  guildId: string;
  channelId: string;
  enabled: boolean;
  configuredBy: string; // Discord user ID who configured this
  configuredAt: Date;
}

const AllowedChannelSchema = new Schema<IAllowedChannel>({
  guildId: { type: String, required: true, index: true },
  channelId: { type: String, required: true, index: true },
  enabled: { type: Boolean, default: true },
  configuredBy: { type: String, required: true },
  configuredAt: { type: Date, default: Date.now },
});

// Compound unique index to prevent duplicate channel configurations
AllowedChannelSchema.index({ guildId: 1, channelId: 1 }, { unique: true });

export const AllowedChannel = mongoose.model<IAllowedChannel>('AllowedChannel', AllowedChannelSchema);
