/**
 * Helper functions for training jump configurations
 * These helpers extract common logic used across different jump config components
 */

/**
 * Calculate total energy available for a training session
 * based on various energy sources
 */
export function calculateTotalEnergy(
  maxEnergy: number,
  hasPointsRefill: boolean,
  xanaxPerDay: number
): number {
  let energyUsed = maxEnergy;
  
  if (hasPointsRefill && xanaxPerDay >= 1) {
    energyUsed = maxEnergy + maxEnergy + 250;
  } else if (xanaxPerDay >= 1) {
    energyUsed = maxEnergy + 250;
  } else if (hasPointsRefill) {
    energyUsed = maxEnergy + maxEnergy;
  }
  
  return energyUsed;
}

/**
 * Calculate energy from energy items (not FHC)
 * with optional faction benefit
 */
export function calculateEnergyFromItems(
  baseEnergy: number,
  quantity: number,
  factionBenefit: number
): number {
  const totalEnergy = baseEnergy * quantity;
  const withBenefit = factionBenefit > 0 
    ? totalEnergy * (1 + factionBenefit / 100) 
    : totalEnergy;
  return Math.round(withBenefit);
}

/**
 * Calculate happiness for candy jumps
 */
export function calculateCandyHappiness(
  baseHappy: number,
  candyHappy: number,
  quantity: number,
  useEcstasy: boolean
): number {
  if (useEcstasy) {
    return (baseHappy + candyHappy * quantity) * 2;
  }
  return baseHappy + (candyHappy * quantity);
}

/**
 * Validate numeric input and ensure minimum value
 */
export function validateNumericInput(
  value: string,
  defaultValue: number,
  minValue: number = 0
): number {
  if (value === '') {
    return defaultValue;
  }
  return Math.max(minValue, Number(value));
}
