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
  specialtyRequirement?: (stats: { strength: number; speed: number; defense: number; dexterity: number }) => boolean;
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
  currentGymIndex: number; // Starting gym index (0-based), or gym to stay locked to if lockGym is true
  lockGym?: boolean; // Optional: if true, stay locked to currentGymIndex. If false/undefined, auto-upgrade from currentGymIndex
  manualEnergy?: number; // Optional: if specified, use this instead of calculating daily energy
  maxEnergy?: number; // Optional: 150 (default) or 100. Affects energy regeneration rate and max capacity
  edvdJump?: {
    enabled: boolean;
    frequencyDays: number; // e.g., 7 for weekly, 14 for every 2 weeks
    dvdsUsed: number;
    limit: 'indefinite' | 'count' | 'stat';
    count?: number; // Number of jumps to perform when limit is 'count'
    statTarget?: number; // Total stat target when limit is 'stat'
  };
  diabetesDay?: {
    enabled: boolean;
    numberOfJumps: 1 | 2; // 1 or 2 jumps
    featheryHotelCoupon: 0 | 1 | 2; // 0, 1, or 2 FHC (maxEnergy each)
    greenEgg: 0 | 1 | 2; // 0, 1, or 2 Green Eggs (500 energy each)
    seasonalMail: boolean; // 250 energy for first jump only
    logoEnergyClick: boolean; // 50 energy for first jump only
  };
  candyJump?: {
    enabled: boolean;
    itemId: number; // 310 (25 happy), 36 (35 happy), 528 (75 happy), 529 (100 happy), 151 (150 happy)
    useEcstasy: boolean; // If true, double happiness after candy
    quantity: number; // Number of candies used per day (default 48)
  };
  daysSkippedPerMonth?: number; // Days per month with no energy (wars, vacations)
  itemPrices?: {
    dvdPrice: number | null;
    xanaxPrice: number | null;
    ecstasyPrice: number | null;
    candyEcstasyPrice: number | null;
    candyPrices?: {
      310: number | null;
      36: number | null;
      528: number | null;
      529: number | null;
      151: number | null;
    };
  };
}

export interface DailySnapshot {
  day: number;
  strength: number;
  speed: number;
  defense: number;
  dexterity: number;
  currentGym: string;
  energySpentOnGymUnlock: number;
  isDiabetesDayJump?: boolean; // Marks if this day had a DD jump
  diabetesDayJumpGains?: {
    strength: number;
    speed: number;
    defense: number;
    dexterity: number;
  };
  isEdvdJump?: boolean; // Marks if this day had an EDVD jump
  edvdJumpGains?: {
    strength: number;
    speed: number;
    defense: number;
    dexterity: number;
  };
}

export interface SimulationResult {
  dailySnapshots: DailySnapshot[];
  finalStats: {
    strength: number;
    speed: number;
    defense: number;
    dexterity: number;
  };
  edvdJumpCosts?: {
    totalJumps: number;
    costPerJump: number;
    totalCost: number;
  };
  xanaxCosts?: {
    totalCost: number;
  };
  
