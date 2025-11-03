import mongoose from 'mongoose';
import { Gym } from '../src/models/Gym';
import { connectDB } from '../src/config/db';

const gyms = [
  // London Gyms (5 energy) - Cumulative energy to unlock each gym
  { name: "premierfitness", displayName: "Premier Fitness", strength: 2, speed: 2, defense: 2, dexterity: 2, energyPerTrain: 5, costToUnlock: 10, energyToUnlock: 0 }, // Starting gym - no unlock needed
  { name: "averagejoes", displayName: "Average Joes", strength: 2.4, speed: 2.4, defense: 2.7, dexterity: 2.4, energyPerTrain: 5, costToUnlock: 100, energyToUnlock: 200 }, // 200
  { name: "woodysworkout", displayName: "Woody's Workout", strength: 2.7, speed: 3.2, defense: 3, dexterity: 2.7, energyPerTrain: 5, costToUnlock: 250, energyToUnlock: 700 }, // 200 + 500
  { name: "beachbods", displayName: "Beach Bods", strength: 3.2, speed: 3.2, defense: 3.2, dexterity: null, energyPerTrain: 5, costToUnlock: 500, energyToUnlock: 1700 }, // 700 + 1000
  { name: "silvergym", displayName: "Silver Gym", strength: 3.4, speed: 3.6, defense: 3.4, dexterity: 3.2, energyPerTrain: 5, costToUnlock: 1000, energyToUnlock: 3700 }, // 1700 + 2000
  { name: "pourfemme", displayName: "Pour Femme", strength: 3.4, speed: 3.6, defense: 3.6, dexterity: 3.8, energyPerTrain: 5, costToUnlock: 2500, energyToUnlock: 6450 }, // 3700 + 2750
  { name: "daviesden", displayName: "Davies Den", strength: 3.7, speed: null, defense: 3.7, dexterity: 3.7, energyPerTrain: 5, costToUnlock: 5000, energyToUnlock: 9450 }, // 6450 + 3000
  { name: "globalgym", displayName: "Global Gym", strength: 4, speed: 4, defense: 4, dexterity: 4, energyPerTrain: 5, costToUnlock: 10000, energyToUnlock: 12950 }, // 9450 + 3500
  
  // Medium Gyms (10 energy)
  { name: "knuckleheads", displayName: "Knuckle Heads", strength: 4.8, speed: 4.4, defense: 4, dexterity: 4.2, energyPerTrain: 10, costToUnlock: 50000, energyToUnlock: 16950 }, // 12950 + 4000
  { name: "pioneerfitness", displayName: "Pioneer Fitness", strength: 4.4, speed: 4.6, defense: 4.8, dexterity: 4.4, energyPerTrain: 10, costToUnlock: 100000, energyToUnlock: 22950 }, // 16950 + 6000
  { name: "anabolicanomalies", displayName: "Anabolic Anomalies", strength: 5, speed: 4.6, defense: 5.2, dexterity: 4.6, energyPerTrain: 10, costToUnlock: 250000, energyToUnlock: 29950 }, // 22950 + 7000
  { name: "core", displayName: "Core", strength: 5, speed: 5.2, defense: 5, dexterity: 5, energyPerTrain: 10, costToUnlock: 500000, energyToUnlock: 37950 }, // 29950 + 8000
  { name: "racingfitness", displayName: "Racing Fitness", strength: 5, speed: 5.4, defense: 4.8, dexterity: 5.2, energyPerTrain: 10, costToUnlock: 1000000, energyToUnlock: 48950 }, // 37950 + 11000
  { name: "completecardio", displayName: "Complete Cardio", strength: 5.5, speed: 5.7, defense: 5.5, dexterity: 5.2, energyPerTrain: 10, costToUnlock: 2000000, energyToUnlock: 61370 }, // 48950 + 12420
  { name: "legsbumsandtums", displayName: "Legs, Bums and Tums", strength: null, speed: 5.5, defense: 5.5, dexterity: 5.7, energyPerTrain: 10, costToUnlock: 3000000, energyToUnlock: 79370 }, // 61370 + 18000
  { name: "deepburn", displayName: "Deep Burn", strength: 6, speed: 6, defense: 6, dexterity: 6, energyPerTrain: 10, costToUnlock: 5000000, energyToUnlock: 97470 }, // 79370 + 18100
  
  // High Gyms (10 energy)
  { name: "apollogym", displayName: "Apollo Gym", strength: 6, speed: 6.2, defense: 6.4, dexterity: 6.2, energyPerTrain: 10, costToUnlock: 7500000, energyToUnlock: 121610 }, // 97470 + 24140
  { name: "gunshop", displayName: "Gun Shop", strength: 6.5, speed: 6.4, defense: 6.2, dexterity: 6.2, energyPerTrain: 10, costToUnlock: 10000000, energyToUnlock: 152870 }, // 121610 + 31260
  { name: "forcetraining", displayName: "Force Training", strength: 6.4, speed: 6.5, defense: 6.4, dexterity: 6.8, energyPerTrain: 10, costToUnlock: 15000000, energyToUnlock: 189480 }, // 152870 + 36610
  { name: "chachas", displayName: "Cha Cha's", strength: 6.4, speed: 6.4, defense: 6.8, dexterity: 7, energyPerTrain: 10, costToUnlock: 20000000, energyToUnlock: 236120 }, // 189480 + 46640
  { name: "atlas", displayName: "Atlas", strength: 7, speed: 6.4, defense: 6.4, dexterity: 6.5, energyPerTrain: 10, costToUnlock: 30000000, energyToUnlock: 292640 }, // 236120 + 56520
  { name: "lastround", displayName: "Last Round", strength: 6.8, speed: 6.5, defense: 7, dexterity: 6.5, energyPerTrain: 10, costToUnlock: 50000000, energyToUnlock: 360415 }, // 292640 + 67775
  { name: "theedge", displayName: "The Edge", strength: 6.8, speed: 7, defense: 7, dexterity: 6.8, energyPerTrain: 10, costToUnlock: 75000000, energyToUnlock: 444950 }, // 360415 + 84535
  { name: "georges", displayName: "George's", strength: 7.3, speed: 7.3, defense: 7.3, dexterity: 7.3, energyPerTrain: 10, costToUnlock: 100000000, energyToUnlock: 551255 }, // 444950 + 106305
  
  // Special Gyms (not in problem statement, keeping as-is)
  { name: "balboasgym", displayName: "Balboas Gym [S]", strength: null, speed: null, defense: 7.5, dexterity: 7.5, energyPerTrain: 25, costToUnlock: 0, energyToUnlock: 0 },
  { name: "frontlinefitness", displayName: "Frontline Fitness [S]", strength: 7.5, speed: 7.5, defense: null, dexterity: null, energyPerTrain: 25, costToUnlock: 0, energyToUnlock: 0 },
  { name: "gym3000", displayName: "Gym 3000 [S]", strength: 8, speed: null, defense: null, dexterity: null, energyPerTrain: 50, costToUnlock: 0, energyToUnlock: 0 },
  { name: "mrisoyamas", displayName: "Mr. Isoyamas [S]", strength: null, speed: null, defense: 8, dexterity: null, energyPerTrain: 50, costToUnlock: 0, energyToUnlock: 0 },
  { name: "totalrebound", displayName: "Total Rebound [S]", strength: null, speed: 8, defense: null, dexterity: null, energyPerTrain: 50, costToUnlock: 0, energyToUnlock: 0 },
  { name: "elites", displayName: "Elites [S]", strength: null, speed: null, defense: null, dexterity: 8, energyPerTrain: 50, costToUnlock: 0, energyToUnlock: 0 },
  { name: "sportssciencelab", displayName: "Sports Science Lab [S]", strength: 9, speed: 9, defense: 9, dexterity: 9, energyPerTrain: 25, costToUnlock: 0, energyToUnlock: 0 },
  
  // Jail Gym
  { name: "jailgym", displayName: "The Jail Gym", strength: 3.4, speed: 3.4, defense: 4.6, dexterity: null, energyPerTrain: 5, costToUnlock: 0, energyToUnlock: 0 },
];

async function seedGyms() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Clear existing gyms
    await Gym.deleteMany({});
    console.log('Cleared existing gym data');

    // Insert all gyms
    await Gym.insertMany(gyms);
    console.log(`✅ Seeded ${gyms.length} gyms successfully`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding gyms:', error);
    process.exit(1);
  }
}

seedGyms();
