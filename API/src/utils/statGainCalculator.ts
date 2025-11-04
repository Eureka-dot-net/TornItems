/**
 * Stat Gain Calculation Utilities
 * Implements Vladar's gym formula for stat gain predictions
 */

export interface StatGainResult {
  perTrain: number;
  per150Energy: number;
}

export interface StatGainResultWithCurrentEnergy extends StatGainResult {
  perCurrentEnergy: number;
}

/**
 * Compute stat gain using Vladar's formula
 * @param stat - The stat being trained (strength, speed, defense, dexterity)
 * @param statTotal - Current total value of the stat
 * @param happy - Current happy value
 * @param perkPerc - Total perk percentage bonus (e.g., 2 for 2%)
 * @param dots - Gym dots for this stat
 * @param energyPerTrain - Energy cost per train for the gym
 * @returns Stat gain per train and per 150 energy
 */
export function computeStatGain(
  stat: string,
  statTotal: number,
  happy: number,
  perkPerc: number,
  dots: number,
  energyPerTrain: number
): StatGainResult {
  const lookupTable: Record<string, [number, number]> = {
    strength: [1600, 1700],
    speed: [1600, 2000],
    defense: [2100, -600],
    dexterity: [1800, 1500],
  };
  
  const [lookup2, lookup3] = lookupTable[stat];

  // Adjusted stat for values over 50M (cap adjustment)
  // Note: Excel's LOG() function is log base 10, not natural log
  const adjustedStat =
    statTotal < 50_000_000
      ? statTotal
      : (statTotal - 50_000_000) / (8.77635 * Math.log10(statTotal)) + 50_000_000;

  // Happy multiplier with proper rounding as in spreadsheet
  const innerRound = Math.round(Math.log(1 + happy / 250) * 10000) / 10000;
  const happyMult = Math.round((1 + 0.07 * innerRound) * 10000) / 10000;
  
  // Perk bonus multiplier
  const perkBonus = 1 + perkPerc / 100;

  // Vladar's formula
  // The entire expression (adjustedStat * happyMult + 8*happy^1.05 + lookup2*(1-(happy/99999)^2) + lookup3)
  // is multiplied by (1/200000) * dots * energyPerTrain * perkBonus
  const multiplier = (1 / 200000) * dots * energyPerTrain * perkBonus;
  const innerExpression = 
    adjustedStat * happyMult + 
    8 * Math.pow(happy, 1.05) + 
    lookup2 * (1 - Math.pow(happy / 99999, 2)) + 
    lookup3;

  const gain = multiplier * innerExpression;

  return {
    perTrain: gain,
    per150Energy: gain * (150 / energyPerTrain),
  };
}

/**
 * Compute stat gain with additional current energy calculation
 * @param stat - The stat being trained
 * @param statTotal - Current total value of the stat
 * @param happy - Current happy value
 * @param perkPerc - Total perk percentage bonus
 * @param dots - Gym dots for this stat
 * @param energyPerTrain - Energy cost per train
 * @param currentEnergy - User's current energy
 * @returns Stat gain per train, per 150 energy, and per current energy
 */
export function computeStatGainWithCurrentEnergy(
  stat: string,
  statTotal: number,
  happy: number,
  perkPerc: number,
  dots: number,
  energyPerTrain: number,
  currentEnergy: number
): StatGainResultWithCurrentEnergy {
  const baseResult = computeStatGain(stat, statTotal, happy, perkPerc, dots, energyPerTrain);
  
  return {
    ...baseResult,
    perCurrentEnergy: baseResult.perTrain * (currentEnergy / energyPerTrain),
  };
}

/**
 * Compute cumulative stat gain over multiple training sessions
 * This accounts for the stat value increasing after each train
 * @param stat - The stat being trained
 * @param initialStatTotal - Starting stat value
 * @param happy - Current happy value
 * @param perkPerc - Total perk percentage bonus
 * @param dots - Gym dots for this stat
 * @param energyPerTrain - Energy cost per train
 * @param trainsCount - Number of training sessions
 * @returns Total cumulative gain and average gain per train
 */
export function computeCumulativeStatGain(
  stat: string,
  initialStatTotal: number,
  happy: number,
  perkPerc: number,
  dots: number,
  energyPerTrain: number,
  trainsCount: number
): { totalGain: number; averagePerTrain: number } {
  let currentStatTotal = initialStatTotal;
  let totalGain = 0;
  
  for (let i = 0; i < trainsCount; i++) {
    const result = computeStatGain(stat, currentStatTotal, happy, perkPerc, dots, energyPerTrain);
    totalGain += result.perTrain;
    currentStatTotal += result.perTrain;
  }
  
  return {
    totalGain,
    averagePerTrain: trainsCount > 0 ? totalGain / trainsCount : 0
  };
}
