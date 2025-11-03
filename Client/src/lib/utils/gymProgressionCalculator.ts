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
  gymGainMultiplier: number; // e.g., 1.03 for 3% more gains
}

export interface SimulationInputs {
  statWeights: StatWeights;
  months: number;  // Number of months for future mode
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
  perkPercs: {
    strength: number;
    speed: number;
    defense: number;
    dexterity: number;
  };
  currentGymIndex: number; // >= 0 locks to specific gym, -1 means auto-upgrade
  manualEnergy?: number; // Optional: if specified, use this instead of calculating daily energy
  happyJump?: {
    enabled: boolean;
    frequencyDays: number; // e.g., 7 for weekly, 14 for every 2 weeks
    dvdsUsed: number;
  };
  daysSkippedPerMonth?: number; // Days per month with no energy (wars, vacations)
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
  // Maximum energy bar is 150 (fills in 5 hours)
  
  // Clamp hours to 0-24
  const hours = Math.max(0, Math.min(24, hoursPlayedPerDay));
  
  let energy = 0;
  
  if (hours >= 24) {
    // Playing 24 hours straight - no sleep, no natural refill, just regeneration
    energy = 24 * 30; // 720 energy
  } else {
    // Sleep time = 24 - hours played
    const sleepHours = 24 - hours;
    // Natural refill during sleep (max 150, takes 5 hours to fill)
    const naturalRefill = Math.min(150, sleepHours * 30);
    // Energy regeneration during play
    const playRegen = hours * 30;
    energy = naturalRefill + playRegen;
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
 * Compute stat gain using Vladar's formula
 * Formula: (Modifiers)*(Gym Dots)*(Energy Per Train)*[ (a*ln(Happy+b)+c) * (Stat Total) + d*(Happy+b) + e ]
 * Where:
 * a = 3.480061091 × 10^-7
 * b = 250
 * c = 3.091619094 × 10^-6
 * d = 6.82775184551527 × 10^-5
 * e = -0.0301431777
 */
function computeStatGain(
  _stat: 'strength' | 'speed' | 'defense' | 'dexterity',
  currentStatValue: number,
  happy: number,
  perkPercForStat: number,
  dots: number,
  energyPerTrain: number
): number {
  // Constants from Vladar's formula
  const a = 3.480061091e-7;
  const b = 250;
  const c = 3.091619094e-6;
  const d = 6.82775184551527e-5;
  const e = -0.0301431777;
  
  // Perk bonus multiplier (modifiers) - use the specific stat's perk percentage
  const perkBonus = 1 + perkPercForStat / 100;

  // Vladar's formula
  // (Modifiers)*(Gym Dots)*(Energy Per Train)*[ (a*ln(Happy+b)+c) * (S) + d*(Happy+b) + e ]
  // Where S is the current value of the stat being trained (not Total Battle Stats)
  const multiplier = perkBonus * dots * energyPerTrain;
  const innerExpression = 
    (a * Math.log(happy + b) + c) * currentStatValue + 
    d * (happy + b) + 
    e;

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
    const statDots = gym[stat as keyof Pick<Gym, 'strength' | 'speed' | 'defense' | 'dexterity'>];
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
    const aValue = a[stat as keyof Pick<Gym, 'strength' | 'speed' | 'defense' | 'dexterity'>] || 0;
    const bValue = b[stat as keyof Pick<Gym, 'strength' | 'speed' | 'defense' | 'dexterity'>] || 0;
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
  // Determine if this is manual mode (single energy amount) or future mode (days based)
  const isManualMode = inputs.manualEnergy !== undefined;
  
  const dailyEnergy: number = isManualMode 
    ? inputs.manualEnergy! 
    : calculateDailyEnergy(
        inputs.hoursPlayedPerDay,
        inputs.xanaxPerDay,
        inputs.hasPointsRefill,
        inputs.companyBenefit.bonusEnergyPerDay
      );
  
  // For manual mode, simulate 1 day. For future mode, use months
  const totalDays = isManualMode ? 1 : inputs.months * 30;
  
  // Initialize stats
  const stats = {
    strength: inputs.initialStats?.strength ?? 1000,
    speed: inputs.initialStats?.speed ?? 1000,
    defense: inputs.initialStats?.defense ?? 1000,
    dexterity: inputs.initialStats?.dexterity ?? 1000,
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
  
  // Auto-upgrade mode: currentGymIndex = -1
  // Locked gym mode: currentGymIndex >= 0
  const shouldAutoUpgrade = inputs.currentGymIndex < 0;
  
  // Track current gym based on initial gym (only if not auto-upgrading)
  if (!shouldAutoUpgrade && inputs.currentGymIndex >= 0) {
    const currentGym = gyms[inputs.currentGymIndex];
    if (currentGym) {
      totalEnergySpent = currentGym.energyToUnlock;
    }
  }
  
  const dailySnapshots: DailySnapshot[] = [];
  
  // Track next happy jump day
  let nextHappyJumpDay = inputs.happyJump?.enabled && inputs.happyJump.frequencyDays > 0 
    ? inputs.happyJump.frequencyDays 
    : -1;
  
  // Calculate which days to skip
  // Distribute skipped days evenly throughout each month
  const daysSkippedPerMonth = inputs.daysSkippedPerMonth || 0;
  const isSkippedDay = (day: number): boolean => {
    if (daysSkippedPerMonth === 0) return false;
    
    // Calculate which day in the month we're on (1-indexed)
    const dayInMonth = ((day - 1) % 30) + 1;
    
    // Distribute skipped days evenly throughout the month
    // e.g., if 2 days skipped per month, skip days 15 and 30
    // if 3 days skipped per month, skip days 10, 20, and 30
    const skipInterval = 30 / daysSkippedPerMonth;
    for (let i = 1; i <= daysSkippedPerMonth; i++) {
      const skipDay = Math.round(i * skipInterval);
      if (dayInMonth === skipDay) return true;
    }
    return false;
  };
  
  // Simulate each day
  for (let day = 1; day <= totalDays; day++) {
    const energySpentOnGymUnlock = 0;
    
    // Check if this is a skipped day (war, vacation, etc.)
    const isSkipped = isSkippedDay(day);
    
    // Check if this is a happy jump day
    const isHappyJumpDay = inputs.happyJump?.enabled && day === nextHappyJumpDay;
    
    let energyAvailableToday = isSkipped ? 0 : dailyEnergy;
    let currentHappy = inputs.happy;
    
    if (isHappyJumpDay && inputs.happyJump && !isSkipped) {
      // Happy jump calculation:
      // 1. User gets energy to 0 and starts taking xanax
      // 2. Takes 4 xanax over ~32 hours (8 hours between each, no natural regen)
      // 3. Waits 8 hours for drug cooldown
      // 4. Uses DVDs: happy becomes (baseHappy + 2500*numDVDs)
      // 5. Pops ecstasy: happy doubles to ((baseHappy + 2500*numDVDs)*2)
      // 6. Trains 1000 energy (4 xanax * 250)
      // 7. Uses points refill for 150 energy and trains that
      // 8. Must wait 6 more hours before can use xanax again
      
      // Total time for happy jump: 32 + 8 + 6 = 46 hours
      // During this time: no natural energy generation, loses 1 xanax from daily allowance
      
      // Energy available: 1000 (from 4 xanax) + 150 (points refill) = 1150
      energyAvailableToday = 1150;
      
      // Happy during jump
      currentHappy = (inputs.happy + 2500 * inputs.happyJump.dvdsUsed) * 2;
      
      // Schedule next happy jump
      nextHappyJumpDay = day + inputs.happyJump.frequencyDays;
    }
    
    // Train stats based on target ratios (weights represent desired build, not training proportion)
    // Train one energy at a time, always choosing the stat that is most out of sync with target ratio
    let remainingEnergy = energyAvailableToday;
    
    while (remainingEnergy > 0) {
      // Determine which stat to train next based on how far each is from its target ratio
      // For each stat, calculate: currentStat / targetWeight
      // The stat with the lowest ratio is the most behind and should be trained next
      
      const statOrder: Array<keyof typeof stats> = ['strength', 'speed', 'defense', 'dexterity'];
      
      // Filter to only stats with non-zero target weights
      const trainableStats = statOrder.filter(stat => inputs.statWeights[stat] > 0);
      
      if (trainableStats.length === 0) {
        // No stats to train
        break;
      }
      
      // Find the stat most out of sync (lowest currentStat / targetWeight ratio)
      let selectedStat: keyof typeof stats | null = null;
      let lowestRatio = Infinity;
      
      for (const stat of trainableStats) {
        const ratio = stats[stat] / inputs.statWeights[stat];
        if (ratio < lowestRatio) {
          lowestRatio = ratio;
          selectedStat = stat;
        }
      }
      
      // If no stat selected (shouldn't happen), break
      if (!selectedStat) break;
      
      try {
        // Determine which gym to use based on mode
        let gym: Gym;
        if (shouldAutoUpgrade) {
          // Auto-upgrade mode: find best gym based on energy spent
          gym = findBestGym(
            gyms,
            selectedStat,
            totalEnergySpent,
            inputs.companyBenefit.gymUnlockSpeedMultiplier
          );
        } else if (inputs.currentGymIndex >= 0 && inputs.currentGymIndex < gyms.length) {
          // Locked gym mode: use specified gym
          gym = gyms[inputs.currentGymIndex];
        } else {
          // Fallback to best gym
          gym = findBestGym(
            gyms,
            selectedStat,
            totalEnergySpent,
            inputs.companyBenefit.gymUnlockSpeedMultiplier
          );
        }
        
        const statDots = gym[selectedStat as keyof Pick<Gym, 'strength' | 'speed' | 'defense' | 'dexterity'>];
        if (!statDots) {
          // Can't train this stat at this gym, remove energy and continue
          break;
        }
        
        // Check if we have enough energy for one train
        if (remainingEnergy < gym.energyPerTrain) {
          // Not enough energy for another train
          break;
        }
        
        // Get the current value of the stat being trained
        const currentStatValue = stats[selectedStat];
        
        const gain = computeStatGain(
          selectedStat,
          currentStatValue,
          currentHappy,
          inputs.perkPercs[selectedStat],
          statDots,
          gym.energyPerTrain
        );
        
        // Apply gym gain multiplier from company benefit
        const actualGain = gain * inputs.companyBenefit.gymGainMultiplier;
        stats[selectedStat] += actualGain;
        totalEnergySpent += gym.energyPerTrain;
        remainingEnergy -= gym.energyPerTrain;
      } catch {
        // Gym not found for this stat, break to avoid infinite loop
        break;
      }
    }
    
    // Take snapshot every 7 days or on first day
    // For last day, only snapshot if it's been at least 7 days since last snapshot
    const shouldSnapshot = 
      day === 1 || 
      day % 7 === 0 || 
      (day === totalDays && (dailySnapshots.length === 0 || day - dailySnapshots[dailySnapshots.length - 1].day >= 7));
    
    if (shouldSnapshot) {
      // Find current gym (use the best gym for the highest weighted stat)
      let currentGym = 'Unknown';
      try {
        const primaryStat = Object.entries(inputs.statWeights)
          .filter(([, weight]) => weight > 0)
          .sort(([, a], [, b]) => b - a)[0];
        
        if (primaryStat) {
          const gym = findBestGym(
            gyms,
            primaryStat[0],
            totalEnergySpent,
            inputs.companyBenefit.gymUnlockSpeedMultiplier
          );
          currentGym = gym.displayName;
        }
      } catch {
        // Ignore
      }
      
      const snapshot = {
        day,
        strength: Math.round(stats.strength),
        speed: Math.round(stats.speed),
        defense: Math.round(stats.defense),
        dexterity: Math.round(stats.dexterity),
        currentGym,
        energySpentOnGymUnlock,
      };
      
      dailySnapshots.push(snapshot);
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
