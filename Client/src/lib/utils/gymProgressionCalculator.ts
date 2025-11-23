/**
 * Gym Progression and Comparison Calculator
 * Calculates stat gains over time accounting for gym unlocks and company benefits
 */

// Energy item mapping for energy drinks and FHC
const ENERGY_ITEM_MAP: Record<number, number> = {
  985: 5,   // Small Energy Drink
  986: 10,  // Energy Drink
  987: 15,  // Large Energy Drink
  530: 20,  // X-Large Energy Drink
  532: 25,  // XX-Large Energy Drink
  533: 30,  // XXX-Large Energy Drink
  367: 0,   // FHC - special case, refills energy bar
};

// Candy happiness mapping
const CANDY_HAPPINESS_MAP: Record<number, number> = {
  310: 25,  // Happy 25
  36: 35,   // Happy 35
  528: 75,  // Happy 75
  529: 100, // Happy 100
  151: 150, // Happy 150
};

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
  initialEnergySpent?: number; // Optional: if specified, use this as starting totalEnergySpent (for chaining sections with gym progress)
  edvdJump?: {
    enabled: boolean;
    frequencyDays: number; // e.g., 7 for weekly, 14 for every 2 weeks
    dvdsUsed: number;
    limit: 'indefinite' | 'count' | 'stat';
    count?: number; // Number of jumps to perform when limit is 'count'
    statTarget?: number; // Individual stat target when limit is 'stat'
    adultNovelties?: boolean; // If true, double happiness from DVDs (10★ Adult Novelties)
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
    frequencyDays: number; // How often candy jump is performed (every X days, default 1)
    itemId: number; // 310 (25 happy), 36 (35 happy), 528 (75 happy), 529 (100 happy), 151 (150 happy)
    quantity: number; // Number of candies used per jump (default 48)
    factionBenefitPercent?: number; // % increase in happiness from chocolate faction benefits
    drugUsed: 'none' | 'xanax' | 'ecstasy'; // Which drug is used with the candy jump
    drugAlreadyIncluded: boolean; // If xanax/ecstasy, is it already included in daily drug count?
    usePointRefill: boolean; // Does user use a point refill during the candy jump?
  };
  stackedCandyJump?: {
    enabled: boolean;
    frequencyDays: number; // e.g., 7 for weekly, 14 for every 2 weeks
    itemId: number; // 310 (25 happy), 36 (35 happy), 528 (75 happy), 529 (100 happy), 151 (150 happy)
    quantity: number; // Number of candies used per jump
    factionBenefitPercent?: number; // % increase in happiness from chocolate faction benefits
    limit: 'indefinite' | 'count' | 'stat';
    count?: number; // Number of jumps to perform when limit is 'count'
    statTarget?: number; // Individual stat target when limit is 'stat'
  };
  energyJump?: {
    enabled: boolean;
    itemId: number; // 985 (5 energy), 986 (10 energy), 987 (15 energy), 530 (20 energy), 532 (25 energy), 533 (30 energy), 367 (FHC - refills energy bar)
    quantity: number; // Number of energy items used per day (default 24)
    factionBenefitPercent: number; // % increase in energy from faction benefits
  };
  lossRevive?: {
    enabled: boolean;
    numberPerDay: number; // Number of losses/revives per day
    energyCost: number; // Energy cost per loss/revive (default 25)
    daysBetween: number; // Days between loss/revive events
    pricePerLoss: number; // Price paid per loss/revive (income, reduces total cost)
  };
  daysSkippedPerMonth?: number; // Days per month with no energy (wars, vacations)
  statDriftPercent?: number; // 0-100: How far stats can drift from target weighings. 0 = strict balance, 100 = pure best gains
  balanceAfterGymIndex?: number; // Gym index after which to revert to balanced training (-1 = never, default: 19 = Cha Cha's)
  ignorePerksForGymSelection?: boolean; // If true, ignore perks when deciding which gym/stat to train (but still use perks for actual gains)
  islandCostPerDay?: number; // Optional: daily island cost (rent + staff) to include in cost calculations
  simulatedDate?: Date | null; // Optional: simulated "today" date for Diabetes Day calculations. If not provided, uses actual current date.
  itemPrices?: {
    dvdPrice: number | null;
    xanaxPrice: number | null;
    ecstasyPrice: number | null;
    candyEcstasyPrice: number | null;
    pointsPrice?: number | null; // Price per point (itemId 0)
    candyPrices?: {
      310: number | null;
      36: number | null;
      528: number | null;
      529: number | null;
      151: number | null;
    };
    energyPrices?: {
      985: number | null;
      986: number | null;
      987: number | null;
      530: number | null;
      532: number | null;
      533: number | null;
      367: number | null;
    };
  };
}

// DailySnapshot interface - includes training session tracking for jump days
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
  // Training details for each stat
  trainingDetails?: {
    strength?: { gym: string; energy: number; };
    speed?: { gym: string; energy: number; };
    defense?: { gym: string; energy: number; };
    dexterity?: { gym: string; energy: number; };
  };
  // Support for multiple training sessions per day (e.g., candy jump + regular training)
  trainingSessions?: Array<{
    type: 'candy_jump' | 'regular' | 'edvd_jump' | 'dd_jump';
    happy?: number; // Happiness level during this session
    // Stats after this training session completes
    strength?: number;
    speed?: number;
    defense?: number;
    dexterity?: number;
    trainingDetails?: {
      strength?: { gym: string; energy: number; };
      speed?: { gym: string; energy: number; };
      defense?: { gym: string; energy: number; };
      dexterity?: { gym: string; energy: number; };
    };
    notes?: string[];
  }>;
  // General notes for the day
  notes?: string[];
}

export interface SimulationResult {
  dailySnapshots: DailySnapshot[];
  finalStats: {
    strength: number;
    speed: number;
    defense: number;
    dexterity: number;
  };
  finalEnergySpent?: number; // Total energy spent at end of simulation (for chaining sections)
  sectionBoundaries?: number[]; // Array of day numbers where sections change (e.g., [180, 360] means section 1 ends at day 180, section 2 ends at day 360)
  edvdJumpCosts?: {
    totalJumps: number;
    costPerJump: number;
    totalCost: number;
  };
  edvdJumpGains?: {
    averagePerJump: {
      strength: number;
      speed: number;
      defense: number;
      dexterity: number;
    };
    totalGains: {
      strength: number;
      speed: number;
      defense: number;
      dexterity: number;
    };
  };
  xanaxCosts?: {
    totalCost: number;
  };
  pointsRefillCosts?: {
    totalCost: number;
  };
  
