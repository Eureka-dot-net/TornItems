/**
 * Gym Progression and Comparison Calculator
 * Calculates stat gains over time accounting for gym unlocks and company benefits
 */

export interface Gym {
  name: string;
  displayName: string;
  strength: number | null;
  speed: number | null;
  defense: number | null;
  dexterity: number | null;
  energyPerTrain: number;
  energyToUnlock: number;
  costToUnlock: number;
}

export interface StatWeights {
  strength: number;
  speed: number;
  defense: number;
  dexterity: number;
}

export interface CompanyBenefit {
  name: string;
  gymUnlockSpeedMultiplier: number; // e.g., 1.3 for 30% faster
  bonusEnergyPerDay: number;
}

export interface SimulationInputs {
  statWeights: StatWeights;
  months: number;
  xanaxPerDay: number;
  hasPointsRefill: boolean;
  hoursPlayedPerDay: number;
  companyBenefit: CompanyBenefit;
  apiKey?: string;
  initialStats?: {
    strength: number;
    speed: number;
    defense: number;
    dexterity: number;
  };
  happy: number;
  perkPerc: number;
}

export interface DailySnapshot {
  day: number;
  strength: number;
  speed: number;
  defense: number;
  dexterity: number;
  currentGym: string;
  energySpentOnGymUnlock: number;
}

export interface SimulationResult {
  dailySnapshots: DailySnapshot[];
  finalStats: {
    strength: number;
    speed: number;
    defense: number;
    dexterity: number;
  };
}

/**
 * Calculate daily energy available based on hours played, xanax, and points refill
 */
export function calculateDailyEnergy(
  hoursPlayedPerDay: number,
  xanaxPerDay: number,
  hasPointsRefill: boolean,
  bonusEnergyPerDay: number = 0
): number {
  // Energy regenerates 5 every 10 minutes = 30 per hour
  // Maximum energy bar is 150
  
  // Clamp hours to 0-24
  const hours = Math.max(0, Math.min(24, hoursPlayedPerDay));
  
  let energy = 0;
  
  if (hours >= 24) {
    // Playing 24 hours straight - no starting 150, just regeneration
    energy = 24 * 30; // 720 energy
  } else {
    // Start with 150, then regenerate during play time
    energy = 150 + (hours * 30);
    // Cap at 150 + regeneration (can't exceed what's possible)
    energy = Math.min(energy, 150 + (hours * 30));
  }
  
  // Add xanax energy (250 per xanax)
  energy += xanaxPerDay * 250;
  
  // Add points refill energy (150)
  if (hasPointsRefill) {
    energy += 150;
  }
  
  // Add company benefit bonus energy
  energy += bonusEnergyPerDay;
  
  return energy;
}

/**
 * Compute stat gain using Vladar's formula (from existing statGainCalculator)
 */
function computeStatGain(
  stat: string,
  statTotal: number,
  happy: number,
  perkPerc: number,
  dots: number,
  energyPerTrain: number
): number {
  const lookupTable: Record<string, [number, number]> = {
    strength: [1600, 1700],
    speed: [1600, 2000],
    defense: [2100, -600],
    dexterity: [1800, 1500],
  };
  
  const [lookup2, lookup3] = lookupTable[stat];

  // Adjusted stat for values over 50M
  const adjustedStat =
    statTotal < 50_000_000
      ? statTotal
      : (statTotal - 50_000_000) / (8.77635 * Math.log(statTotal)) + 50_000_000;

  // Happy multiplier with proper rounding
  const innerRound = Math.round(Math.log(1 + happy / 250) * 10000) / 10000;
  const happyMult = Math.round((1 + 0.07 * innerRound) * 10000) / 10000;
  
  // Perk bonus multiplier
  const perkBonus = 1 + perkPerc / 100;

  // Vladar's formula
  const multiplier = (1 / 200000) * dots * energyPerTrain * perkBonus;
  const innerExpression = 
    adjustedStat * happyMult + 
    8 * Math.pow(happy, 1.05) + 
    lookup2 * (1 - Math.pow(happy / 99999, 2)) + 
    lookup3;

  const gain = multiplier * innerExpression;
  return gain;
}

/**
 * Find the best gym available for a given stat and energy spent
 */
