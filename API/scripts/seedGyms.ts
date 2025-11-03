import mongoose from 'mongoose';
import { Gym } from '../src/models/Gym';
import { connectDB } from '../src/config/db';

const gyms = [
  // London Gyms (5 energy) - costs and energy to unlock from problem statement
  { name: "premierfitness", displayName: "Premier Fitness", strength: 2, speed: 2, defense: 2, dexterity: 2, energyPerTrain: 5, costToUnlock: 10, energyToUnlock: 200 },
  { name: "averagejoes", displayName: "Average Joes", strength: 2.4, speed: 2.4, defense: 2.7, dexterity: 2.4, energyPerTrain: 5, costToUnlock: 100, energyToUnlock: 500 },
  { name: "woodysworkout", displayName: "Woody's Workout", strength: 2.7, speed: 3.2, defense: 3, dexterity: 2.7, energyPerTrain: 5, costToUnlock: 250, energyToUnlock: 1000 },
  { name: "beachbods", displayName: "Beach Bods", strength: 3.2, speed: 3.2, defense: 3.2, dexterity: null, energyPerTrain: 5, costToUnlock: 500, energyToUnlock: 2000 },
  { name: "silvergym", displayName: "Silver Gym", strength: 3.4, speed: 3.6, defense: 3.4, dexterity: 3.2, energyPerTrain: 5, costToUnlock: 1000, energyToUnlock: 2750 },
  { name: "pourfemme", displayName: "Pour Femme", strength: 3.4, speed: 3.6, defense: 3.6, dexterity: 3.8, energyPerTrain: 5, costToUnlock: 2500, energyToUnlock: 3000 },
  { name: "daviesden", displayName: "Davies Den", strength: 3.7, speed: null, defense: 3.7, dexterity: 3.7, energyPerTrain: 5, costToUnlock: 5000, energyToUnlock: 3500 },
  { name: "globalgym", displayName: "Global Gym", strength: 4, speed: 4, defense: 4, dexterity: 4, energyPerTrain: 5, costToUnlock: 10000, energyToUnlock: 4000 },
  
  // Medium Gyms (10 energy)
  { name: "knuckleheads", displayName: "Knuckle Heads", strength: 4.8, speed: 4.4, defense: 4, dexterity: 4.2, energyPerTrain: 10, costToUnlock: 50000, energyToUnlock: 6000 },
  { name: "pioneerfitness", displayName: "Pioneer Fitness", strength: 4.4, speed: 4.6, defense: 4.8, dexterity: 4.4, energyPerTrain: 10, costToUnlock: 100000, energyToUnlock: 7000 },
  { name: "anabolicanomalies", displayName: "Anabolic Anomalies", strength: 5, speed: 4.6, defense: 5.2, dexterity: 4.6, energyPerTrain: 10, costToUnlock: 250000, energyToUnlock: 8000 },
  { name: "core", displayName: "Core", strength: 5, speed: 5.2, defense: 5, dexterity: 5, energyPerTrain: 10, costToUnlock: 500000, energyToUnlock: 11000 },
  { name: "racingfitness", displayName: "Racing Fitness", strength: 5, speed: 5.4, defense: 4.8, dexterity: 5.2, energyPerTrain: 10, costToUnlock: 1000000, energyToUnlock: 12420 },
  { name: "completecardio", displayName: "Complete Cardio", strength: 5.5, speed: 5.7, defense: 5.5, dexterity: 5.2, energyPerTrain: 10, costToUnlock: 2000000, energyToUnlock: 18000 },
  { name: "legsbumsandtums", displayName: "Legs, Bums and Tums", strength: null, speed: 5.5, defense: 5.5, dexterity: 5.7, energyPerTrain: 10, costToUnlock: 3000000, energyToUnlock: 18100 },
  { name: "deepburn", displayName: "Deep Burn", strength: 6, speed: 6, defense: 6, dexterity: 6, energyPerTrain: 10, costToUnlock: 5000000, energyToUnlock: 24140 },
  
  // High Gyms (10 energy)
  { name: "apollogym", displayName: "Apollo Gym", strength: 6, speed: 6.2, defense: 6.4, dexterity: 6.2, energyPerTrain: 10, costToUnlock: 7500000, energyToUnlock: 31260 },
  { name: "gunshop", displayName: "Gun Shop", strength: 6.5, speed: 6.4, defense: 6.2, dexterity: 6.2, energyPerTrain: 10, costToUnlock: 10000000, energyToUnlock: 36610 },
  { name: "forcetraining", displayName: "Force Training", strength: 6.4, speed: 6.5, defense: 6.4, dexterity: 6.8, energyPerTrain: 10, costToUnlock: 15000000, energyToUnlock: 46640 },
  { name: "chachas", displayName: "Cha Cha's", strength: 6.4, speed: 6.4, defense: 6.8, dexterity: 7, energyPerTrain: 10, costToUnlock: 20000000, energyToUnlock: 56520 },
  { name: "atlas", displayName: "Atlas", strength: 7, speed: 6.4, defense: 6.4, dexterity: 6.5, energyPerTrain: 10, costToUnlock: 30000000, energyToUnlock: 67775 },
  { name: "lastround", displayName: "Last Round", strength: 6.8, speed: 6.5, defense: 7, dexterity: 6.5, energyPerTrain: 10, costToUnlock: 50000000, energyToUnlock: 84535 },
  { name: "theedge", displayName: "The Edge", strength: 6.8, speed: 7, defense: 7, dexterity: 6.8, energyPerTrain: 10, costToUnlock: 75000000, energyToUnlock: 106305 },
  { name: "georges", displayName: "George's", strength: 7.3, speed: 7.3, defense: 7.3, dexterity: 7.3, energyPerTrain: 10, costToUnlock: 100000000, energyToUnlock: 0 },
  
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
