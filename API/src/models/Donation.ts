import mongoose, { Schema, Document } from 'mongoose';

export interface IDonation extends Document {
  _id: mongoose.Types.ObjectId;
  playerName: string;
  donationItem: string;
  createdAt: Date;
}

const DonationSchema = new Schema<IDonation>({
  playerName: { type: String, required: true },
  donationItem: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const Donation = mongoose.model<IDonation>('Donation', DonationSchema);