  candyJumpCosts?: {
    totalDays: number;
    costPerDay: number;
    totalCost: number;
  };
  stackedCandyJumpCosts?: {
    totalJumps: number;
    costPerJump: number;
    totalCost: number;
  };
  stackedCandyJumpGains?: {
    averagePerJump: {
      strength: number;
      speed: number;
      defense: number;
      dexterity: number;
    };
    totalGains: {
      strength: number;
      speed: number;
      defense: number;
      dexterity: number;
    };
  };
  energyJumpCosts?: {
    totalDays: number;
    costPerDay: number;
    totalCost: number;
  };
  lossReviveIncome?: {
    totalDays: number;
    incomePerDay: number;
    totalIncome: number;
  };
  islandCosts?: {
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
  
  // Set initial energy spent based on initialEnergySpent parameter or starting gym
  if (inputs.initialEnergySpent !== undefined) {
    // Use provided initial energy spent (for chaining sections)
    totalEnergySpent = inputs.initialEnergySpent;
  } else if (inputs.currentGymIndex >= 0 && inputs.currentGymIndex < gyms.length) {
    // Default: assume all energy to unlock current gym has been spent
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
  const edvdJumpTotalGains = { strength: 0, speed: 0, defense: 0, dexterity: 0 };
  
  // Track next Stacked Candy jump day and jumps performed
  let nextStackedCandyJumpDay = inputs.stackedCandyJump?.enabled && inputs.stackedCandyJump.frequencyDays > 0 
    ? inputs.stackedCandyJump.frequencyDays 
    : -1;
  let stackedCandyJumpsPerformed = 0;
  const stackedCandyJumpTotalGains = { strength: 0, speed: 0, defense: 0, dexterity: 0 };
  
  // Track Diabetes Day jumps
  // DD jumps occur on November 13 and November 15 (calendar dates)
  // Calculate which simulation day corresponds to these calendar dates
  const diabetesDayJumpDays: number[] = [];
  const diabetesDayTotalGains = { strength: 0, speed: 0, defense: 0, dexterity: 0 };
  let diabetesDayJump1Gains: { strength: number; speed: number; defense: number; dexterity: number } | undefined;
  let diabetesDayJump2Gains: { strength: number; speed: number; defense: number; dexterity: number } | undefined;
  
  // Track candy jump days
  let candyJumpDaysPerformed = 0;
  
  // Track energy jump days
  let energyJumpDaysPerformed = 0;
  
  // Track loss/revive days
  let lossReviveDaysPerformed = 0;
  let nextLossReviveDay = inputs.lossRevive?.enabled && inputs.lossRevive.daysBetween > 0 
    ? inputs.lossRevive.daysBetween 
    : -1;
  
  if (inputs.diabetesDay?.enabled) {
    // Calculate which simulation days correspond to November 13 and November 15
    const today = inputs.simulatedDate ? new Date(inputs.simulatedDate) : new Date();
    // Reset time to start of day for accurate day calculations
    today.setHours(0, 0, 0, 0);
    const currentYear = today.getFullYear();
    
    // Create dates for November 13 and November 15 of the current year
    let nov13 = new Date(currentYear, 10, 13); // Month is 0-indexed, so 10 = November
    let nov15 = new Date(currentYear, 10, 15);
    nov13.setHours(0, 0, 0, 0);
    nov15.setHours(0, 0, 0, 0);
    
    // If we're past November 15 of this year, use next year's dates
    if (today > nov15) {
      nov13 = new Date(currentYear + 1, 10, 13);
      nov15 = new Date(currentYear + 1, 10, 15);
      nov13.setHours(0, 0, 0, 0);
      nov15.setHours(0, 0, 0, 0);
    }
    
    // Calculate days from today to each DD jump date (1-indexed, day 1 = tomorrow or today if it's the date)
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysToNov13 = Math.ceil((nov13.getTime() - today.getTime()) / msPerDay) + 1;
    const daysToNov15 = Math.ceil((nov15.getTime() - today.getTime()) / msPerDay) + 1;
    
    // Only add DD jumps that fall within the simulation period (day 1 to totalDays)
    if (inputs.diabetesDay.numberOfJumps === 2) {
      // Two jumps: November 13 and November 15
      if (daysToNov13 >= 1 && daysToNov13 <= totalDays) {
        diabetesDayJumpDays.push(daysToNov13);
      }
      if (daysToNov15 >= 1 && daysToNov15 <= totalDays) {
        diabetesDayJumpDays.push(daysToNov15);
      }
    } else {
      // One jump: November 15 only
      if (daysToNov15 >= 1 && daysToNov15 <= totalDays) {
        diabetesDayJumpDays.push(daysToNov15);
      }
    }
    
    // If DD is enabled but no jumps fall within the simulation period, 
    // the diabetesDayJumpDays array will remain empty and no DD jumps will occur
    
    // If both DD and eDVD jumps are enabled, adjust eDVD jump start
    // First eDVD jump must be at least 2 days after the last DD jump
    if (inputs.edvdJump?.enabled && inputs.edvdJump.frequencyDays > 0) {
      const lastDdDay = diabetesDayJumpDays[diabetesDayJumpDays.length - 1];
      const proposedEdvdDay = inputs.edvdJump.frequencyDays;
      
      // If the first eDVD jump would conflict with or be too close to DD jumps
      if (proposedEdvdDay <= lastDdDay + 2) {
        // Move it to 2 days after the last DD jump
        nextEdvdJumpDay = lastDdDay + 2;
      }
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
    
    // Track training details for each stat on this day
    const dailyTrainingDetails: {
      strength?: { gym: string; energy: number; };
      speed?: { gym: string; energy: number; };
      defense?: { gym: string; energy: number; };
      dexterity?: { gym: string; energy: number; };
    } = {};
    
    // Track training sessions separately (candy jump vs regular)
    const trainingSessions: Array<{
      type: 'candy_jump' | 'regular' | 'edvd_jump' | 'dd_jump';
      happy?: number;
      // Stats after this training session completes
      strength?: number;
      speed?: number;
      defense?: number;
      dexterity?: number;
      trainingDetails?: {
        strength?: { gym: string; energy: number; };
        speed?: { gym: string; energy: number; };
        defense?: { gym: string; energy: number; };
        dexterity?: { gym: string; energy: number; };
      };
      notes?: string[];
    }> = [];
    
    const dailyNotes: string[] = [];
    
    // Check if this is a skipped day (war, vacation, etc.)
    const isSkipped = isSkippedDay(day);
    
    if (isSkipped) {
      dailyNotes.push('Day skipped (war/vacation)');
    }
    
    // Check if EDVD jump should be performed
    // Skip if limit is reached based on configuration
    let shouldPerformEdvdJump = inputs.edvdJump?.enabled && day === nextEdvdJumpDay && !isSkipped;
    
    // Check if this is the day before an eDVD jump (for stacking)
    const isDayBeforeEdvdJump = inputs.edvdJump?.enabled && day === nextEdvdJumpDay - 1 && !isSkipped;
    
    // Track which stats should be trained during this eDVD jump (for 'stat' limit mode)
    let edvdStatsToTrain: Set<keyof typeof stats> | null = null;
    
    // Check if Stacked Candy jump should be performed
    // Priority: eDVD jumps take priority over stacked candy jumps on the same day
    let shouldPerformStackedCandyJump = inputs.stackedCandyJump?.enabled && day === nextStackedCandyJumpDay && !isSkipped && !shouldPerformEdvdJump;
    
    // Check if this is the day before a Stacked Candy jump (for stacking)
    // Don't stack if eDVD jump is happening on this day or the next day
    const isDayBeforeStackedCandyJump = inputs.stackedCandyJump?.enabled && day === nextStackedCandyJumpDay - 1 && !isSkipped && !shouldPerformEdvdJump && day !== nextEdvdJumpDay - 1;
    
    // Track which stats should be trained during this Stacked Candy jump (for 'stat' limit mode)
    let stackedCandyStatsToTrain: Set<keyof typeof stats> | null = null;
    
    if (shouldPerformEdvdJump && inputs.edvdJump) {
      // Check limit conditions
      if (inputs.edvdJump.limit === 'count' && inputs.edvdJump.count !== undefined && edvdJumpsPerformed >= inputs.edvdJump.count) {
        shouldPerformEdvdJump = false;
      } else if (inputs.edvdJump.limit === 'stat' && inputs.edvdJump.statTarget !== undefined) {
        // NEW LOGIC: Determine mode and apply appropriate jump-trigger rules
        const statOrder: Array<keyof typeof stats> = ['strength', 'speed', 'defense', 'dexterity'];
        const threshold = inputs.edvdJump.statTarget;
        
        // 1. Determine mode
        const weights = inputs.statWeights;
        const nonZeroWeights = statOrder.filter(stat => weights[stat] > 0);
        const noLimits = (inputs.statDriftPercent ?? 0) === 100;
        
        // Balanced/Weighted mode: !noLimits && nonZeroWeights.length >= 2
        // No-Limits mode: noLimits === true (any number of non-zero weights)
        // Single-stat builds (only 1 weight > 0) behave like No-Limits mode
        const isBalancedMode = !noLimits && nonZeroWeights.length >= 2;
        
        if (isBalancedMode) {
          // 2. Balanced/Weighted mode: Start jump if ANY stat with weight > 0 is below threshold
          const statsUnderLimit: Array<keyof typeof stats> = [];
          
          for (const stat of statOrder) {
            if (stats[stat] < threshold && weights[stat] > 0) {
              statsUnderLimit.push(stat);
            }
          }
          
          if (statsUnderLimit.length === 0) {
            // All weighted stats are at or above target, no more jumps
            shouldPerformEdvdJump = false;
          } else {
            // Some weighted stats are under the limit - train only those stats during this jump
            edvdStatsToTrain = new Set(statsUnderLimit);
          }
        } else {
          // 3. No-Limits mode (stat drift / train-best-stat) OR single-stat builds
          // Determine bestGymStat: stat with highest gym dots
          let bestGymStat: keyof typeof stats | null = null;
          let bestDots = -1;
          
          // Decide whether to use perks in gym selection calculation
          const perksForSelection = inputs.ignorePerksForGymSelection ? 
            { strength: 0, speed: 0, defense: 0, dexterity: 0 } : 
            inputs.perkPercs;
          
          for (const stat of nonZeroWeights) {
            try {
              const gym = findBestGym(
                gyms,
                stat,
                totalEnergySpent,
                inputs.companyBenefit.gymUnlockSpeedMultiplier,
                stats
              );
              const statDots = gym[stat as keyof Pick<Gym, 'strength' | 'speed' | 'defense' | 'dexterity'>];
              
              if (statDots !== null && statDots !== undefined) {
                // Calculate actual gain using current happy for comparison
                const gain = computeStatGain(
                  stat,
                  1000, // Use normalized value for fair comparison
                  inputs.happy,
                  perksForSelection[stat],
                  statDots,
                  gym.energyPerTrain
                ) * inputs.companyBenefit.gymGainMultiplier;
                
                // Pick stat with highest gym dots (use gain calculation to break ties)
                if (statDots > bestDots || (statDots === bestDots && gain > 0)) {
                  bestDots = statDots;
                  bestGymStat = stat;
                }
              }
            } catch {
              // Gym not available for this stat
            }
          }
          
          // Start jump ONLY if weights[bestGymStat] > 0 AND stats[bestGymStat] < threshold
          if (bestGymStat && weights[bestGymStat] > 0 && stats[bestGymStat] < threshold) {
            // Train only the best gym stat during this jump
            edvdStatsToTrain = new Set([bestGymStat]);
          } else {
            // bestGymStat is at or above target (or not found), no more jumps
            shouldPerformEdvdJump = false;
          }
        }
      }
    }
    
    // Check stacked candy jump limit conditions (similar to eDVD)
    if (shouldPerformStackedCandyJump && inputs.stackedCandyJump) {
      // Check limit conditions
      if (inputs.stackedCandyJump.limit === 'count' && inputs.stackedCandyJump.count !== undefined && stackedCandyJumpsPerformed >= inputs.stackedCandyJump.count) {
        shouldPerformStackedCandyJump = false;
      } else if (inputs.stackedCandyJump.limit === 'stat' && inputs.stackedCandyJump.statTarget !== undefined) {
        // Same logic as eDVD for stat targeting
        const statOrder: Array<keyof typeof stats> = ['strength', 'speed', 'defense', 'dexterity'];
        const threshold = inputs.stackedCandyJump.statTarget;
        
        // 1. Determine mode
        const weights = inputs.statWeights;
        const nonZeroWeights = statOrder.filter(stat => weights[stat] > 0);
        const noLimits = (inputs.statDriftPercent ?? 0) === 100;
        
        const isBalancedMode = !noLimits && nonZeroWeights.length >= 2;
        
        if (isBalancedMode) {
          // 2. Balanced/Weighted mode: Start jump if ANY stat with weight > 0 is below threshold
          const statsUnderLimit: Array<keyof typeof stats> = [];
          
          for (const stat of statOrder) {
            if (stats[stat] < threshold && weights[stat] > 0) {
              statsUnderLimit.push(stat);
            }
          }
          
          if (statsUnderLimit.length === 0) {
            // All weighted stats are at or above target, no more jumps
            shouldPerformStackedCandyJump = false;
          } else {
            // Some weighted stats are under the limit - train only those stats during this jump
            stackedCandyStatsToTrain = new Set(statsUnderLimit);
          }
        } else {
          // 3. No-Limits mode (stat drift / train-best-stat) OR single-stat builds
          let bestGymStat: keyof typeof stats | null = null;
          let bestDots = -1;
          
          const perksForSelection = inputs.ignorePerksForGymSelection ? 
            { strength: 0, speed: 0, defense: 0, dexterity: 0 } : 
            inputs.perkPercs;
          
          for (const stat of nonZeroWeights) {
            try {
              const gym = findBestGym(
                gyms,
                stat,
                totalEnergySpent,
                inputs.companyBenefit.gymUnlockSpeedMultiplier,
                stats
              );
              const statDots = gym[stat as keyof Pick<Gym, 'strength' | 'speed' | 'defense' | 'dexterity'>];
              
              if (statDots !== null && statDots !== undefined) {
                const gain = computeStatGain(
                  stat,
                  1000,
                  inputs.happy,
                  perksForSelection[stat],
                  statDots,
                  gym.energyPerTrain
                ) * inputs.companyBenefit.gymGainMultiplier;
                
                if (statDots > bestDots || (statDots === bestDots && gain > 0)) {
                  bestDots = statDots;
                  bestGymStat = stat;
                }
              }
            } catch {
              // Gym not available for this stat
            }
          }
          
          // Start jump ONLY if weights[bestGymStat] > 0 AND stats[bestGymStat] < threshold
          if (bestGymStat && weights[bestGymStat] > 0 && stats[bestGymStat] < threshold) {
            // Train only the best gym stat during this jump
            stackedCandyStatsToTrain = new Set([bestGymStat]);
          } else {
            // bestGymStat is at or above target (or not found), no more jumps
            shouldPerformStackedCandyJump = false;
          }
        }
      }
    }
    
    let energyAvailableToday = isSkipped ? 0 : dailyEnergy;
    
    let currentHappy = inputs.happy;
    
    const maxEnergyValue = inputs.maxEnergy || 150;
    
    // Check if this is a candy jump day based on frequency
    const isCandyJumpDay = inputs.candyJump?.enabled && 
      (day - 1) % inputs.candyJump.frequencyDays === 0;
    
    // Adjust energy for candy jump days if needed
    if (isCandyJumpDay && inputs.candyJump && !isSkipped) {
      // If drug is used during candy jump AND it's NOT already included in daily drug use, add extra energy
      if (inputs.candyJump.drugUsed === 'xanax' && !inputs.candyJump.drugAlreadyIncluded) {
        energyAvailableToday += 250;
      }
      if (inputs.candyJump.drugUsed === 'ecstasy' && !inputs.candyJump.drugAlreadyIncluded) {
        // Ecstasy doesn't add energy, but we need to account for it in drug limits
        // No energy adjustment needed
      }
      
      // If point refill is used during candy jump AND user doesn't normally do point refills, add extra maxEnergy
      if (inputs.candyJump.usePointRefill && !inputs.hasPointsRefill) {
        energyAvailableToday += maxEnergyValue;
      }
    }
    
    // Track if this is a jump day and the energy split between jump and post-jump training
    let jumpEnergy = 0; // Energy to train at boosted happy
    let postJumpEnergy = 0; // Energy to train at normal happy after the jump
    let isJumpDay = false;
    
    // Check if this is the day before a DD jump (for stacking)
    const isDayBeforeDdJump = diabetesDayJumpDays.some(ddDay => day === ddDay - 1) && !isSkipped;
    
    // If it's the day before an eDVD, Stacked Candy, or DD jump, adjust energy for stacking
    // Stacking logic: User stacks 3 Xanax over 16 hours (0 energy spent during stacking)
    // Outside the 16-hour window: ~8 hours of sleep = ~150 energy from natural regen (if maxEnergy=150)
    // If daily points refill is used: also spend that energy
    if (isDayBeforeEdvdJump || isDayBeforeStackedCandyJump || isDayBeforeDdJump) {
      // Calculate energy available outside stacking window
      // Natural energy regen during ~8 hours sleep (assuming user plays less during stacking day)
      const energyPerHour = maxEnergyValue === 100 ? 20 : 30;
      const sleepEnergy = Math.min(maxEnergyValue, 8 * energyPerHour); // ~150 for maxEnergy=150, ~100 for maxEnergy=100
      
      // Start with sleep energy
      energyAvailableToday = sleepEnergy;
      
      // Add points refill if enabled
      if (inputs.hasPointsRefill) {
        energyAvailableToday += maxEnergyValue;
      }
      
      const jumpType = isDayBeforeEdvdJump ? 'eDVD' : isDayBeforeStackedCandyJump ? 'Stacked Candy' : 'DD';
      dailyNotes.push(`Stacking for ${jumpType} jump (3 Xanax over 16 hours, using natural regen outside stacking window)`);
    }
    
    if (shouldPerformEdvdJump && inputs.edvdJump) {
      // EDVD jump calculation (NEW LOGIC):
      // Day before: Stack 3 Xanax over 16 hours (handled above)
      // Jump day:
      // 1. On wake-up, stack 1 more Xanax
      // 2. Wait 8 hours for cooldown
      // 3. Use 1 Ecstasy (consumes a drug slot, replaces a Xanax slot in cooldown)
      // 4. After cooldown completes → perform the jump:
      //    - Spend ALL available energy at boosted happy
      //    - eDVD jump energy spent: 1150 energy
      // 5. After the jump, continue normal training:
      //    - Natural energy regen
      //    - If user normally takes 3 Xanax/day → consume one more Xanax after the jump
      
      isJumpDay = true;
      
      // Jump energy: exactly 1150 energy
      jumpEnergy = 1150;
      
      // Happy during jump
      // DVD happiness: 2500 per DVD normally, 5000 per DVD with Adult Novelties
      const dvdHappinessPerDvd = inputs.edvdJump.adultNovelties ? 5000 : 2500;
      currentHappy = (inputs.happy + dvdHappinessPerDvd * inputs.edvdJump.dvdsUsed) * 2;
      
      // Post-jump energy (energy available after the jump for normal training)
      // This includes natural regen and potentially one more Xanax if user normally takes 3 Xanax/day
      const energyPerHour = maxEnergyValue === 100 ? 20 : 30;
      
      // Calculate remaining time in the day after the jump
      // Assume jump happens mid-day, leaving ~12 hours for natural regen and training
      const remainingHours = 12;
      postJumpEnergy = remainingHours * energyPerHour;
      
      // If user normally takes 3 Xanax/day, they can take one more after the jump
      if (inputs.xanaxPerDay >= 3) {
        postJumpEnergy += 250; // One Xanax
      }
      
      // Set total energy for today: jump energy + post-jump energy
      energyAvailableToday = jumpEnergy + postJumpEnergy;
      
      // Add note about eDVD jump
      dailyNotes.push(`eDVD jump: Used ${inputs.edvdJump.dvdsUsed} DVD${inputs.edvdJump.dvdsUsed > 1 ? 's' : ''}, 1 Ecstasy${inputs.edvdJump.adultNovelties ? ' (with 10★ Adult Novelties)' : ''}`);
      
      // Increment jump counter and schedule next jump
      edvdJumpsPerformed++;
      let proposedNextEdvdDay = day + inputs.edvdJump.frequencyDays;
      
      // Make sure next eDVD jump doesn't conflict with any DD jumps
      // Must be at least 2 days after any DD jump
      while (diabetesDayJumpDays.some(ddDay => Math.abs(proposedNextEdvdDay - ddDay) < 2)) {
        proposedNextEdvdDay++;
      }
      
      nextEdvdJumpDay = proposedNextEdvdDay;
    }
    
    if (shouldPerformStackedCandyJump && inputs.stackedCandyJump) {
      // Stacked Candy jump calculation (SIMILAR TO eDVD):
      // Day before: Stack 3 Xanax over 16 hours (handled above)
      // Jump day:
      // 1. On wake-up, stack 1 more Xanax
      // 2. Wait 8 hours for cooldown
      // 3. Use 1 Ecstasy (consumes a drug slot, replaces a Xanax slot in cooldown)
      // 4. After cooldown completes → perform the jump:
      //    - Spend ALL available energy at boosted happy
      //    - Stacked Candy jump energy spent: 1150 energy
      // 5. After the jump, continue normal training:
      //    - Natural energy regen
      //    - If user normally takes 3 Xanax/day → consume one more Xanax after the jump
      
      isJumpDay = true;
      
      // Jump energy: exactly 1150 energy
      jumpEnergy = 1150;
      
      // Get base candy happiness
      const baseCandyHappy = CANDY_HAPPINESS_MAP[inputs.stackedCandyJump.itemId];
      if (!baseCandyHappy) {
        throw new Error(`Invalid candy item ID: ${inputs.stackedCandyJump.itemId}`);
      }
      
      // Apply faction benefit to candy happiness
      let effectiveCandyHappy = baseCandyHappy;
      if (inputs.stackedCandyJump.factionBenefitPercent && inputs.stackedCandyJump.factionBenefitPercent > 0) {
        effectiveCandyHappy = baseCandyHappy * (1 + inputs.stackedCandyJump.factionBenefitPercent / 100);
      }
      
      // Happy during jump = (base happy + (candy happy * quantity)) * 2 (from Ecstasy)
      const candyQuantity = inputs.stackedCandyJump.quantity;
      currentHappy = (inputs.happy + effectiveCandyHappy * candyQuantity) * 2;
      
      // Post-jump energy (energy available after the jump for normal training)
      // This includes natural regen and potentially one more Xanax if user normally takes 3 Xanax/day
      const energyPerHour = maxEnergyValue === 100 ? 20 : 30;
      
      // Calculate remaining time in the day after the jump
      // Assume jump happens mid-day, leaving ~12 hours for natural regen and training
      const remainingHours = 12;
      postJumpEnergy = remainingHours * energyPerHour;
      
      // If user normally takes 3 Xanax/day, they can take one more after the jump
      if (inputs.xanaxPerDay >= 3) {
        postJumpEnergy += 250; // One Xanax
      }
      
      // Set total energy for today: jump energy + post-jump energy
      energyAvailableToday = jumpEnergy + postJumpEnergy;
      
      // Add note about Stacked Candy jump
      const factionBenefitNote = inputs.stackedCandyJump.factionBenefitPercent && inputs.stackedCandyJump.factionBenefitPercent > 0
        ? ` (+${inputs.stackedCandyJump.factionBenefitPercent}% faction perk)`
        : '';
      dailyNotes.push(`Stacked Candy jump: Used ${candyQuantity} candies (${baseCandyHappy} happy${factionBenefitNote}), 1 Ecstasy`);
      
      // Increment jump counter and schedule next jump
      stackedCandyJumpsPerformed++;
      let proposedNextStackedCandyDay = day + inputs.stackedCandyJump.frequencyDays;
      
      // Make sure next Stacked Candy jump doesn't conflict with any DD jumps or eDVD jumps
      // Must be at least 2 days after any DD jump or eDVD jump
      while (diabetesDayJumpDays.some(ddDay => Math.abs(proposedNextStackedCandyDay - ddDay) < 2) ||
             (inputs.edvdJump?.enabled && Math.abs(proposedNextStackedCandyDay - nextEdvdJumpDay) < 2)) {
        proposedNextStackedCandyDay++;
      }
      
      nextStackedCandyJumpDay = proposedNextStackedCandyDay;
    } else if (inputs.stackedCandyJump?.enabled && day === nextStackedCandyJumpDay && shouldPerformEdvdJump) {
      // Stacked candy jump was skipped because eDVD jump took priority on this day
      // Reschedule the stacked candy jump for the next available day
      let proposedNextStackedCandyDay = day + 1;
      
      // Make sure rescheduled jump doesn't conflict with DD or eDVD jumps
      while (diabetesDayJumpDays.some(ddDay => Math.abs(proposedNextStackedCandyDay - ddDay) < 2) ||
             (inputs.edvdJump?.enabled && Math.abs(proposedNextStackedCandyDay - nextEdvdJumpDay) < 2)) {
        proposedNextStackedCandyDay++;
      }
      
      nextStackedCandyJumpDay = proposedNextStackedCandyDay;
      dailyNotes.push(`Stacked Candy jump rescheduled due to eDVD jump priority (moved to day ${proposedNextStackedCandyDay})`);
    }
    
    // Check if this is a Diabetes Day jump
    const isDiabetesDayJump = diabetesDayJumpDays.includes(day);
    let diabetesDayJumpGains: { strength: number; speed: number; defense: number; dexterity: number } | undefined;
    
    if (isDiabetesDayJump && inputs.diabetesDay && !isSkipped) {
      // Diabetes Day jump (NEW LOGIC):
      // Day before: Stack 3 Xanax over 16 hours (handled above)
      // Jump day:
      // 1. On wake-up, stack 1 more Xanax
      // 2. Wait 8 hours for cooldown
      // 3. Use 1 Ecstasy (consumes a drug slot)
      // 4. After cooldown completes → perform the jump:
      //    - Spend ALL available energy at boosted happy (99,999)
      //    - DD jump energy spent: at least 1150 energy, possibly more depending on options
      // 5. After the jump, continue normal training:
      //    - Natural energy regen
      //    - If user normally takes 3 Xanax/day → consume one more Xanax after the jump
      
      isJumpDay = true;
      
      const isFirstJump = day === diabetesDayJumpDays[0];
      const jumpIndex = diabetesDayJumpDays.indexOf(day);
      
      // Base DD jump energy: at least 1150 energy
      jumpEnergy = 1150;
      
      // Additional energy based on options:
      // FHC (Feathery Hotel Coupon): maxEnergy each, max 1 per jump
      // Green Egg: 500 energy each, max 1 per jump
      // Only 1 FHC OR Green Egg can be used per jump
      
      if (inputs.diabetesDay.numberOfJumps === 1) {
        // Only one jump, use the better option
        if (inputs.diabetesDay.greenEgg > 0) {
          jumpEnergy += 500; // Green Egg
        } else if (inputs.diabetesDay.featheryHotelCoupon > 0) {
          jumpEnergy += maxEnergyValue; // FHC
        }
      } else {
        // Two jumps - distribute items across jumps
        // Priority: Use Green Egg first (more energy), then FHC
        if (jumpIndex === 0) {
          // First jump
          if (inputs.diabetesDay.greenEgg > 0) {
            jumpEnergy += 500; // First Green Egg
          } else if (inputs.diabetesDay.featheryHotelCoupon > 0) {
            jumpEnergy += maxEnergyValue; // First FHC
          }
        } else if (jumpIndex === 1) {
          // Second jump - use second item if available
          if (inputs.diabetesDay.greenEgg >= 2) {
            jumpEnergy += 500; // Second Green Egg
          } else if (inputs.diabetesDay.featheryHotelCoupon >= 2) {
            jumpEnergy += maxEnergyValue; // Second FHC
          } else if (inputs.diabetesDay.greenEgg === 1 && inputs.diabetesDay.featheryHotelCoupon >= 1) {
            // Used Green Egg in first jump, use FHC in second
            jumpEnergy += maxEnergyValue;
          } else if (inputs.diabetesDay.featheryHotelCoupon === 1 && inputs.diabetesDay.greenEgg >= 1) {
            // Used FHC in first jump, use Green Egg in second
            jumpEnergy += 500;
          }
        }
      }
      
      // Seasonal mail: 250 energy for first jump only
      if (isFirstJump && inputs.diabetesDay.seasonalMail) {
        jumpEnergy += 250;
      }
      
      // Logo energy click: 50 energy for second jump only
      if (!isFirstJump && inputs.diabetesDay.logoEnergyClick) {
        jumpEnergy += 50;
      }
      
      currentHappy = 99999; // DD happy is always 99999
      
      // Post-jump energy (energy available after the jump for normal training)
      // This includes natural regen and potentially one more Xanax if user normally takes 3 Xanax/day
      const energyPerHour = maxEnergyValue === 100 ? 20 : 30;
      
      // Calculate remaining time in the day after the jump
      // Assume jump happens mid-day, leaving ~12 hours for natural regen and training
      const remainingHours = 12;
      postJumpEnergy = remainingHours * energyPerHour;
      
      // If user normally takes 3 Xanax/day, they can take one more after the jump
      if (inputs.xanaxPerDay >= 3) {
        postJumpEnergy += 250; // One Xanax
      }
      
      // Set total energy for today: jump energy + post-jump energy
      energyAvailableToday = jumpEnergy + postJumpEnergy;
      
      // Build Diabetes Day note
      const ddNoteItems: string[] = ['Diabetes Day jump'];
      
      // Add items used
      if (inputs.diabetesDay.numberOfJumps === 1) {
        if (inputs.diabetesDay.greenEgg > 0) ddNoteItems.push('Green Egg');
        else if (inputs.diabetesDay.featheryHotelCoupon > 0) ddNoteItems.push('FHC');
      } else {
        if (jumpIndex === 0) {
          if (inputs.diabetesDay.greenEgg > 0) ddNoteItems.push('Green Egg');
          else if (inputs.diabetesDay.featheryHotelCoupon > 0) ddNoteItems.push('FHC');
        } else if (jumpIndex === 1) {
          if (inputs.diabetesDay.greenEgg >= 2) ddNoteItems.push('Green Egg');
          else if (inputs.diabetesDay.featheryHotelCoupon >= 2) ddNoteItems.push('FHC');
          else if (inputs.diabetesDay.greenEgg === 1 && inputs.diabetesDay.featheryHotelCoupon >= 1) ddNoteItems.push('FHC');
          else if (inputs.diabetesDay.featheryHotelCoupon === 1 && inputs.diabetesDay.greenEgg >= 1) ddNoteItems.push('Green Egg');
        }
      }
      
      if (isFirstJump && inputs.diabetesDay.seasonalMail) ddNoteItems.push('Seasonal Mail');
      if (!isFirstJump && inputs.diabetesDay.logoEnergyClick) ddNoteItems.push('Logo Energy Click');
      
      dailyNotes.push(ddNoteItems.join(', '));
    }
    
    // Check if this is a loss/revive day and reduce energy
    if (inputs.lossRevive?.enabled && day === nextLossReviveDay && !shouldPerformEdvdJump && !isDiabetesDayJump && !isSkipped) {
      const energyReduction = inputs.lossRevive.numberPerDay * inputs.lossRevive.energyCost;
      energyAvailableToday = Math.max(0, energyAvailableToday - energyReduction);
      
      dailyNotes.push(`Loss/Revive: ${inputs.lossRevive.numberPerDay} loss${inputs.lossRevive.numberPerDay > 1 ? 'es' : ''} (${inputs.lossRevive.energyCost} energy each)`);
      lossReviveDaysPerformed++;
      nextLossReviveDay = day + inputs.lossRevive.daysBetween;
    }
    
    // Train stats based on target ratios (weights represent desired build, not training proportion)
    // Train one energy at a time, always choosing the stat that is most out of sync with target ratio
    let remainingEnergy = energyAvailableToday;
    
    // For jump days, we need to track two phases:
    // Phase 1: Train jump energy at boosted happy
    // Phase 2: Train post-jump energy at normal happy
    let remainingJumpEnergy = isJumpDay ? jumpEnergy : 0;
    let remainingPostJumpEnergy = isJumpDay ? postJumpEnergy : 0;
    const statsBeforeJump = isJumpDay ? { ...stats } : undefined;
    let statsAfterJump: typeof stats | undefined;
    
    // Track training details separately for jump and post-jump phases (for eDVD/DD jumps)
    const jumpTrainingDetails: {
      strength?: { gym: string; energy: number; };
      speed?: { gym: string; energy: number; };
      defense?: { gym: string; energy: number; };
      dexterity?: { gym: string; energy: number; };
    } = {};
    
    const postJumpTrainingDetails: {
      strength?: { gym: string; energy: number; };
      speed?: { gym: string; energy: number; };
      defense?: { gym: string; energy: number; };
      dexterity?: { gym: string; energy: number; };
    } = {};
    
    // Track stats before training for DD jumps, eDVD jumps, and stacked candy jumps (for total gains calculation)
    const statsBeforeTraining = (isDiabetesDayJump || shouldPerformEdvdJump || shouldPerformStackedCandyJump) ? { ...stats } : undefined;
    
    // Track stats before and after candy jump (for split gains calculation)
    const statsBeforeCandy = isCandyJumpDay && !shouldPerformEdvdJump && !isDiabetesDayJump && !isSkipped ? { ...stats } : undefined;
    let statsAfterCandy: typeof stats | undefined;
    
    // Handle candy jump if enabled and not on an EDVD or DD jump day
    if (isCandyJumpDay && inputs.candyJump && !shouldPerformEdvdJump && !isDiabetesDayJump && !isSkipped) {
      // Get candy happiness value
      const candyHappy = CANDY_HAPPINESS_MAP[inputs.candyJump.itemId];
      
      if (!candyHappy) {
        throw new Error(`Invalid candy item ID: ${inputs.candyJump.itemId}`);
      }
      
      // Calculate energy to use for candy jump
      // Start with base energy
      let candyEnergy = maxEnergyValue; // 150 or 100 based on maxEnergy setting
      
      // Add point refill if user indicated they use it during candy jump
      if (inputs.candyJump.usePointRefill) {
        candyEnergy += maxEnergyValue; // Add another energy bar
      }
      
      // Add xanax energy if user uses xanax with candy jump
      if (inputs.candyJump.drugUsed === 'xanax') {
        candyEnergy += 250;
      }
      
      // Add energy from energy cans/FHC if enabled (they're used during the jump)
      if (inputs.energyJump?.enabled) {
        const energyPerItem = ENERGY_ITEM_MAP[inputs.energyJump.itemId];
        
        if (energyPerItem !== undefined) {
          let extraEnergy = 0;
          const energyQuantity = inputs.energyJump.quantity || 24;
          
          if (inputs.energyJump.itemId === 367) {
            // FHC refills energy bar - use maxEnergy value
            extraEnergy = maxEnergyValue * energyQuantity;
          } else {
            // Regular energy items
            extraEnergy = energyPerItem * energyQuantity;
          }
          
          // Apply faction benefit percentage increase
          if (inputs.energyJump.factionBenefitPercent > 0) {
            extraEnergy = extraEnergy * (1 + inputs.energyJump.factionBenefitPercent / 100);
          }
          
          candyEnergy += extraEnergy;
        }
      }
      
      // Make sure we don't use more energy than available
      const energyToUse = Math.min(candyEnergy, remainingEnergy);
      
      // Calculate candy happiness with faction benefit applied
      const candyQuantity = inputs.candyJump.quantity || 48;
      let effectiveCandyHappy = candyHappy;
      
      // Apply faction benefit to candy happiness (increases chocolate happiness)
      if (inputs.candyJump.factionBenefitPercent && inputs.candyJump.factionBenefitPercent > 0) {
        effectiveCandyHappy = candyHappy * (1 + inputs.candyJump.factionBenefitPercent / 100);
      }
      
      // Calculate total happiness: base happy + (effective candy happy * quantity)
      // If ecstasy is used, double the total happiness
      let candyTrainHappy = inputs.happy + (effectiveCandyHappy * candyQuantity);
      if (inputs.candyJump.drugUsed === 'ecstasy') {
        candyTrainHappy = candyTrainHappy * 2;
      }
      
      // Add candy jump note
      const drugNote = inputs.candyJump.drugUsed === 'xanax' ? ' + Xanax' : 
                       inputs.candyJump.drugUsed === 'ecstasy' ? ' + Ecstasy' : '';
      
      // Track candy jump training separately
      const candyJumpTrainingDetails: {
        strength?: { gym: string; energy: number; };
        speed?: { gym: string; energy: number; };
        defense?: { gym: string; energy: number; };
        dexterity?: { gym: string; energy: number; };
      } = {};
      
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
              
              // Track candy jump training details separately
              if (!candyJumpTrainingDetails[selectedStat]) {
                candyJumpTrainingDetails[selectedStat] = { gym: gym.displayName, energy: 0 };
              }
              if (candyJumpTrainingDetails[selectedStat]) {
                candyJumpTrainingDetails[selectedStat]!.energy += gym.energyPerTrain;
              }
              
              // Also track in daily details for backward compatibility
              if (!dailyTrainingDetails[selectedStat]) {
                dailyTrainingDetails[selectedStat] = { gym: gym.displayName, energy: 0 };
              }
              if (dailyTrainingDetails[selectedStat]) {
                dailyTrainingDetails[selectedStat]!.energy += gym.energyPerTrain;
              }
            }
          }
        } catch {
          // Gym not found for this stat
        }
        
        if (!trainSuccessful) break;
      }
      
      // Save stats after candy jump for split gains calculation
      statsAfterCandy = { ...stats };
      
      // Add candy jump session to trainingSessions
      trainingSessions.push({
        type: 'candy_jump',
        happy: Math.round(candyTrainHappy),
        strength: Math.round(statsAfterCandy.strength),
        speed: Math.round(statsAfterCandy.speed),
        defense: Math.round(statsAfterCandy.defense),
        dexterity: Math.round(statsAfterCandy.dexterity),
        trainingDetails: Object.keys(candyJumpTrainingDetails).length > 0 ? candyJumpTrainingDetails : undefined,
        notes: [`Half Candy Jump: ${candyQuantity} x ${candyHappy} happy candy${drugNote} at happy ${Math.round(candyTrainHappy).toLocaleString()}`],
      });
      
      candyJumpDaysPerformed++;
    }
    
