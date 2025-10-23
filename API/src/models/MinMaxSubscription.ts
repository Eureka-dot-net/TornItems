import mongoose, { Schema, Document } from 'mongoose';

/**
 * MinMaxSubscription stores user preferences for daily minmax reminder notifications.
 * Notifications are sent once per day at a specified time before UTC midnight reset.
 */
export interface IMinMaxSubscription extends Document {
  discordUserId: string;
  channelId: string; // Channel where user signed up, where notifications will be sent
  hoursBeforeReset: number; // How many hours before UTC midnight to notify
  notifyEducation: boolean; // Whether to notify about missing education
  notifyInvestment: boolean; // Whether to notify about missing investment
  notifyVirus: boolean; // Whether to notify about missing virus coding
  lastNotificationSent?: Date | null; // Track when last notification was sent (date only, no time)
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MinMaxSubscriptionSchema = new Schema<IMinMaxSubscription>({
  discordUserId: { type: String, required: true, unique: true, index: true },
  channelId: { type: String, required: true },
  hoursBeforeReset: { type: Number, required: true, min: 1, max: 23 },
  notifyEducation: { type: Boolean, default: true },
  notifyInvestment: { type: Boolean, default: true },
  notifyVirus: { type: Boolean, default: true },
  lastNotificationSent: { type: Date, default: null },
  enabled: { type: Boolean, default: true, index: true },
}, {
  timestamps: true
});

export const MinMaxSubscription = mongoose.model<IMinMaxSubscription>('MinMaxSubscription', MinMaxSubscriptionSchema);
