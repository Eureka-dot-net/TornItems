/**
 * Seed script for Training Authorized Users
 * 
 * This script populates the TrainingAuthorizedUser collection with the initial
 * list of authorized users who can access the Training Recommendations feature.
 * 
 * Usage: npx ts-node scripts/seedTrainingAuthorizedUsers.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { TrainingAuthorizedUser } from '../src/models/TrainingAuthorizedUser';

dotenv.config();

const authorizedUsers = [
  { tornUserId: 3926388, name: 'Muppet' },
  { tornUserId: 3936212, name: 'Fulkol' },
  { tornUserId: 3925137, name: 'Freakman' },
];

async function seedTrainingAuthorizedUsers() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('❌ MONGO_URI environment variable is not set');
      console.log('Please set MONGO_URI in your .env file');
      process.exit(1);
    }

    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    console.log('\n🔄 Seeding Training Authorized Users...\n');

    for (const user of authorizedUsers) {
      // Upsert to avoid duplicates
      const result = await TrainingAuthorizedUser.findOneAndUpdate(
        { tornUserId: user.tornUserId },
        { 
          tornUserId: user.tornUserId,
          name: user.name,
          authorizedAt: new Date()
        },
        { upsert: true, new: true }
      );
      console.log(`✅ Added/Updated: ${user.name} (ID: ${user.tornUserId})`);
    }

    console.log(`\n✅ Successfully seeded ${authorizedUsers.length} authorized users`);

    // List all authorized users
    const allUsers = await TrainingAuthorizedUser.find().lean();
    console.log('\n📋 Current Authorized Users:');
    allUsers.forEach(user => {
      console.log(`   - ${user.name} (ID: ${user.tornUserId}) - Added: ${user.authorizedAt.toISOString()}`);
    });

  } catch (error) {
    console.error('❌ Error seeding authorized users:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔄 Disconnected from MongoDB');
  }
}

seedTrainingAuthorizedUsers();
