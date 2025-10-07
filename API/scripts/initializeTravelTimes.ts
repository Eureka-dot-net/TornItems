import mongoose from 'mongoose';
import { TravelTime } from '../src/models/TravelTime';
import { connectDB } from '../src/config/db';

// Travel times in minutes from the problem statement
const travelTimes = {
  "arg": { name: "Argentina", time: 210 },
  "mex": { name: "Mexico", time: 135 },
  "cay": { name: "Cayman Islands", time: 120 },
  "can": { name: "Canada", time: 60 },
  "haw": { name: "Hawaii", time: 180 },
  "swi": { name: "Switzerland", time: 180 },
  "jap": { name: "Japan", time: 240 },
  "chi": { name: "China", time: 240 },
  "uni": { name: "United Kingdom", time: 150 },
  "sou": { name: "South Africa", time: 270 },
  "uae": { name: "UAE", time: 240 }
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
