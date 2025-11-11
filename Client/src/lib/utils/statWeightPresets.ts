import type { StatWeights } from '../utils/gymProgressionCalculator';

// Stat type for preset functions
export type StatType = 'strength' | 'speed' | 'defense' | 'dexterity';

// Hank's Ratio presets - focuses on one high stat (using 50e gym) and two medium stats (using 25e gym)
export const getHanksRatio = (primaryStat: StatType): StatWeights => {
  // Based on the description, if defense is high (100m), the ratios are:
  // Str: 80m (27.78%), Def: 100m (34.72%), Spd: 80m (27.78%), Dex: 28m (9.72%)
  // These percentages are: 0.2778, 0.3472, 0.2778, 0.0972
  // Normalized to weights: 2.86, 3.57, 2.86, 1.00
  // Simplified to approximately: 2.86, 3.57, 2.86, 1
  
  if (primaryStat === 'defense') {
    return { strength: 2.86, speed: 2.86, defense: 3.57, dexterity: 1 };
  } else if (primaryStat === 'dexterity') {
    return { strength: 2.86, speed: 2.86, defense: 1, dexterity: 3.57 };
  } else if (primaryStat === 'strength') {
    return { strength: 3.57, speed: 1, defense: 2.86, dexterity: 2.86 };
  } else { // speed
    return { strength: 1, speed: 3.57, defense: 2.86, dexterity: 2.86 };
  }
};

// Baldr's Ratio presets - more balanced, focuses on two stats (one using 50e gym, one using 25e gym)
export const getBaldrsRatio = (primaryStat: StatType): StatWeights => {
  // Based on the description, if strength is high (100m), the ratios are:
  // Str: 100m (30.86%), Def: 72m (22.22%), Spd: 80m (24.69%), Dex: 72m (22.22%)
  // These percentages are: 0.3086, 0.2222, 0.2469, 0.2222
  // Normalized to weights: 1.389, 1.000, 1.111, 1.000
  // Simplified to approximately: 1.39, 1, 1.11, 1
  
  if (primaryStat === 'strength') {
    return { strength: 1.39, speed: 1.11, defense: 1, dexterity: 1 };
  } else if (primaryStat === 'speed') {
    return { strength: 1.11, speed: 1.39, defense: 1, dexterity: 1 };
  } else if (primaryStat === 'defense') {
    return { strength: 1, speed: 1, defense: 1.39, dexterity: 1.11 };
  } else { // dexterity
    return { strength: 1, speed: 1, defense: 1.11, dexterity: 1.39 };
  }
};

// Dex or Def build - for dex and def only
// If Dex build: 1.25 dex, 0 def, 1 str, 1 spd
// If Def build: 1.25 def, 0 dex, 1 str, 1 spd
export const getDefensiveBuildRatio = (primaryStat: 'defense' | 'dexterity'): StatWeights => {
  if (primaryStat === 'defense') {
    // 1/1/1.25/0 - high defense, no dexterity
    return { strength: 1, speed: 1, defense: 1.25, dexterity: 0 };
  } else {
    // 1/1/0/1.25 - high dexterity, no defense
    return { strength: 1, speed: 1, defense: 0, dexterity: 1.25 };
  }
};
