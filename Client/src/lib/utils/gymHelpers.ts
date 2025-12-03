/**
 * Helper utilities for the Gym Comparison tool
 */

/**
 * Format a number as currency (shortened for large values)
 */
export function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}b`;
  } else if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}m`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}k`;
  }
  return `$${value.toFixed(0)}`;
}

/**
 * Format days into human-readable time (years, months, days)
 */
export function formatDaysToHumanReadable(days: number): string {
  const years = Math.floor(days / 365);
  const remainingAfterYears = days % 365;
  const months = Math.floor(remainingAfterYears / 30);
  const remainingDays = remainingAfterYears % 30;

  const parts = [];
  if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
  if (remainingDays > 0 || parts.length === 0)
    parts.push(`${remainingDays} day${remainingDays !== 1 ? 's' : ''}`);

  return parts.join(', ');
}

/**
 * Get company benefit configuration
 */
export interface CompanyBenefit {
  name: string;
  gymUnlockSpeedMultiplier: number;
  bonusEnergyPerDay: number;
  gymGainMultiplier: number;
  // Optional stat-specific gym gain multipliers (for strip clubs)
  statSpecificGymGainMultipliers?: {
    strength?: number;
    speed?: number;
    defense?: number;
    dexterity?: number;
  };
}

export function getCompanyBenefit(benefitKey: string, candleShopStars: number): CompanyBenefit {
  switch (benefitKey) {
    case 'none':
      return {
        name: 'No Benefits',
        gymUnlockSpeedMultiplier: 1.0,
        bonusEnergyPerDay: 0,
        gymGainMultiplier: 1.0,
      };
    case 'musicStore':
      return {
        name: '3★ Music Store',
        gymUnlockSpeedMultiplier: 1.3, // 30% faster
        bonusEnergyPerDay: 0,
        gymGainMultiplier: 1.0,
      };
    case 'candleShop':
      return {
        name: `${candleShopStars}★ Candle Shop`,
        gymUnlockSpeedMultiplier: 1.0,
        bonusEnergyPerDay: candleShopStars * 5, // 5 energy per star
        gymGainMultiplier: 1.0,
      };
    case 'fitnessCenter':
      return {
        name: '10★ Fitness Center',
        gymUnlockSpeedMultiplier: 1.0,
        bonusEnergyPerDay: 0,
        gymGainMultiplier: 1.03, // 3% gym gains
      };
    case 'gentsStripClub':
      return {
        name: '7★+ Gents Strip Club',
        gymUnlockSpeedMultiplier: 1.0,
        bonusEnergyPerDay: 0,
        gymGainMultiplier: 1.0,
        statSpecificGymGainMultipliers: {
          dexterity: 1.10, // +10% Dexterity gym gains
        },
      };
    case 'ladiesStripClub':
      return {
        name: '7★+ Ladies Strip Club',
        gymUnlockSpeedMultiplier: 1.0,
        bonusEnergyPerDay: 0,
        gymGainMultiplier: 1.0,
        statSpecificGymGainMultipliers: {
          defense: 1.10, // +10% Defense gym gains
        },
      };
    default:
      return {
        name: 'No Benefits',
        gymUnlockSpeedMultiplier: 1.0,
        bonusEnergyPerDay: 0,
        gymGainMultiplier: 1.0,
      };
  }
}

/**
 * Stat weight presets
 */
export type StatType = 'strength' | 'speed' | 'defense' | 'dexterity';

export interface StatWeights {
  strength: number;
  speed: number;
  defense: number;
  dexterity: number;
}

/**
 * Hank's Ratio presets - focuses on one high stat (using 50e gym) and two medium stats (using 25e gym)
 */
export function getHanksRatio(primaryStat: StatType): StatWeights {
  if (primaryStat === 'defense') {
    return { strength: 2.86, speed: 2.86, defense: 3.57, dexterity: 1 };
  } else if (primaryStat === 'dexterity') {
    return { strength: 2.86, speed: 2.86, defense: 1, dexterity: 3.57 };
  } else if (primaryStat === 'strength') {
    return { strength: 3.57, speed: 1, defense: 2.86, dexterity: 2.86 };
  } else { // speed
    return { strength: 1, speed: 3.57, defense: 2.86, dexterity: 2.86 };
  }
}

/**
 * Baldr's Ratio presets - more balanced, focuses on two stats (one using 50e gym, one using 25e gym)
 */
export function getBaldrsRatio(primaryStat: StatType): StatWeights {
  if (primaryStat === 'strength') {
    return { strength: 1.39, speed: 1.11, defense: 1, dexterity: 1 };
  } else if (primaryStat === 'speed') {
    return { strength: 1.11, speed: 1.39, defense: 1, dexterity: 1 };
  } else if (primaryStat === 'defense') {
    return { strength: 1, speed: 1, defense: 1.39, dexterity: 1.11 };
  } else { // dexterity
    return { strength: 1, speed: 1, defense: 1.11, dexterity: 1.39 };
  }
}

/**
 * Defensive Build Ratio - for dex and def only
 */
export function getDefensiveBuildRatio(primaryStat: 'defense' | 'dexterity'): StatWeights {
  if (primaryStat === 'defense') {
    return { strength: 1, speed: 1, defense: 1.25, dexterity: 0 };
  } else {
    return { strength: 1, speed: 1, defense: 0, dexterity: 1.25 };
  }
}

/**
 * Cost breakdown from a simulation result
 * Includes all costs and income for accurate total calculation
 */
export interface CostBreakdown {
  edvdCost: number;
  xanaxCost: number;
  pointsCost: number;
  candyCost: number;
  stackedCandyCost: number;
  energyCost: number;
  lossReviveIncome: number;
  islandCost: number;
}

/**
 * Extract cost breakdown from a simulation result
 * This helper centralizes the cost extraction logic to avoid duplication
 */
export function extractCostBreakdown(result: {
  edvdJumpCosts?: { totalCost: number };
  xanaxCosts?: { totalCost: number };
  pointsRefillCosts?: { totalCost: number };
  candyJumpCosts?: { totalCost: number };
  stackedCandyJumpCosts?: { totalCost: number };
  energyJumpCosts?: { totalCost: number };
  lossReviveIncome?: { totalIncome: number };
  islandCosts?: { totalCost: number };
}): CostBreakdown {
  return {
    edvdCost: result.edvdJumpCosts?.totalCost || 0,
    xanaxCost: result.xanaxCosts?.totalCost || 0,
    pointsCost: result.pointsRefillCosts?.totalCost || 0,
    candyCost: result.candyJumpCosts?.totalCost || 0,
    stackedCandyCost: result.stackedCandyJumpCosts?.totalCost || 0,
    energyCost: result.energyJumpCosts?.totalCost || 0,
    lossReviveIncome: result.lossReviveIncome?.totalIncome || 0,
    islandCost: result.islandCosts?.totalCost || 0,
  };
}

/**
 * Calculate total cost from a cost breakdown
 * This includes all costs minus any income (loss/revive)
 */
export function calculateTotalCost(breakdown: CostBreakdown): number {
  return (
    breakdown.edvdCost +
    breakdown.xanaxCost +
    breakdown.pointsCost +
    breakdown.candyCost +
    breakdown.stackedCandyCost +
    breakdown.energyCost +
    breakdown.islandCost -
    breakdown.lossReviveIncome
  );
}