function findBestGym(
  gyms: Gym[],
  stat: string,
  totalEnergySpent: number,
  gymUnlockSpeedMultiplier: number
): Gym {
  // Filter gyms that support this stat and are unlocked
  const availableGyms = gyms.filter(gym => {
    const statDots = (gym as any)[stat];
    if (statDots === null || statDots === undefined) return false;
    
    // Apply company benefit to unlock requirement
    const adjustedEnergyToUnlock = gym.energyToUnlock / gymUnlockSpeedMultiplier;
    
    return totalEnergySpent >= adjustedEnergyToUnlock;
  });
  
  if (availableGyms.length === 0) {
    throw new Error(`No gyms available for stat: ${stat}`);
  }
  
  // Sort by dots (descending) and return the best
  availableGyms.sort((a, b) => {
    const aValue = (a as any)[stat] || 0;
    const bValue = (b as any)[stat] || 0;
    return bValue - aValue;
  });
  
  return availableGyms[0];
}

/**
 * Simulate gym progression over time
 */
export function simulateGymProgression(
  gyms: Gym[],
  inputs: SimulationInputs
): SimulationResult {
  const dailyEnergy = calculateDailyEnergy(
    inputs.hoursPlayedPerDay,
    inputs.xanaxPerDay,
    inputs.hasPointsRefill,
    inputs.companyBenefit.bonusEnergyPerDay
  );
  
  const totalDays = inputs.months * 30;
  
  // Initialize stats
  const stats = {
    strength: inputs.initialStats?.strength || 1000,
    speed: inputs.initialStats?.speed || 1000,
    defense: inputs.initialStats?.defense || 1000,
    dexterity: inputs.initialStats?.dexterity || 1000,
  };
  
  // Calculate total weight for energy distribution
  const totalWeight = 
    inputs.statWeights.strength + 
    inputs.statWeights.speed + 
    inputs.statWeights.defense + 
    inputs.statWeights.dexterity;
  
  if (totalWeight === 0) {
    throw new Error('Total stat weights cannot be zero');
  }
  
  // Track total energy spent (for gym unlocks)
  let totalEnergySpent = 0;
  
  const dailySnapshots: DailySnapshot[] = [];
  
  // Simulate each day
  for (let day = 1; day <= totalDays; day++) {
    const energySpentOnGymUnlock = 0;
    
    // Distribute energy among stats based on weights
    const energyPerStat = {
      strength: (dailyEnergy * inputs.statWeights.strength) / totalWeight,
      speed: (dailyEnergy * inputs.statWeights.speed) / totalWeight,
      defense: (dailyEnergy * inputs.statWeights.defense) / totalWeight,
      dexterity: (dailyEnergy * inputs.statWeights.dexterity) / totalWeight,
    };
    
    // Find best gym for each stat and train
    const statOrder: Array<keyof typeof stats> = ['strength', 'speed', 'defense', 'dexterity'];
    
    for (const stat of statOrder) {
      if (energyPerStat[stat] === 0) continue;
      
      try {
        const gym = findBestGym(
          gyms,
          stat,
          totalEnergySpent,
          inputs.companyBenefit.gymUnlockSpeedMultiplier
        );
        
        const statDots = (gym as any)[stat];
        if (!statDots) continue;
        
        // Calculate number of trains for this stat
        const trains = Math.floor(energyPerStat[stat] / gym.energyPerTrain);
        
        // Calculate stat gain for each train
        for (let i = 0; i < trains; i++) {
          const gain = computeStatGain(
            stat,
            stats[stat],
            inputs.happy,
            inputs.perkPerc,
            statDots,
            gym.energyPerTrain
          );
          
          stats[stat] += gain;
          totalEnergySpent += gym.energyPerTrain;
        }
      } catch (error) {
        // Gym not found for this stat, skip
        console.warn(`No gym found for ${stat} at energy ${totalEnergySpent}`);
      }
    }
    
    // Take snapshot every 7 days or on first/last day
    if (day === 1 || day === totalDays || day % 7 === 0) {
      // Find current gym (use the best gym for the highest weighted stat)
      let currentGym = 'Unknown';
      try {
        const primaryStat = Object.entries(inputs.statWeights)
          .filter(([_, weight]) => weight > 0)
          .sort(([_, a], [__, b]) => b - a)[0];
        
        if (primaryStat) {
          const gym = findBestGym(
            gyms,
            primaryStat[0],
            totalEnergySpent,
            inputs.companyBenefit.gymUnlockSpeedMultiplier
          );
          currentGym = gym.displayName;
        }
      } catch (error) {
        // Ignore
      }
      
      dailySnapshots.push({
        day,
        strength: Math.round(stats.strength),
        speed: Math.round(stats.speed),
        defense: Math.round(stats.defense),
        dexterity: Math.round(stats.dexterity),
        currentGym,
        energySpentOnGymUnlock,
      });
    }
  }
  
  return {
    dailySnapshots,
    finalStats: {
      strength: Math.round(stats.strength),
      speed: Math.round(stats.speed),
      defense: Math.round(stats.defense),
      dexterity: Math.round(stats.dexterity),
    },
  };
}
