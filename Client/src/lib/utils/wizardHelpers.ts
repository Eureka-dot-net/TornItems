/**
 * Helper utilities for the Gym Wizard
 */

import { getHanksRatio, getBaldrsRatio, getDefensiveBuildRatio, type StatWeights } from './gymHelpers';

/**
 * Convert wizard stat ratio selections to stat weights
 */
export function convertWizardSelectionsToStatWeights(
  hasBalancedBuild: 'yes' | 'no' | null,
  statRatio: 'balanced' | 'baldr' | 'hank' | 'defDex' | null,
  defDexPrimaryStat: 'defense' | 'dexterity' | null
): StatWeights {
  // If balanced build, return 1:1:1:1
  if (hasBalancedBuild === 'yes' || statRatio === 'balanced') {
    return { strength: 1, speed: 1, defense: 1, dexterity: 1 };
  }

  // Baldr's ratio - default to defense as primary (most common)
  if (statRatio === 'baldr') {
    return getBaldrsRatio('defense');
  }

  // Hank's ratio - default to defense as primary (most common)
  if (statRatio === 'hank') {
    return getHanksRatio('defense');
  }

  // Def/Dex build
  if (statRatio === 'defDex' && defDexPrimaryStat) {
    return getDefensiveBuildRatio(defDexPrimaryStat);
  }

  // Default to balanced if nothing selected
  return { strength: 1, speed: 1, defense: 1, dexterity: 1 };
}

/**
 * Convert wizard perk training preference to stat drift percentage
 */
export function convertTrainByPerksToStatDrift(
  trainByPerks: 'perks' | 'balanced' | null
): number {
  // If training by perks, allow 100% stat drift (no limits)
  if (trainByPerks === 'perks') {
    return 100;
  }

  // If maintaining balance, no stat drift
  return 0;
}

/**
 * Convert wizard balance gym selection to gym index
 */
export function convertBalanceAfterGymToGymIndex(
  balanceAfterGym: 'chachas' | 'georges' | null
): number {
  if (balanceAfterGym === 'chachas') {
    return 19; // Cha Cha's gym index (gym #20, 0-indexed = 19)
  }
  
  if (balanceAfterGym === 'georges') {
    return 23; // George's gym index (gym #24, 0-indexed = 23)
  }

  // Default to George's if not specified
  return 23;
}
