import mongoose from 'mongoose';
import { TravelTime } from '../src/models/TravelTime';
import { connectDB } from '../src/config/db';

// Travel times in minutes (Standard times without private island)
// With private island (airstrip), times are reduced by approximately 30%
const travelTimes = {
  "mex": { name: "Mexico", time: 26 },
  "cay": { name: "Cayman Islands", time: 35 },
  "can": { name: "Canada", time: 41 },
  "haw": { name: "Hawaii", time: 134 },
  "uni": { name: "United Kingdom", time: 159 },
  "arg": { name: "Argentina", time: 167 },
  "swi": { name: "Switzerland", time: 175 },
  "jap": { name: "Japan", time: 225 },
  "chi": { name: "China", time: 242 },
  "uae": { name: "UAE", time: 271 },
  "sou": { name: "South Africa", time: 297 }
};

async function initializeTravelTimes() {
  try {
    await connectDB();
    console.log('Connected to database');

    for (const [countryCode, data] of Object.entries(travelTimes)) {
      await TravelTime.findOneAndUpdate(
        { countryCode },
        {
          countryCode,
          countryName: data.name,
          travelTimeMinutes: data.time,
          lastUpdated: new Date(),
        },
        { upsert: true, new: true }
      );
      console.log(`✅ Initialized travel time for ${data.name}: ${data.time} minutes`);
    }

    console.log('\n✅ All travel times initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error initializing travel times:', error);
    process.exit(1);
  }
}

initializeTravelTimes();
