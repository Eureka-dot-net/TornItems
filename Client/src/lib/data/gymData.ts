import type { Gym } from '../utils/gymProgressionCalculator';

// Hardcoded gym data
export const GYMS: Gym[] = [
  { name: "premierfitness", displayName: "Premier Fitness", strength: 2, speed: 2, defense: 2, dexterity: 2, energyPerTrain: 5, costToUnlock: 10, energyToUnlock: 0 },
  { name: "averagejoes", displayName: "Average Joes", strength: 2.4, speed: 2.4, defense: 2.7, dexterity: 2.4, energyPerTrain: 5, costToUnlock: 100, energyToUnlock: 200 },
  { name: "woodysworkout", displayName: "Woody's Workout", strength: 2.7, speed: 3.2, defense: 3, dexterity: 2.7, energyPerTrain: 5, costToUnlock: 250, energyToUnlock: 700 },
  { name: "beachbods", displayName: "Beach Bods", strength: 3.2, speed: 3.2, defense: 3.2, dexterity: null, energyPerTrain: 5, costToUnlock: 500, energyToUnlock: 1700 },
  { name: "silvergym", displayName: "Silver Gym", strength: 3.4, speed: 3.6, defense: 3.4, dexterity: 3.2, energyPerTrain: 5, costToUnlock: 1000, energyToUnlock: 3700 },
  { name: "pourfemme", displayName: "Pour Femme", strength: 3.4, speed: 3.6, defense: 3.6, dexterity: 3.8, energyPerTrain: 5, costToUnlock: 2500, energyToUnlock: 6450 },
  { name: "daviesden", displayName: "Davies Den", strength: 3.7, speed: null, defense: 3.7, dexterity: 3.7, energyPerTrain: 5, costToUnlock: 5000, energyToUnlock: 9450 },
  { name: "globalgym", displayName: "Global Gym", strength: 4, speed: 4, defense: 4, dexterity: 4, energyPerTrain: 5, costToUnlock: 10000, energyToUnlock: 12950 },
  { name: "knuckleheads", displayName: "Knuckle Heads", strength: 4.8, speed: 4.4, defense: 4, dexterity: 4.2, energyPerTrain: 10, costToUnlock: 50000, energyToUnlock: 16950 },
  { name: "pioneerfitness", displayName: "Pioneer Fitness", strength: 4.4, speed: 4.6, defense: 4.8, dexterity: 4.4, energyPerTrain: 10, costToUnlock: 100000, energyToUnlock: 22950 },
  { name: "anabolicanomalies", displayName: "Anabolic Anomalies", strength: 5, speed: 4.6, defense: 5.2, dexterity: 4.6, energyPerTrain: 10, costToUnlock: 250000, energyToUnlock: 29950 },
  { name: "core", displayName: "Core", strength: 5, speed: 5.2, defense: 5, dexterity: 5, energyPerTrain: 10, costToUnlock: 500000, energyToUnlock: 37950 },
  { name: "racingfitness", displayName: "Racing Fitness", strength: 5, speed: 5.4, defense: 4.8, dexterity: 5.2, energyPerTrain: 10, costToUnlock: 1000000, energyToUnlock: 48950 },
  { name: "completecardio", displayName: "Complete Cardio", strength: 5.5, speed: 5.7, defense: 5.5, dexterity: 5.2, energyPerTrain: 10, costToUnlock: 2000000, energyToUnlock: 61370 },
  { name: "legsbumsandtums", displayName: "Legs, Bums and Tums", strength: null, speed: 5.5, defense: 5.5, dexterity: 5.7, energyPerTrain: 10, costToUnlock: 3000000, energyToUnlock: 79370 },
  { name: "deepburn", displayName: "Deep Burn", strength: 6, speed: 6, defense: 6, dexterity: 6, energyPerTrain: 10, costToUnlock: 5000000, energyToUnlock: 97470 },
  { name: "apollogym", displayName: "Apollo Gym", strength: 6, speed: 6.2, defense: 6.4, dexterity: 6.2, energyPerTrain: 10, costToUnlock: 7500000, energyToUnlock: 121610 },
  { name: "gunshop", displayName: "Gun Shop", strength: 6.5, speed: 6.4, defense: 6.2, dexterity: 6.2, energyPerTrain: 10, costToUnlock: 10000000, energyToUnlock: 152870 },
  { name: "forcetraining", displayName: "Force Training", strength: 6.4, speed: 6.5, defense: 6.4, dexterity: 6.8, energyPerTrain: 10, costToUnlock: 15000000, energyToUnlock: 189480 },
  { name: "chachas", displayName: "Cha Cha's", strength: 6.4, speed: 6.4, defense: 6.8, dexterity: 7, energyPerTrain: 10, costToUnlock: 20000000, energyToUnlock: 236120 },
  { name: "atlas", displayName: "Atlas", strength: 7, speed: 6.4, defense: 6.4, dexterity: 6.5, energyPerTrain: 10, costToUnlock: 30000000, energyToUnlock: 292640 },
  { name: "lastround", displayName: "Last Round", strength: 6.8, speed: 6.5, defense: 7, dexterity: 6.5, energyPerTrain: 10, costToUnlock: 50000000, energyToUnlock: 360415 },
  { name: "theedge", displayName: "The Edge", strength: 6.8, speed: 7, defense: 7, dexterity: 6.8, energyPerTrain: 10, costToUnlock: 75000000, energyToUnlock: 444950 },
  { name: "georges", displayName: "George's", strength: 7.3, speed: 7.3, defense: 7.3, dexterity: 7.3, energyPerTrain: 10, costToUnlock: 100000000, energyToUnlock: 551255 },
  // Specialty gyms - unlocked when Cha Cha's is unlocked
  { 
    name: "balboasgym", 
    displayName: "Balboa's Gym", 
    strength: null, 
    speed: null, 
    defense: 7.5, 
    dexterity: 7.5, 
    energyPerTrain: 25, 
    costToUnlock: 50000000, 
    energyToUnlock: 236120, // Same as Cha Cha's
    specialtyRequirement: (stats) => {
      // Defense + Dexterity must be 25% higher than Strength + Speed
      const defDex = stats.defense + stats.dexterity;
      const strSpd = stats.strength + stats.speed;
      return defDex >= strSpd * 1.25;
    }
  },
  { 
    name: "frontlinefitness", 
    displayName: "Frontline Fitness", 
    strength: 7.5, 
    speed: 7.5, 
    defense: null, 
    dexterity: null, 
    energyPerTrain: 25, 
    costToUnlock: 50000000, 
    energyToUnlock: 236120, // Same as Cha Cha's
    specialtyRequirement: (stats) => {
      // Strength + Speed must be 25% higher than Dexterity + Defense
      const strSpd = stats.strength + stats.speed;
      const defDex = stats.defense + stats.dexterity;
      return strSpd >= defDex * 1.25;
    }
  },
  // Specialty gyms - unlocked when George's is unlocked
  { 
    name: "gym3000", 
    displayName: "Gym 3000", 
    strength: 8.0, 
    speed: null, 
    defense: null, 
    dexterity: null, 
    energyPerTrain: 50, 
    costToUnlock: 100000000, 
    energyToUnlock: 551255, // Same as George's
    specialtyRequirement: (stats) => {
      // Strength must be 25% higher than second highest stat
      const sortedStats = [stats.speed, stats.defense, stats.dexterity].sort((a, b) => b - a);
      const secondHighest = sortedStats[0];
      return stats.strength >= secondHighest * 1.25;
    }
  },
  { 
    name: "mrisoyamas", 
    displayName: "Mr. Isoyama's", 
    strength: null, 
    speed: null, 
    defense: 8.0, 
    dexterity: null, 
    energyPerTrain: 50, 
    costToUnlock: 100000000, 
    energyToUnlock: 551255, // Same as George's
    specialtyRequirement: (stats) => {
      // Defense must be 25% higher than second highest stat
      const sortedStats = [stats.strength, stats.speed, stats.dexterity].sort((a, b) => b - a);
      const secondHighest = sortedStats[0];
      return stats.defense >= secondHighest * 1.25;
    }
  },
  { 
    name: "totalrebound", 
    displayName: "Total Rebound", 
    strength: null, 
    speed: 8.0, 
    defense: null, 
    dexterity: null, 
    energyPerTrain: 50, 
    costToUnlock: 100000000, 
    energyToUnlock: 551255, // Same as George's
    specialtyRequirement: (stats) => {
      // Speed must be 25% higher than second highest stat
      const sortedStats = [stats.strength, stats.defense, stats.dexterity].sort((a, b) => b - a);
      const secondHighest = sortedStats[0];
      return stats.speed >= secondHighest * 1.25;
    }
  },
  { 
    name: "elites", 
    displayName: "Elites", 
    strength: null, 
    speed: null, 
    defense: null, 
    dexterity: 8.0, 
    energyPerTrain: 50, 
    costToUnlock: 100000000, 
    energyToUnlock: 551255, // Same as George's
    specialtyRequirement: (stats) => {
      // Dexterity must be 25% higher than second highest stat
      const sortedStats = [stats.strength, stats.speed, stats.defense].sort((a, b) => b - a);
      const secondHighest = sortedStats[0];
      return stats.dexterity >= secondHighest * 1.25;
    }
  },
];
