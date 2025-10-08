import mongoose, { Schema, Document } from 'mongoose';

export interface IDiscordUser extends Document {
  discordId: string;
  tornId: number;
  name: string;
  apiKey: string; // Encrypted
  level: number;
  hasPrivateIsland: boolean; // Global setting for travel notifications
  itemsToBuy: number; // Global setting for travel notifications
  createdAt: Date;
  updatedAt: Date;
}

const DiscordUserSchema = new Schema<IDiscordUser>({
  discordId: { type: String, required: true, unique: true, index: true },
  tornId: { type: Number, required: true, unique: true, index: true },
  name: { type: String, required: true },
  apiKey: { type: String, required: true }, // Stored encrypted
  level: { type: Number, required: true },
  hasPrivateIsland: { type: Boolean, default: false },
  itemsToBuy: { type: Number, default: 19 }
}, {
  timestamps: true
});

export const DiscordUser = mongoose.model<IDiscordUser>('DiscordUser', DiscordUserSchema);
