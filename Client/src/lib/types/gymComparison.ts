/**
 * Type definitions for gym comparison with time-segmented configurations
 */

/**
 * Partial overrides for a time segment
 * Only stores properties that differ from the base state
 */
export interface SegmentOverrides {
  // Stat weights
  statWeights?: { strength?: number; speed?: number; defense?: number; dexterity?: number };
  
  // Energy sources
  hoursPlayedPerDay?: number;
  xanaxPerDay?: number;
  hasPointsRefill?: boolean;
  maxEnergy?: number;
  
  // Perks and happy
  perkPercs?: { strength?: number; speed?: number; defense?: number; dexterity?: number };
  happy?: number;
  
  // Jumps
  edvdJumpEnabled?: boolean;
  edvdJumpFrequency?: number;
  edvdJumpDvds?: number;
  edvdJumpLimit?: 'indefinite' | 'count' | 'stat';
  edvdJumpCount?: number;
  edvdJumpStatTarget?: number;
  edvdJumpAdultNovelties?: boolean;
  
  candyJumpEnabled?: boolean;
  candyJumpItemId?: number;
  candyJumpUseEcstasy?: boolean;
  candyJumpQuantity?: number;
  candyJumpFactionBenefit?: number;
  
  energyJumpEnabled?: boolean;
  energyJumpItemId?: number;
  energyJumpQuantity?: number;
  energyJumpFactionBenefit?: number;
  
  lossReviveEnabled?: boolean;
  lossReviveNumberPerDay?: number;
  lossReviveEnergyCost?: number;
  lossReviveDaysBetween?: number;
  lossRevivePricePerLoss?: number;
  
  diabetesDayEnabled?: boolean;
  diabetesDayNumberOfJumps?: 1 | 2;
  diabetesDayFHC?: 0 | 1 | 2;
  diabetesDayGreenEgg?: 0 | 1 | 2;
  diabetesDaySeasonalMail?: boolean;
  diabetesDayLogoClick?: boolean;
  
  // Benefits
  companyBenefitKey?: string;
  candleShopStars?: number;
  daysSkippedPerMonth?: number;
}

/**
 * A time segment with configuration overrides
 */
export interface TimeSegment {
  id: string;
  startDay: number; // Day this segment starts (0-based)
  name?: string; // Optional name for the segment
  overrides: SegmentOverrides; // Partial configuration overrides
}

/**
 * Configuration for segmented simulation feature
 */
export interface SegmentedSimulationConfig {
  enabled: boolean; // Toggle for segment feature
  segments: TimeSegment[]; // List of segments, sorted by startDay
  activeSegmentId?: string | null; // ID of segment currently being edited
}
