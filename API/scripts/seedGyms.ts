import mongoose from 'mongoose';
import { Gym } from '../src/models/Gym';
import { connectDB } from '../src/config/db';

const gyms = [
  // London Gyms (5 energy)
  { name: "premierfitness", displayName: "Premier Fitness [L]", strength: 2, speed: 2, defense: 2, dexterity: 2, energyPerTrain: 5 },
  { name: "averagejoes", displayName: "Average Joes [L]", strength: 2.4, speed: 2.4, defense: 2.8, dexterity: 2.4, energyPerTrain: 5 },
  { name: "woodysworkout", displayName: "Woody's Workout [L]", strength: 2.8, speed: 3.2, defense: 3, dexterity: 2.8, energyPerTrain: 5 },
  { name: "beachbods", displayName: "Beach Bods [L]", strength: 3.2, speed: 3.2, defense: 3.2, dexterity: null, energyPerTrain: 5 },
  { name: "silvergym", displayName: "Silver Gym [L]", strength: 3.4, speed: 3.6, defense: 3.4, dexterity: 3.2, energyPerTrain: 5 },
  { name: "pourfemme", displayName: "Pour Femme [L]", strength: 3.4, speed: 3.6, defense: 3.6, dexterity: 3.8, energyPerTrain: 5 },
  { name: "daviesden", displayName: "Davies Den [L]", strength: 3.7, speed: null, defense: 3.7, dexterity: 3.7, energyPerTrain: 5 },
  { name: "globalgym", displayName: "Global Gym [L]", strength: 4, speed: 4, defense: 4, dexterity: 4, energyPerTrain: 5 },
  { name: "london", displayName: "London [L]", strength: 3.0, speed: 3.0, defense: 3.0, dexterity: 3.0, energyPerTrain: 5 },
  
  // Medium Gyms (10 energy)
  { name: "knuckleheads", displayName: "Knuckle Heads [M]", strength: 4.8, speed: 4.4, defense: 4, dexterity: 4.2, energyPerTrain: 10 },
  { name: "pioneerfitness", displayName: "Pioneer Fitness [M]", strength: 4.4, speed: 4.6, defense: 4.8, dexterity: 4.4, energyPerTrain: 10 },
  { name: "anabolicanomalies", displayName: "Anabolic Anomalies [M]", strength: 5, speed: 4.6, defense: 5.2, dexterity: 4.6, energyPerTrain: 10 },
  { name: "core", displayName: "Core [M]", strength: 5, speed: 5.2, defense: 5, dexterity: 5, energyPerTrain: 10 },
  { name: "racingfitness", displayName: "Racing Fitness [M]", strength: 5, speed: 5.4, defense: 4.8, dexterity: 5.2, energyPerTrain: 10 },
  { name: "completecardio", displayName: "Complete Cardio [M]", strength: 5.5, speed: 5.8, defense: 5.5, dexterity: 5.2, energyPerTrain: 10 },
  { name: "legsbumsandtums", displayName: "Legs, Bums and Tums [M]", strength: null, speed: 5.6, defense: 5.6, dexterity: 5.8, energyPerTrain: 10 },
  { name: "deepburn", displayName: "Deep Burn [M]", strength: 6, speed: 6, defense: 6, dexterity: 6, energyPerTrain: 10 },
  
  // High Gyms (10 energy)
  { name: "apollogym", displayName: "Apollo Gym [H]", strength: 6, speed: 6.2, defense: 6.4, dexterity: 6.2, energyPerTrain: 10 },
  { name: "gunshop", displayName: "Gun Shop [H]", strength: 6.6, speed: 6.4, defense: 6.2, dexterity: 6.2, energyPerTrain: 10 },
  { name: "forcetraining", displayName: "Force Training [H]", strength: 6.4, speed: 6.6, defense: 6.4, dexterity: 6.8, energyPerTrain: 10 },
  { name: "chachas", displayName: "Cha Cha's [H]", strength: 6.4, speed: 6.4, defense: 6.8, dexterity: 7, energyPerTrain: 10 },
  { name: "atlas", displayName: "Atlas [H]", strength: 7, speed: 6.4, defense: 6.4, dexterity: 6.6, energyPerTrain: 10 },
  { name: "lastround", displayName: "Last Round [H]", strength: 6.8, speed: 6.6, defense: 7, dexterity: 6.6, energyPerTrain: 10 },
  { name: "theedge", displayName: "The Edge [H]", strength: 6.8, speed: 7, defense: 7, dexterity: 6.8, energyPerTrain: 10 },
  { name: "georges", displayName: "George's [H]", strength: 7.3, speed: 7.3, defense: 7.3, dexterity: 7.3, energyPerTrain: 10 },
  
  // Special Gyms
  { name: "balboasgym", displayName: "Balboas Gym [S]", strength: null, speed: null, defense: 7.5, dexterity: 7.5, energyPerTrain: 25 },
  { name: "frontlinefitness", displayName: "Frontline Fitness [S]", strength: 7.5, speed: 7.5, defense: null, dexterity: null, energyPerTrain: 25 },
  { name: "gym3000", displayName: "Gym 3000 [S]", strength: 8, speed: null, defense: null, dexterity: null, energyPerTrain: 50 },
  { name: "mrisoyamas", displayName: "Mr. Isoyamas [S]", strength: null, speed: null, defense: 8, dexterity: null, energyPerTrain: 50 },
  { name: "totalrebound", displayName: "Total Rebound [S]", strength: null, speed: 8, defense: null, dexterity: null, energyPerTrain: 50 },
  { name: "elites", displayName: "Elites [S]", strength: null, speed: null, defense: null, dexterity: 8, energyPerTrain: 50 },
  { name: "sportssciencelab", displayName: "Sports Science Lab [S]", strength: 9, speed: 9, defense: 9, dexterity: 9, energyPerTrain: 25 },
  
  // Jail Gym
  { name: "jailgym", displayName: "The Jail Gym", strength: 3.4, speed: 3.4, defense: 4.6, dexterity: null, energyPerTrain: 5 },
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