    // Energy Jump - add extra energy per day from energy items
    // Skip on candy jump days since energy cans/FHC are already included in the candy jump
    if (inputs.energyJump?.enabled && !shouldPerformEdvdJump && !isDiabetesDayJump && !isCandyJumpDay && !isSkipped) {
      const energyPerItem = ENERGY_ITEM_MAP[inputs.energyJump.itemId];
      
      if (energyPerItem === undefined) {
        throw new Error(`Invalid energy item ID: ${inputs.energyJump.itemId}`);
      }
      
      // Calculate extra energy from items
      let extraEnergy = 0;
      const energyQuantity = inputs.energyJump.quantity || 24;
      
      if (inputs.energyJump.itemId === 367) {
        // FHC refills energy bar - use maxEnergy value
        extraEnergy = maxEnergyValue * energyQuantity;
      } else {
        // Regular energy items
        extraEnergy = energyPerItem * energyQuantity;
      }
      
      // Apply faction benefit percentage increase
      if (inputs.energyJump.factionBenefitPercent > 0) {
        extraEnergy = extraEnergy * (1 + inputs.energyJump.factionBenefitPercent / 100);
      }
      
      // Add extra energy to remaining energy pool
      remainingEnergy += extraEnergy;
      
      // Add energy jump note
      const energyItemNames: Record<number, string> = {
        985: 'Small Energy Drink',
        986: 'Energy Drink',
        987: 'Large Energy Drink',
        530: 'X-Large Energy Drink',
        532: 'XX-Large Energy Drink',
        533: 'XXX-Large Energy Drink',
        367: 'Feathery Hotel Coupon',
      };
      const itemName = energyItemNames[inputs.energyJump.itemId] || 'energy items';
      dailyNotes.push(`Used ${energyQuantity} ${itemName}`);
      
      energyJumpDaysPerformed++;
    }
    
