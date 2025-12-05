import mongoose, { Schema, Document } from 'mongoose';

export interface IDiscordUser extends Document {
  discordId: string;
  tornId: number;
  name: string;
  apiKey: string; // Encrypted
  apiKeyType?: 'full' | 'limited'; // Type of API key (full allows log access, limited does not)
  level: number;
  factionId?: number; // User's faction ID
  hasPrivateIsland: boolean; // @deprecated - was used for travel notifications (removed)
  itemsToBuy: number; // @deprecated - was used for travel notifications (removed)
  createdAt: Date;
  updatedAt: Date;
}

const DiscordUserSchema = new Schema<IDiscordUser>({
  discordId: { type: String, required: true, unique: true, index: true },
  tornId: { type: Number, required: true, unique: true, index: true },
  name: { type: String, required: true },
  apiKey: { type: String, required: true }, // Stored encrypted
  apiKeyType: { type: String, enum: ['full', 'limited'], default: 'limited' },
  level: { type: Number, required: true },
  factionId: { type: Number, index: true },
  hasPrivateIsland: { type: Boolean, default: false },
  itemsToBuy: { type: Number, default: 19 }
}, {
  timestamps: true
});

export const DiscordUser = mongoose.model<IDiscordUser>('DiscordUser', DiscordUserSchema);
