import mongoose from 'mongoose';
import { Donation } from '../src/models/Donation';
import { connectDB } from '../src/config/db';

const donations = [
  { playerName: "KlarkKent", donationItem: "Xanax" },
  { playerName: "TornPlayer123", donationItem: "Energy Drink" },
  { playerName: "GymRat99", donationItem: "Xanax" },
];

async function seedDonations() {
  try {
    await connectDB();
    
    // Clear existing donations (optional, comment out if you want to keep existing data)
    await Donation.deleteMany({});
    
    // Insert new donations
    await Donation.insertMany(donations);
    
    console.log('✅ Donations seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding donations:', error);
    process.exit(1);
  }
}

seedDonations();