  candyJumpCosts?: {
    totalDays: number;
    costPerDay: number;
    totalCost: number;
  };
  diabetesDayTotalGains?: {
    strength: number;
    speed: number;
    defense: number;
    dexterity: number;
  };
  diabetesDayJump1Gains?: {
    strength: number;
    speed: number;
    defense: number;
    dexterity: number;
  };
  diabetesDayJump2Gains?: {
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
  bonusEnergyPerDay: number = 0,
  maxEnergy: number = 150 // 150 or 100
): number {
  // Energy regeneration rate depends on max energy
  // 150 max: 5 energy every 10 minutes = 30 per hour, fills in 5 hours
  // 100 max: 5 energy every 15 minutes = 20 per hour, fills in 5 hours
  const energyPerHour = maxEnergy === 100 ? 20 : 30;
  
  // Clamp hours to 0-24
  const hours = Math.max(0, Math.min(24, hoursPlayedPerDay));
  
  let energy = 0;
  
  if (hours >= 24) {
    // Playing 24 hours straight - no sleep, no natural refill, just regeneration
    energy = 24 * energyPerHour;
  } else {
    // Sleep time = 24 - hours played
    const sleepHours = 24 - hours;
    // Natural refill during sleep (max energy bar, takes 5 hours to fill)
    const naturalRefill = Math.min(maxEnergy, sleepHours * energyPerHour);
    // Energy regeneration during play
    const playRegen = hours * energyPerHour;
    energy = naturalRefill + playRegen;
  }
  
  // Add xanax energy (250 per xanax)
  energy += xanaxPerDay * 250;
  
  // Add points refill energy (uses maxEnergy value)
  if (hasPointsRefill) {
    energy += maxEnergy;
  }
  
  // Add company benefit bonus energy
  energy += bonusEnergyPerDay;
  
  return energy;
}

/**
 * Compute stat gain using the spreadsheet formula
 * Formula: (1/200000) * dots * energyPerTrain * perkBonus * 
 *          (adjustedStat * happyMult + 8*happy^1.05 + lookup2*(1-(happy/99999)^2) + lookup3)
 * 
 * This formula uses stat-specific lookup values and accounts for diminishing returns above 50M
 */
function computeStatGain(
  stat: 'strength' | 'speed' | 'defense' | 'dexterity',
  currentStatValue: number,
  happy: number,
  perkPercForStat: number,
  dots: number,
  energyPerTrain: number
): number {
  // Constants from the spreadsheet formula
  const BASE_DIVISOR = 200000;  // Base divisor in the formula
  const HIGH_STAT_THRESHOLD = 50_000_000;  // Threshold for diminishing returns
  const DIMINISHING_RETURNS_FACTOR = 8.77635;  // Factor for high stat adjustment
  const HAPPY_MULTIPLIER_BASE = 0.07;  // Base multiplier for happy bonus
  const HAPPY_OFFSET = 250;  // Offset for happy calculations
  const HAPPY_EXPONENT = 1.05;  // Exponent for happy power calculation
  const HAPPY_POWER_MULTIPLIER = 8;  // Multiplier for happy^1.05 term
  const HAPPY_MAX_FOR_LOOKUP = 99999;  // Maximum happy value for lookup calculation
  
  // Lookup table values for each stat (columns 2 and 3 from VLOOKUP table)
  const lookupTable: Record<string, [number, number]> = {
    strength: [1600, 1700],
    speed: [1600, 2000],
    defense: [2100, -600],
    dexterity: [1800, 1500],
  };
  
  const [lookup2, lookup3] = lookupTable[stat];
  
  // Perk bonus multiplier
  const perkBonus = 1 + perkPercForStat / 100;
  
  // Adjusted stat for values over 50M (diminishing returns)
  // Note: Excel's LOG() function is log base 10, not natural log
  const adjustedStat = currentStatValue < HIGH_STAT_THRESHOLD
    ? currentStatValue
    : (currentStatValue - HIGH_STAT_THRESHOLD) / (DIMINISHING_RETURNS_FACTOR * Math.log10(currentStatValue)) + HIGH_STAT_THRESHOLD;
  
  // Happy multiplier with proper rounding as in spreadsheet
  const innerRound = Math.round(Math.log(1 + happy / HAPPY_OFFSET) * 10000) / 10000;
  const happyMult = Math.round((1 + HAPPY_MULTIPLIER_BASE * innerRound) * 10000) / 10000;
  
  // Calculate gain using the spreadsheet formula
  const multiplier = (1 / BASE_DIVISOR) * dots * energyPerTrain * perkBonus;
  const innerExpression = 
    adjustedStat * happyMult + 
    HAPPY_POWER_MULTIPLIER * Math.pow(happy, HAPPY_EXPONENT) + 
    lookup2 * (1 - Math.pow(happy / HAPPY_MAX_FOR_LOOKUP, 2)) + 
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
  gymUnlockSpeedMultiplier: number,
  currentStats: { strength: number; speed: number; defense: number; dexterity: number }
): Gym {
  // Filter gyms that support this stat and are unlocked
  const availableGyms = gyms.filter(gym => {
    const statDots = gym[stat as keyof Pick<Gym, 'strength' | 'speed' | 'defense' | 'dexterity'>];
    if (statDots === null || statDots === undefined) return false;
    
    // Apply company benefit to unlock requirement
    const adjustedEnergyToUnlock = gym.energyToUnlock / gymUnlockSpeedMultiplier;
    
    // Check energy requirement
    if (totalEnergySpent < adjustedEnergyToUnlock) return false;
    
    // Check specialty requirement if exists
    if (gym.specialtyRequirement && !gym.specialtyRequirement(currentStats)) {
      return false;
    }
    
    return true;
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
        inputs.companyBenefit.bonusEnergyPerDay,
        inputs.maxEnergy || 150
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
  
  if (totalWeight <= 0) {
    throw new Error('At least one stat weight must be greater than zero');
  }
  
  // Track total energy spent (for gym unlocks)
  let totalEnergySpent = 0;
  
  // Determine if we should lock to a specific gym or auto-upgrade
  const shouldLockGym = inputs.lockGym === true;
  
  // Set initial energy spent based on starting gym
  if (inputs.currentGymIndex >= 0 && inputs.currentGymIndex < gyms.length) {
    const startingGym = gyms[inputs.currentGymIndex];
    if (startingGym) {
      totalEnergySpent = startingGym.energyToUnlock;
    }
  }
  
  const dailySnapshots: DailySnapshot[] = [];
  
  // Track next EDVD jump day and jumps performed
  let nextEdvdJumpDay = inputs.edvdJump?.enabled && inputs.edvdJump.frequencyDays > 0 
    ? inputs.edvdJump.frequencyDays 
    : -1;
  let edvdJumpsPerformed = 0;
  
  // Track Diabetes Day jumps
  // DD jumps occur on day 7 for 1 jump, or days 5 and 7 for 2 jumps
  // This aligns with the natural 7-day snapshot interval to avoid visual confusion
  const diabetesDayJumpDays: number[] = [];
  const diabetesDayTotalGains = { strength: 0, speed: 0, defense: 0, dexterity: 0 };
  let diabetesDayJump1Gains: { strength: number; speed: number; defense: number; dexterity: number } | undefined;
  let diabetesDayJump2Gains: { strength: number; speed: number; defense: number; dexterity: number } | undefined;
  
  // Track candy jump days
  let candyJumpDaysPerformed = 0;
  
  if (inputs.diabetesDay?.enabled) {
    if (inputs.diabetesDay.numberOfJumps === 1) {
      diabetesDayJumpDays.push(7); // Single jump on day 7
    } else if (inputs.diabetesDay.numberOfJumps === 2) {
      diabetesDayJumpDays.push(5); // First jump on day 5
      diabetesDayJumpDays.push(7); // Second jump on day 7
    }
  }
  
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
    
    // Check if EDVD jump should be performed
    // Skip if limit is reached based on configuration
    let shouldPerformEdvdJump = inputs.edvdJump?.enabled && day === nextEdvdJumpDay && !isSkipped;
    
    if (shouldPerformEdvdJump && inputs.edvdJump) {
      // Check limit conditions
      if (inputs.edvdJump.limit === 'count' && inputs.edvdJump.count !== undefined && edvdJumpsPerformed >= inputs.edvdJump.count) {
        shouldPerformEdvdJump = false;
      } else if (inputs.edvdJump.limit === 'stat' && inputs.edvdJump.statTarget !== undefined) {
        const currentTotal = stats.strength + stats.speed + stats.defense + stats.dexterity;
        if (currentTotal >= inputs.edvdJump.statTarget) {
          shouldPerformEdvdJump = false;
        }
      }
    }
    
    let energyAvailableToday = isSkipped ? 0 : dailyEnergy;
    let currentHappy = inputs.happy;
    
    const maxEnergyValue = inputs.maxEnergy || 150;
    
    if (shouldPerformEdvdJump && inputs.edvdJump) {
      // EDVD jump calculation:
      // 1. User gets energy to 0 and starts taking xanax
      // 2. Takes 4 xanax over ~32 hours (8 hours between each, no natural regen)
      // 3. Waits 8 hours for drug cooldown
      // 4. Uses DVDs: happy becomes (baseHappy + 2500*numDVDs)
      // 5. Pops ecstasy: happy doubles to ((baseHappy + 2500*numDVDs)*2)
      // 6. Trains 1000 energy (4 xanax * 250)
      // 7. Uses points refill for maxEnergy and trains that
      // 8. Must wait 6 more hours before can use xanax again
      
      // Total time for EDVD jump: 32 + 8 + 6 = 46 hours
      // During this time: no natural energy generation, loses 1 xanax from daily allowance
      
      // Energy available: 1000 (from 4 xanax) + maxEnergy (points refill)
      energyAvailableToday = 1000 + maxEnergyValue;
      
      // Happy during jump
      currentHappy = (inputs.happy + 2500 * inputs.edvdJump.dvdsUsed) * 2;
      
      // Increment jump counter and schedule next jump
      edvdJumpsPerformed++;
      nextEdvdJumpDay = day + inputs.edvdJump.frequencyDays;
    }
    
    // Check if this is a Diabetes Day jump
    const isDiabetesDayJump = diabetesDayJumpDays.includes(day);
    let diabetesDayJumpGains: { strength: number; speed: number; defense: number; dexterity: number } | undefined;
    
    if (isDiabetesDayJump && inputs.diabetesDay && !isSkipped) {
      // Diabetes Day jump:
      // Base energy: 1000 (xanax) + maxEnergy (points refill)
      // Happy: 99999
      // Additional energy based on options:
      const isFirstJump = day === diabetesDayJumpDays[0];
      const jumpIndex = diabetesDayJumpDays.indexOf(day);
      
      let ddEnergy = 1000 + maxEnergyValue; // Base energy from 4 xanax (1000) + points refill (maxEnergy)
      
      // FHC (Feathery Hotel Coupon): maxEnergy each, max 1 per jump
      // Green Egg: 500 energy each, max 1 per jump
      // Only 1 FHC OR Green Egg can be used per jump
      
      if (inputs.diabetesDay.numberOfJumps === 1) {
        // Only one jump, use the better option
        if (inputs.diabetesDay.greenEgg > 0) {
          ddEnergy += 500; // Green Egg
        } else if (inputs.diabetesDay.featheryHotelCoupon > 0) {
          ddEnergy += maxEnergyValue; // FHC
        }
      } else {
        // Two jumps - distribute items across jumps
        // Priority: Use Green Egg first (more energy), then FHC
        if (jumpIndex === 0) {
          // First jump
          if (inputs.diabetesDay.greenEgg > 0) {
            ddEnergy += 500; // First Green Egg
          } else if (inputs.diabetesDay.featheryHotelCoupon > 0) {
            ddEnergy += maxEnergyValue; // First FHC
          }
        } else if (jumpIndex === 1) {
          // Second jump - use second item if available
          if (inputs.diabetesDay.greenEgg >= 2) {
            ddEnergy += 500; // Second Green Egg
          } else if (inputs.diabetesDay.featheryHotelCoupon >= 2) {
            ddEnergy += maxEnergyValue; // Second FHC
          } else if (inputs.diabetesDay.greenEgg === 1 && inputs.diabetesDay.featheryHotelCoupon >= 1) {
            // Used Green Egg in first jump, use FHC in second
            ddEnergy += maxEnergyValue;
          } else if (inputs.diabetesDay.featheryHotelCoupon === 1 && inputs.diabetesDay.greenEgg >= 1) {
            // Used FHC in first jump, use Green Egg in second
            ddEnergy += 500;
          }
        }
      }
      
      // Seasonal mail: 250 energy for first jump only
      if (isFirstJump && inputs.diabetesDay.seasonalMail) {
        ddEnergy += 250;
      }
      
      // Logo energy click: 50 energy for second jump only
      if (!isFirstJump && inputs.diabetesDay.logoEnergyClick) {
        ddEnergy += 50;
      }
      
      energyAvailableToday = ddEnergy;
      currentHappy = 99999; // DD happy is always 99999
    }
    
    // Train stats based on target ratios (weights represent desired build, not training proportion)
    // Train one energy at a time, always choosing the stat that is most out of sync with target ratio
    let remainingEnergy = energyAvailableToday;
    
    // Track stats before training for DD jumps and EDVD jumps
    const statsBeforeTraining = isDiabetesDayJump ? { ...stats } : undefined;
    const statsBeforeEdvdJump = shouldPerformEdvdJump ? { ...stats } : undefined;
    const isCandyJump = inputs.candyJump?.enabled && !shouldPerformEdvdJump && !isDiabetesDayJump && !isSkipped;
    
    // Handle candy jump if enabled and not on an EDVD or DD jump day
    if (isCandyJump && inputs.candyJump) {
      // Map item IDs to happiness values
      const candyHappinessMap: Record<number, number> = {
        310: 25,
        36: 35,
        528: 75,
        529: 100,
        151: 150,
      };
      
      const candyHappy = candyHappinessMap[inputs.candyJump.itemId];
      
      if (!candyHappy) {
        throw new Error(`Invalid candy item ID: ${inputs.candyJump.itemId}`);
      }
      
      // Calculate energy to use for candy jump
      // Base: maxEnergy (150 or 100), +maxEnergy if points refill, +250 if at least one xanax, +150 more if both points and xanax
      let candyEnergy = maxEnergyValue; // 150 or 100 based on maxEnergy setting
      
      if (inputs.hasPointsRefill && inputs.xanaxPerDay >= 1) {
        // Both points and xanax: 550 total (150 base + 150 points + 250 xanax)
        candyEnergy = maxEnergyValue + maxEnergyValue + 250;
      } else if (inputs.xanaxPerDay >= 1) {
        // Xanax but no points: 400 total (150 base + 250 xanax)
        candyEnergy = maxEnergyValue + 250;
      } else if (inputs.hasPointsRefill) {
        // Points but no xanax: 300 total (150 base + 150 points)
        candyEnergy = maxEnergyValue + maxEnergyValue;
      }
      // else: just base 150
      
      // Make sure we don't use more energy than available
      const energyToUse = Math.min(candyEnergy, remainingEnergy);
      
      // Calculate candy happiness: base happy + (candyHappy * quantity)
      // If ecstasy is enabled, double the happiness: ((base happy) + (candyHappy * quantity)) * 2
      const candyQuantity = inputs.candyJump.quantity || 48;
      let candyTrainHappy = inputs.happy + (candyHappy * candyQuantity);
      if (inputs.candyJump.useEcstasy) {
        candyTrainHappy = candyTrainHappy * 2;
      }
      
      // Train with candy happiness for the allocated energy
      let candyRemainingEnergy = energyToUse;
      
      while (candyRemainingEnergy > 0) {
        const statOrder: Array<keyof typeof stats> = ['strength', 'speed', 'defense', 'dexterity'];
        const trainableStats = statOrder.filter(stat => inputs.statWeights[stat] > 0);
        
        if (trainableStats.length === 0) break;
        
        let selectedStat: keyof typeof stats | null = null;
        let lowestRatio = Infinity;
        
        for (const stat of trainableStats) {
          const ratio = stats[stat] / inputs.statWeights[stat];
          if (ratio < lowestRatio) {
            lowestRatio = ratio;
            selectedStat = stat;
          }
        }
        
        if (!selectedStat) break;
        
        let trainSuccessful = false;
        
        try {
          let gym: Gym;
          if (shouldLockGym && inputs.currentGymIndex >= 0 && inputs.currentGymIndex < gyms.length) {
            gym = gyms[inputs.currentGymIndex];
          } else {
            gym = findBestGym(gyms, selectedStat, totalEnergySpent, inputs.companyBenefit.gymUnlockSpeedMultiplier, stats);
          }
          
          const statDots = gym[selectedStat as keyof Pick<Gym, 'strength' | 'speed' | 'defense' | 'dexterity'>];
          if (statDots) {
            if (candyRemainingEnergy >= gym.energyPerTrain) {
              const currentStatValue = stats[selectedStat];
              
              const gain = computeStatGain(
                selectedStat,
                currentStatValue,
                candyTrainHappy,
                inputs.perkPercs[selectedStat],
                statDots,
                gym.energyPerTrain
              );
              
              const actualGain = gain * inputs.companyBenefit.gymGainMultiplier;
              stats[selectedStat] += actualGain;
              totalEnergySpent += gym.energyPerTrain;
              candyRemainingEnergy -= gym.energyPerTrain;
              remainingEnergy -= gym.energyPerTrain;
              trainSuccessful = true;
            }
          }
        } catch {
          // Gym not found for this stat
        }
        
        if (!trainSuccessful) break;
      }
      
      candyJumpDaysPerformed++;
    }
    
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
      
      let trainSuccessful = false;
      
      try {
        // Determine which gym to use based on mode
        let gym: Gym;
        if (shouldLockGym && inputs.currentGymIndex >= 0 && inputs.currentGymIndex < gyms.length) {
          // Locked gym mode: use specified gym
          gym = gyms[inputs.currentGymIndex];
        } else {
          // Auto-upgrade mode: find best gym based on energy spent
          gym = findBestGym(
            gyms,
            selectedStat,
            totalEnergySpent,
            inputs.companyBenefit.gymUnlockSpeedMultiplier,
            stats
          );
        }
        
        const statDots = gym[selectedStat as keyof Pick<Gym, 'strength' | 'speed' | 'defense' | 'dexterity'>];
        if (statDots) {
          // Check if we have enough energy for one train
          if (remainingEnergy >= gym.energyPerTrain) {
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
            trainSuccessful = true;
          }
        }
      } catch {
        // Gym not found for this stat, will not train it this iteration
      }
      
      // If we couldn't train the selected stat, break to avoid infinite loop
      // This can happen when:
      // - Not enough energy for one train
      // - Locked gym doesn't support the selected stat
      // - No gym available for the stat
      if (!trainSuccessful) {
        break;
      }
    }
    
    // Calculate DD jump gains if this was a DD jump day
    if (isDiabetesDayJump && statsBeforeTraining) {
      diabetesDayJumpGains = {
        strength: Math.round(stats.strength - statsBeforeTraining.strength),
        speed: Math.round(stats.speed - statsBeforeTraining.speed),
        defense: Math.round(stats.defense - statsBeforeTraining.defense),
        dexterity: Math.round(stats.dexterity - statsBeforeTraining.dexterity),
      };
      
      // Store individual jump gains
      const jumpIndex = diabetesDayJumpDays.indexOf(day);
      if (jumpIndex === 0) {
        diabetesDayJump1Gains = { ...diabetesDayJumpGains };
      } else if (jumpIndex === 1) {
        diabetesDayJump2Gains = { ...diabetesDayJumpGains };
      }
      
      // Add to total DD gains
      diabetesDayTotalGains.strength += diabetesDayJumpGains.strength;
      diabetesDayTotalGains.speed += diabetesDayJumpGains.speed;
      diabetesDayTotalGains.defense += diabetesDayJumpGains.defense;
      diabetesDayTotalGains.dexterity += diabetesDayJumpGains.dexterity;
    }
    
    // Calculate EDVD jump gains if this was an EDVD jump day
    let edvdJumpGains: { strength: number; speed: number; defense: number; dexterity: number } | undefined;
    if (shouldPerformEdvdJump && statsBeforeEdvdJump) {
      edvdJumpGains = {
        strength: Math.round(stats.strength - statsBeforeEdvdJump.strength),
        speed: Math.round(stats.speed - statsBeforeEdvdJump.speed),
        defense: Math.round(stats.defense - statsBeforeEdvdJump.defense),
        dexterity: Math.round(stats.dexterity - statsBeforeEdvdJump.dexterity),
      };
    }
    
    // Take snapshot every 7 days or on first day
    // For DD mode with 2 jumps, also snapshot on day 5 to show the first jump clearly
    // (Day 7 is already captured by the day % 7 === 0 condition)
    // For last day, only snapshot if it's been at least 7 days since last snapshot
    const isDDSnapshotDay = inputs.diabetesDay?.enabled && inputs.diabetesDay.numberOfJumps === 2 && day === 5;
    const shouldSnapshot = 
      day === 1 || 
      day % 7 === 0 || 
      isDDSnapshotDay ||
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
            inputs.companyBenefit.gymUnlockSpeedMultiplier,
            stats
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
        isDiabetesDayJump,
        diabetesDayJumpGains,
        isEdvdJump: shouldPerformEdvdJump,
        edvdJumpGains,
      };
      
      dailySnapshots.push(snapshot);
    }
  }
  
  // Calculate cost information if prices are available
  let edvdJumpCosts: { totalJumps: number; costPerJump: number; totalCost: number } | undefined;
  let xanaxCosts: { totalCost: number } | undefined;
  let candyJumpCosts: { totalDays: number; costPerDay: number; totalCost: number } | undefined;
  
  if (inputs.itemPrices) {
    // Calculate EDVD jump costs
    if (inputs.edvdJump?.enabled && inputs.itemPrices.dvdPrice !== null && 
        inputs.itemPrices.xanaxPrice !== null && inputs.itemPrices.ecstasyPrice !== null) {
      const costPerJump = (inputs.edvdJump.dvdsUsed * inputs.itemPrices.dvdPrice) + 
                          (4 * inputs.itemPrices.xanaxPrice) + 
                          inputs.itemPrices.ecstasyPrice;
      
      edvdJumpCosts = {
        totalJumps: edvdJumpsPerformed,
        costPerJump,
        totalCost: costPerJump * edvdJumpsPerformed,
      };
    }
    
    // Calculate xanax costs (daily usage, not including EDVD jumps)
    if (inputs.xanaxPerDay > 0 && inputs.itemPrices.xanaxPrice !== null) {
      xanaxCosts = {
        totalCost: inputs.itemPrices.xanaxPrice * inputs.xanaxPerDay * totalDays,
      };
    }
    
    // Calculate candy jump costs
    if (inputs.candyJump?.enabled && inputs.itemPrices.candyPrices) {
      const itemId = inputs.candyJump.itemId;
      const candyPrice = inputs.itemPrices.candyPrices[itemId as keyof typeof inputs.itemPrices.candyPrices];
      
      if (candyPrice !== null && candyPrice !== undefined) {
        // Cost: quantity * candy price per day
        const candyQuantity = inputs.candyJump.quantity || 48;
        let costPerDay = candyQuantity * candyPrice;
        
        // Add ecstasy cost if enabled
        if (inputs.candyJump.useEcstasy && inputs.itemPrices.candyEcstasyPrice !== null) {
          costPerDay += inputs.itemPrices.candyEcstasyPrice;
        }
        
        candyJumpCosts = {
          totalDays: candyJumpDaysPerformed,
          costPerDay,
          totalCost: costPerDay * candyJumpDaysPerformed,
        };
      }
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
    edvdJumpCosts,
    xanaxCosts,
    candyJumpCosts,
    diabetesDayTotalGains: inputs.diabetesDay?.enabled ? diabetesDayTotalGains : undefined,
    diabetesDayJump1Gains: inputs.diabetesDay?.enabled ? diabetesDayJump1Gains : undefined,
    diabetesDayJump2Gains: inputs.diabetesDay?.enabled ? diabetesDayJump2Gains : undefined,
  };
}