    while (remainingEnergy > 0) {
      // For jump days, handle phase transition from jump to post-jump training
      if (isJumpDay && remainingJumpEnergy === 0 && remainingPostJumpEnergy > 0 && !statsAfterJump) {
        // We've finished the jump phase, now switch to post-jump phase
        statsAfterJump = { ...stats }; // Save stats after jump
        currentHappy = inputs.happy; // Switch back to normal happy
        dailyNotes.push(`Post-jump training: ${Math.round(postJumpEnergy)} energy at normal happy`);
      }
      
      // Determine which stat to train next based on drift tolerance and actual gains
      
      const statOrder: Array<keyof typeof stats> = ['strength', 'speed', 'defense', 'dexterity'];
      
      // Filter to only stats with non-zero target weights
      // If this is an eDVD jump with stat limit, also filter to stats that should be trained
      let trainableStats = statOrder.filter(stat => inputs.statWeights[stat] > 0);
      
      // If this is an eDVD jump with stat-based limit, only train stats in edvdStatsToTrain
      if (shouldPerformEdvdJump && edvdStatsToTrain !== null) {
        trainableStats = trainableStats.filter(stat => edvdStatsToTrain.has(stat));
      }
      
      // If this is a Stacked Candy jump with stat-based limit, only train stats in stackedCandyStatsToTrain
      if (shouldPerformStackedCandyJump && stackedCandyStatsToTrain !== null) {
        trainableStats = trainableStats.filter(stat => stackedCandyStatsToTrain.has(stat));
      }
      
      if (trainableStats.length === 0) {
        // No stats to train
        break;
      }
      
      // Determine selected stat based on drift tolerance and actual gains
      let selectedStat: keyof typeof stats | null = null;
      const statDriftPercent = inputs.statDriftPercent ?? 0;
      const balanceAfterGymIndex = inputs.balanceAfterGymIndex ?? 19; // Default to Cha Cha's (index 19)
      
      // Determine if we should allow stat drift based on the balance gym index
      let shouldAllowDrift = false;
      if (balanceAfterGymIndex === -1) {
        // Never revert to balanced - always allow drift
        shouldAllowDrift = true;
      } else if (balanceAfterGymIndex >= 0 && balanceAfterGymIndex < gyms.length) {
        // Check if we're before the specified gym
        const isBeforeBalanceGym = !shouldLockGym && totalEnergySpent < gyms[balanceAfterGymIndex].energyToUnlock;
        shouldAllowDrift = isBeforeBalanceGym;
      }
      
      if (statDriftPercent > 0 && shouldAllowDrift) {
        // Calculate actual gain for each trainable stat (considering perks, gym dots, happy, etc.)
        // Use a normalized stat value of 1000 for comparison to remove stat value bias
        const statGains: Array<{ stat: keyof typeof stats; gain: number; ratio: number }> = [];
        
        // Decide whether to use perks in gym selection calculation
        const perksForSelection = inputs.ignorePerksForGymSelection ? 
          { strength: 0, speed: 0, defense: 0, dexterity: 0 } : 
          inputs.perkPercs;
        
        for (const stat of trainableStats) {
          try {
            const gym = findBestGym(
              gyms,
              stat,
              totalEnergySpent,
              inputs.companyBenefit.gymUnlockSpeedMultiplier,
              stats
            );
            const statDots = gym[stat as keyof Pick<Gym, 'strength' | 'speed' | 'defense' | 'dexterity'>];
            
            if (statDots !== null && statDots !== undefined) {
              // Calculate actual gain using normalized stat value of 1000 for fair comparison
              // This removes the bias where higher stats would always have higher gains
              const gain = computeStatGain(
                stat,
                1000, // Use normalized value instead of stats[stat]
                currentHappy,
                perksForSelection[stat],
                statDots,
                gym.energyPerTrain
              ) * inputs.companyBenefit.gymGainMultiplier;
              
              // Calculate current ratio (how far from target)
              const ratio = stats[stat] / inputs.statWeights[stat];
              
              statGains.push({ stat, gain, ratio });
            }
          } catch {
            // Gym not available for this stat
          }
        }
        
        if (statGains.length > 0) {
          // Sort by gym dots first (descending), then by balance ratio (ascending) for tie-breaking
          // This ensures we pick the gym with the most dots, and when dots are equal, we pick the most out of balance stat
          statGains.sort((a, b) => {
            // Get gym dots for each stat
            const aGym = findBestGym(gyms, a.stat, totalEnergySpent, inputs.companyBenefit.gymUnlockSpeedMultiplier, stats);
            const bGym = findBestGym(gyms, b.stat, totalEnergySpent, inputs.companyBenefit.gymUnlockSpeedMultiplier, stats);
            const aDots = aGym[a.stat as keyof Pick<Gym, 'strength' | 'speed' | 'defense' | 'dexterity'>] || 0;
            const bDots = bGym[b.stat as keyof Pick<Gym, 'strength' | 'speed' | 'defense' | 'dexterity'>] || 0;
            
            const dotsDiff = bDots - aDots;
            if (Math.abs(dotsDiff) < 0.001) {
              // Dots are essentially equal, sort by ratio (lower ratio = more out of balance)
              return a.ratio - b.ratio;
            }
            return dotsDiff;
          });
          const bestGainStat = statGains[0];
          
          // Find the stat most out of sync (for balanced approach)
          statGains.sort((a, b) => a.ratio - b.ratio);
          const mostOutOfSyncStat = statGains[0];
          
          // Calculate how far we can drift based on drift percentage
          // 0% = always train most out of sync
          // 100% = always train best gym dots (with balance as tie-breaker)
          // Middle values = blend between the two
          
          // If best gain stat is also most out of sync, train it
          if (bestGainStat.stat === mostOutOfSyncStat.stat) {
            selectedStat = bestGainStat.stat;
          } else if (statDriftPercent === 100) {
            // At 100% drift, always train the stat with best gym dots (tie-broken by balance)
            selectedStat = bestGainStat.stat;
          } else {
            // Check if best gain stat is within allowed drift
            // Calculate how much best gain stat has drifted ahead
            const driftRatio = bestGainStat.ratio / mostOutOfSyncStat.ratio;
            
            // Allow drift based on percentage: at 0% drift, ratio must be 1.0; at 100% drift, infinite
            // Using exponential scale: maxDrift grows rapidly as percentage increases
            // At 50%, allow 3x drift; at 75%, allow 10x drift; approaching 100%, allow much more
            const maxAllowedDrift = 1.0 + Math.pow(statDriftPercent / 100.0, 2) * 20.0;
            
            if (driftRatio <= maxAllowedDrift) {
              // Best gain stat is within allowed drift, train it
              selectedStat = bestGainStat.stat;
            } else {
              // Best gain stat has drifted too far, train most out of sync
              selectedStat = mostOutOfSyncStat.stat;
            }
          }
        }
      }
      
      // If no stat selected by drift logic (or drift is 0%), use balanced approach
      if (!selectedStat) {
        // Balanced Strategy: Train the stat most out of sync with target weighings
        let lowestRatio = Infinity;
        
        for (const stat of trainableStats) {
          const ratio = stats[stat] / inputs.statWeights[stat];
          if (ratio < lowestRatio) {
            lowestRatio = ratio;
            selectedStat = stat;
          }
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
            
            // For jump days, also decrement the appropriate phase-specific energy counter
            if (isJumpDay) {
              if (remainingJumpEnergy > 0) {
                remainingJumpEnergy -= gym.energyPerTrain;
              } else if (remainingPostJumpEnergy > 0) {
                remainingPostJumpEnergy -= gym.energyPerTrain;
              }
            }
            
            trainSuccessful = true;
            
            // Track training details
            // For eDVD/DD jump days, track separately for jump and post-jump phases
            if (isJumpDay && (shouldPerformEdvdJump || isDiabetesDayJump)) {
              if (remainingJumpEnergy > 0) {
                // This training is part of the jump phase
                if (!jumpTrainingDetails[selectedStat]) {
                  jumpTrainingDetails[selectedStat] = { gym: gym.displayName, energy: 0 };
                }
                jumpTrainingDetails[selectedStat]!.energy += gym.energyPerTrain;
              } else if (remainingPostJumpEnergy > 0) {
                // This training is part of the post-jump phase
                if (!postJumpTrainingDetails[selectedStat]) {
                  postJumpTrainingDetails[selectedStat] = { gym: gym.displayName, energy: 0 };
                }
                postJumpTrainingDetails[selectedStat]!.energy += gym.energyPerTrain;
              }
            }
            
            // Always track in daily details for backward compatibility
            if (!dailyTrainingDetails[selectedStat]) {
              dailyTrainingDetails[selectedStat] = { gym: gym.displayName, energy: 0 };
            }
            if (dailyTrainingDetails[selectedStat]) {
              dailyTrainingDetails[selectedStat]!.energy += gym.energyPerTrain;
            }
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
      
      // Add detailed breakdown of jump vs post-jump gains
      if (statsBeforeJump && statsAfterJump) {
        const jumpOnlyGains = {
          strength: Math.round(statsAfterJump.strength - statsBeforeJump.strength),
          speed: Math.round(statsAfterJump.speed - statsBeforeJump.speed),
          defense: Math.round(statsAfterJump.defense - statsBeforeJump.defense),
          dexterity: Math.round(statsAfterJump.dexterity - statsBeforeJump.dexterity),
        };
        const postJumpGains = {
          strength: Math.round(stats.strength - statsAfterJump.strength),
          speed: Math.round(stats.speed - statsAfterJump.speed),
          defense: Math.round(stats.defense - statsAfterJump.defense),
          dexterity: Math.round(stats.dexterity - statsAfterJump.dexterity),
        };
        const jumpTotal = jumpOnlyGains.strength + jumpOnlyGains.speed + jumpOnlyGains.defense + jumpOnlyGains.dexterity;
        const postJumpTotal = postJumpGains.strength + postJumpGains.speed + postJumpGains.defense + postJumpGains.dexterity;
        dailyNotes.push(`DD jump gains: +${Math.round(jumpTotal).toLocaleString()} total stats at happy 99,999`);
        dailyNotes.push(`Post-DD training gains: +${Math.round(postJumpTotal).toLocaleString()} total stats at normal happy`);
        
        // Add training sessions for separate row display
        trainingSessions.push({
          type: 'dd_jump',
          happy: 99999,
          strength: Math.round(statsAfterJump.strength),
          speed: Math.round(statsAfterJump.speed),
          defense: Math.round(statsAfterJump.defense),
          dexterity: Math.round(statsAfterJump.dexterity),
          trainingDetails: Object.keys(jumpTrainingDetails).length > 0 ? jumpTrainingDetails : undefined,
          notes: [`DD jump at happy 99,999`],
        });
        
        if (postJumpTotal > 0) {
          trainingSessions.push({
            type: 'regular',
            happy: inputs.happy,
            strength: Math.round(stats.strength),
            speed: Math.round(stats.speed),
            defense: Math.round(stats.defense),
            dexterity: Math.round(stats.dexterity),
            trainingDetails: Object.keys(postJumpTrainingDetails).length > 0 ? postJumpTrainingDetails : undefined,
            notes: [`Post-DD training at normal happy (${inputs.happy.toLocaleString()})`],
          });
        }
      }
      
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
    
    // Calculate eDVD jump gains if this was an eDVD jump day
    if (shouldPerformEdvdJump && statsBeforeTraining) {
      const edvdGains = {
        strength: stats.strength - statsBeforeTraining.strength,
        speed: stats.speed - statsBeforeTraining.speed,
        defense: stats.defense - statsBeforeTraining.defense,
        dexterity: stats.dexterity - statsBeforeTraining.dexterity,
      };
      
      // Add detailed breakdown of jump vs post-jump gains
      if (statsBeforeJump && statsAfterJump) {
        const jumpOnlyGains = {
          strength: Math.round(statsAfterJump.strength - statsBeforeJump.strength),
          speed: Math.round(statsAfterJump.speed - statsBeforeJump.speed),
          defense: Math.round(statsAfterJump.defense - statsBeforeJump.defense),
          dexterity: Math.round(statsAfterJump.dexterity - statsBeforeJump.dexterity),
        };
        const postJumpGains = {
          strength: Math.round(stats.strength - statsAfterJump.strength),
          speed: Math.round(stats.speed - statsAfterJump.speed),
          defense: Math.round(stats.defense - statsAfterJump.defense),
          dexterity: Math.round(stats.dexterity - statsAfterJump.dexterity),
        };
        const jumpTotal = jumpOnlyGains.strength + jumpOnlyGains.speed + jumpOnlyGains.defense + jumpOnlyGains.dexterity;
        const postJumpTotal = postJumpGains.strength + postJumpGains.speed + postJumpGains.defense + postJumpGains.dexterity;
        const dvdHappinessPerDvd = inputs.edvdJump!.adultNovelties ? 5000 : 2500;
        const jumpHappy = (inputs.happy + dvdHappinessPerDvd * inputs.edvdJump!.dvdsUsed) * 2;
        dailyNotes.push(`eDVD jump gains: +${Math.round(jumpTotal).toLocaleString()} total stats at happy ${jumpHappy.toLocaleString()}`);
        dailyNotes.push(`Post-eDVD training gains: +${Math.round(postJumpTotal).toLocaleString()} total stats at normal happy`);
        
        // Add training sessions for separate row display
        trainingSessions.push({
          type: 'edvd_jump',
          happy: Math.round(jumpHappy),
          strength: Math.round(statsAfterJump.strength),
          speed: Math.round(statsAfterJump.speed),
          defense: Math.round(statsAfterJump.defense),
          dexterity: Math.round(statsAfterJump.dexterity),
          trainingDetails: Object.keys(jumpTrainingDetails).length > 0 ? jumpTrainingDetails : undefined,
          notes: [`eDVD jump: Used ${inputs.edvdJump!.dvdsUsed} DVD${inputs.edvdJump!.dvdsUsed > 1 ? 's' : ''}, 1 Ecstasy${inputs.edvdJump!.adultNovelties ? ' (with 10★ Adult Novelties)' : ''} at happy ${jumpHappy.toLocaleString()}`],
        });
        
        if (postJumpTotal > 0) {
          trainingSessions.push({
            type: 'regular',
            happy: inputs.happy,
            strength: Math.round(stats.strength),
            speed: Math.round(stats.speed),
            defense: Math.round(stats.defense),
            dexterity: Math.round(stats.dexterity),
            trainingDetails: Object.keys(postJumpTrainingDetails).length > 0 ? postJumpTrainingDetails : undefined,
            notes: [`Post-eDVD training at normal happy (${inputs.happy.toLocaleString()})`],
          });
        }
      }
      
      // Add to total eDVD gains
      edvdJumpTotalGains.strength += edvdGains.strength;
      edvdJumpTotalGains.speed += edvdGains.speed;
      edvdJumpTotalGains.defense += edvdGains.defense;
      edvdJumpTotalGains.dexterity += edvdGains.dexterity;
    }
    
    // Calculate Stacked Candy jump gains if this was a stacked candy jump day
    if (shouldPerformStackedCandyJump && statsBeforeTraining) {
      const stackedCandyGains = {
        strength: Math.round(stats.strength - statsBeforeTraining.strength),
        speed: Math.round(stats.speed - statsBeforeTraining.speed),
        defense: Math.round(stats.defense - statsBeforeTraining.defense),
        dexterity: Math.round(stats.dexterity - statsBeforeTraining.dexterity),
      };
      
      // Add detailed breakdown of jump vs post-jump gains
      if (statsBeforeJump && statsAfterJump) {
        const jumpOnlyGains = {
          strength: Math.round(statsAfterJump.strength - statsBeforeJump.strength),
          speed: Math.round(statsAfterJump.speed - statsBeforeJump.speed),
          defense: Math.round(statsAfterJump.defense - statsBeforeJump.defense),
          dexterity: Math.round(statsAfterJump.dexterity - statsBeforeJump.dexterity),
        };
        const postJumpGains = {
          strength: Math.round(stats.strength - statsAfterJump.strength),
          speed: Math.round(stats.speed - statsAfterJump.speed),
          defense: Math.round(stats.defense - statsAfterJump.defense),
          dexterity: Math.round(stats.dexterity - statsAfterJump.dexterity),
        };
        const jumpTotal = jumpOnlyGains.strength + jumpOnlyGains.speed + jumpOnlyGains.defense + jumpOnlyGains.dexterity;
        const postJumpTotal = postJumpGains.strength + postJumpGains.speed + postJumpGains.defense + postJumpGains.dexterity;
        
        // Calculate the happiness used during the jump
        const baseCandyHappy = CANDY_HAPPINESS_MAP[inputs.stackedCandyJump!.itemId];
        let effectiveCandyHappy = baseCandyHappy;
        if (inputs.stackedCandyJump!.factionBenefitPercent && inputs.stackedCandyJump!.factionBenefitPercent > 0) {
          effectiveCandyHappy = baseCandyHappy * (1 + inputs.stackedCandyJump!.factionBenefitPercent / 100);
        }
        const candyQuantity = inputs.stackedCandyJump!.quantity;
        const jumpHappy = (inputs.happy + effectiveCandyHappy * candyQuantity) * 2;
        
        dailyNotes.push(`Stacked Candy jump gains: +${Math.round(jumpTotal).toLocaleString()} total stats at happy ${Math.round(jumpHappy).toLocaleString()}`);
        dailyNotes.push(`Post-Stacked Candy training gains: +${Math.round(postJumpTotal).toLocaleString()} total stats at normal happy`);
        
        // Add training sessions for separate row display
        trainingSessions.push({
          type: 'edvd_jump', // Reuse edvd_jump type for consistency in display
          happy: Math.round(jumpHappy),
          strength: Math.round(statsAfterJump.strength),
          speed: Math.round(statsAfterJump.speed),
          defense: Math.round(statsAfterJump.defense),
          dexterity: Math.round(statsAfterJump.dexterity),
          trainingDetails: Object.keys(jumpTrainingDetails).length > 0 ? jumpTrainingDetails : undefined,
          notes: [`Stacked Candy jump: Used ${candyQuantity} candies at happy ${Math.round(jumpHappy).toLocaleString()}`],
        });
        
        if (postJumpTotal > 0) {
          trainingSessions.push({
            type: 'regular',
            happy: inputs.happy,
            strength: Math.round(stats.strength),
            speed: Math.round(stats.speed),
            defense: Math.round(stats.defense),
            dexterity: Math.round(stats.dexterity),
            trainingDetails: Object.keys(postJumpTrainingDetails).length > 0 ? postJumpTrainingDetails : undefined,
            notes: [`Post-Stacked Candy training at normal happy (${inputs.happy.toLocaleString()})`],
          });
        }
      }
      
      // Add to total Stacked Candy gains
      stackedCandyJumpTotalGains.strength += stackedCandyGains.strength;
      stackedCandyJumpTotalGains.speed += stackedCandyGains.speed;
      stackedCandyJumpTotalGains.defense += stackedCandyGains.defense;
      stackedCandyJumpTotalGains.dexterity += stackedCandyGains.dexterity;
    }
    
    // Calculate candy jump gains if this was a candy jump day
    if (isCandyJumpDay && statsBeforeCandy && statsAfterCandy) {
      const candyJumpGains = {
        strength: Math.round(statsAfterCandy.strength - statsBeforeCandy.strength),
        speed: Math.round(statsAfterCandy.speed - statsBeforeCandy.speed),
        defense: Math.round(statsAfterCandy.defense - statsBeforeCandy.defense),
        dexterity: Math.round(statsAfterCandy.dexterity - statsBeforeCandy.dexterity),
      };
      const postCandyGains = {
        strength: Math.round(stats.strength - statsAfterCandy.strength),
        speed: Math.round(stats.speed - statsAfterCandy.speed),
        defense: Math.round(stats.defense - statsAfterCandy.defense),
        dexterity: Math.round(stats.dexterity - statsAfterCandy.dexterity),
      };
      const candyJumpTotal = candyJumpGains.strength + candyJumpGains.speed + candyJumpGains.defense + candyJumpGains.dexterity;
      const postCandyTotal = postCandyGains.strength + postCandyGains.speed + postCandyGains.defense + postCandyGains.dexterity;
      
      // Calculate the happy used during candy jump
      const candyHappy = CANDY_HAPPINESS_MAP[inputs.candyJump!.itemId];
      const candyQuantity = inputs.candyJump!.quantity || 48;
      let effectiveCandyHappy = candyHappy;
      if (inputs.candyJump!.factionBenefitPercent && inputs.candyJump!.factionBenefitPercent > 0) {
        effectiveCandyHappy = candyHappy * (1 + inputs.candyJump!.factionBenefitPercent / 100);
      }
      let candyTrainHappy = inputs.happy + (effectiveCandyHappy * candyQuantity);
      if (inputs.candyJump!.drugUsed === 'ecstasy') {
        candyTrainHappy = candyTrainHappy * 2;
      }
      
      dailyNotes.push(`Half candy jump gains: +${Math.round(candyJumpTotal).toLocaleString()} total stats at happy ${Math.round(candyTrainHappy).toLocaleString()}`);
      if (postCandyTotal > 0) {
        dailyNotes.push(`Post-candy training gains: +${Math.round(postCandyTotal).toLocaleString()} total stats at normal happy (${inputs.happy.toLocaleString()})`);
        
        // Add post-candy training session
        // Find the candy jump session that was already added
        const candyJumpSession = trainingSessions.find(s => s.type === 'candy_jump');
        const candyJumpDetails = candyJumpSession?.trainingDetails || {};
        
        // Calculate post-candy training details by subtracting candy jump details from daily details
        const postCandyTrainingDetails: {
          strength?: { gym: string; energy: number; };
          speed?: { gym: string; energy: number; };
          defense?: { gym: string; energy: number; };
          dexterity?: { gym: string; energy: number; };
        } = {};
        
        for (const stat of ['strength', 'speed', 'defense', 'dexterity'] as const) {
          if (dailyTrainingDetails[stat] && candyJumpDetails[stat]) {
            const totalEnergy = dailyTrainingDetails[stat]!.energy;
            const candyEnergy = candyJumpDetails[stat]!.energy;
            if (totalEnergy > candyEnergy) {
              postCandyTrainingDetails[stat] = {
                gym: dailyTrainingDetails[stat]!.gym,
                energy: totalEnergy - candyEnergy,
              };
            }
          } else if (dailyTrainingDetails[stat] && !candyJumpDetails[stat]) {
            // All this stat's training was post-candy
            postCandyTrainingDetails[stat] = dailyTrainingDetails[stat];
          }
        }
        
        trainingSessions.push({
          type: 'regular',
          happy: inputs.happy,
          strength: Math.round(stats.strength),
          speed: Math.round(stats.speed),
          defense: Math.round(stats.defense),
          dexterity: Math.round(stats.dexterity),
          trainingDetails: Object.keys(postCandyTrainingDetails).length > 0 ? postCandyTrainingDetails : undefined,
          notes: [`Post-candy training at normal happy (${inputs.happy.toLocaleString()})`],
        });
      }
      
      // Note: candy jump sessions are added in the candy jump section above
    }
    
    // Take snapshot every day to show accurate daily progression
    const shouldSnapshot = true;
    
    if (shouldSnapshot) {
      // Find current gym based on where the most training energy was spent today
      let currentGym = 'Unknown';
      try {
        // Determine the gym where most energy was spent this day
        let maxEnergy = 0;
        let primaryGym = '';
        
        for (const [, details] of Object.entries(dailyTrainingDetails)) {
          if (details && details.energy > maxEnergy) {
            maxEnergy = details.energy;
            primaryGym = details.gym;
          }
        }
        
        if (primaryGym) {
          currentGym = primaryGym;
        } else {
          // Fallback: use the best gym for the highest weighted stat
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
        trainingDetails: Object.keys(dailyTrainingDetails).length > 0 ? dailyTrainingDetails : undefined,
        trainingSessions: trainingSessions.length > 0 ? trainingSessions : undefined,
        notes: dailyNotes.length > 0 ? dailyNotes : undefined,
      };
      
      dailySnapshots.push(snapshot);
    }
  }
  
  // Calculate cost information if prices are available
  let edvdJumpCosts: { totalJumps: number; costPerJump: number; totalCost: number } | undefined;
  let stackedCandyJumpCosts: { totalJumps: number; costPerJump: number; totalCost: number } | undefined;
  let xanaxCosts: { totalCost: number } | undefined;
  let pointsRefillCosts: { totalCost: number } | undefined;
  let candyJumpCosts: { totalDays: number; costPerDay: number; totalCost: number } | undefined;
  let energyJumpCosts: { totalDays: number; costPerDay: number; totalCost: number } | undefined;
  
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
    
    // Calculate Stacked Candy jump costs
    if (inputs.stackedCandyJump?.enabled && inputs.itemPrices.xanaxPrice !== null && 
        inputs.itemPrices.ecstasyPrice !== null && inputs.itemPrices.candyPrices) {
      const candyPrice = inputs.itemPrices.candyPrices[inputs.stackedCandyJump.itemId as keyof typeof inputs.itemPrices.candyPrices];
      
      if (candyPrice !== null && candyPrice !== undefined) {
        const costPerJump = (inputs.stackedCandyJump.quantity * candyPrice) + 
                            (4 * inputs.itemPrices.xanaxPrice) + 
                            inputs.itemPrices.ecstasyPrice;
        
        stackedCandyJumpCosts = {
          totalJumps: stackedCandyJumpsPerformed,
          costPerJump,
          totalCost: costPerJump * stackedCandyJumpsPerformed,
        };
      }
    }
    
    // Calculate xanax costs (daily usage, not including EDVD/Stacked Candy jumps)
    if (inputs.xanaxPerDay > 0 && inputs.itemPrices.xanaxPrice !== null) {
      xanaxCosts = {
        totalCost: inputs.itemPrices.xanaxPrice * inputs.xanaxPerDay * totalDays,
      };
    }
    
    // Calculate points refill costs if enabled and price is available
    if (inputs.hasPointsRefill && inputs.itemPrices.pointsPrice !== null && inputs.itemPrices.pointsPrice !== undefined) {
      // Points refill costs 30 points per day
      pointsRefillCosts = {
        totalCost: inputs.itemPrices.pointsPrice * 30 * totalDays,
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
        
        // Add ecstasy cost if using ecstasy and it's not already included
        if (inputs.candyJump.drugUsed === 'ecstasy' && !inputs.candyJump.drugAlreadyIncluded && inputs.itemPrices.candyEcstasyPrice !== null) {
          costPerDay += inputs.itemPrices.candyEcstasyPrice;
        }
        
        // Add xanax cost if using xanax and it's not already counted
        if (inputs.candyJump.drugUsed === 'xanax' && !inputs.candyJump.drugAlreadyIncluded && inputs.itemPrices.xanaxPrice !== null) {
          costPerDay += inputs.itemPrices.xanaxPrice;
        }
        
        candyJumpCosts = {
          totalDays: candyJumpDaysPerformed,
          costPerDay,
          totalCost: costPerDay * candyJumpDaysPerformed,
        };
      }
    }
    
    // Calculate energy jump costs
    if (inputs.energyJump?.enabled && inputs.itemPrices.energyPrices) {
      const itemId = inputs.energyJump.itemId;
      const energyPrice = inputs.itemPrices.energyPrices[itemId as keyof typeof inputs.itemPrices.energyPrices];
      
      if (energyPrice !== null && energyPrice !== undefined) {
        // Cost: quantity * energy item price per day
        const energyQuantity = inputs.energyJump.quantity || (itemId === 367 ? 6 : 24);
        const costPerDay = energyQuantity * energyPrice;
        
        energyJumpCosts = {
          totalDays: energyJumpDaysPerformed,
          costPerDay,
          totalCost: costPerDay * energyJumpDaysPerformed,
        };
      }
    }
  }
  
  // Calculate loss/revive income
  let lossReviveIncome: { totalDays: number; incomePerDay: number; totalIncome: number } | undefined;
  
  if (inputs.lossRevive?.enabled && inputs.lossRevive.pricePerLoss > 0) {
    const incomePerDay = inputs.lossRevive.numberPerDay * inputs.lossRevive.pricePerLoss;
    lossReviveIncome = {
      totalDays: lossReviveDaysPerformed,
      incomePerDay,
      totalIncome: incomePerDay * lossReviveDaysPerformed,
    };
  }
  
  // Calculate island costs
  let islandCosts: { costPerDay: number; totalCost: number } | undefined;
  
  if (inputs.islandCostPerDay && inputs.islandCostPerDay > 0) {
    islandCosts = {
      costPerDay: inputs.islandCostPerDay,
      totalCost: inputs.islandCostPerDay * totalDays,
    };
  }
  
  return {
    dailySnapshots,
    finalStats: {
      strength: Math.round(stats.strength),
      speed: Math.round(stats.speed),
      defense: Math.round(stats.defense),
      dexterity: Math.round(stats.dexterity),
    },
    finalEnergySpent: totalEnergySpent,
    edvdJumpCosts,
    edvdJumpGains: inputs.edvdJump?.enabled && edvdJumpsPerformed > 0 ? {
      averagePerJump: {
        strength: edvdJumpTotalGains.strength / edvdJumpsPerformed,
        speed: edvdJumpTotalGains.speed / edvdJumpsPerformed,
        defense: edvdJumpTotalGains.defense / edvdJumpsPerformed,
        dexterity: edvdJumpTotalGains.dexterity / edvdJumpsPerformed,
      },
      totalGains: {
        strength: edvdJumpTotalGains.strength,
        speed: edvdJumpTotalGains.speed,
        defense: edvdJumpTotalGains.defense,
        dexterity: edvdJumpTotalGains.dexterity,
      },
    } : undefined,
    stackedCandyJumpCosts,
    stackedCandyJumpGains: inputs.stackedCandyJump?.enabled && stackedCandyJumpsPerformed > 0 ? {
      averagePerJump: {
        strength: stackedCandyJumpTotalGains.strength / stackedCandyJumpsPerformed,
        speed: stackedCandyJumpTotalGains.speed / stackedCandyJumpsPerformed,
        defense: stackedCandyJumpTotalGains.defense / stackedCandyJumpsPerformed,
        dexterity: stackedCandyJumpTotalGains.dexterity / stackedCandyJumpsPerformed,
      },
      totalGains: {
        strength: stackedCandyJumpTotalGains.strength,
        speed: stackedCandyJumpTotalGains.speed,
        defense: stackedCandyJumpTotalGains.defense,
        dexterity: stackedCandyJumpTotalGains.dexterity,
      },
    } : undefined,
    xanaxCosts,
    pointsRefillCosts,
    candyJumpCosts,
    energyJumpCosts,
    lossReviveIncome,
    islandCosts,
    diabetesDayTotalGains: inputs.diabetesDay?.enabled ? diabetesDayTotalGains : undefined,
    diabetesDayJump1Gains: inputs.diabetesDay?.enabled ? diabetesDayJump1Gains : undefined,
    diabetesDayJump2Gains: inputs.diabetesDay?.enabled ? diabetesDayJump2Gains : undefined,
  };
}
