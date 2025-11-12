// Shared types for Gym Comparison feature

export interface ComparisonSegment {
  id: string;
  startDay: number;
  name?: string;
  // Partial overrides - only specified fields will override the base configuration
  statWeights?: { strength: number; speed: number; defense: number; dexterity: number };
  hoursPlayedPerDay?: number;
  xanaxPerDay?: number;
  hasPointsRefill?: boolean;
  maxEnergy?: number;
  perkPercs?: { strength: number; speed: number; defense: number; dexterity: number };
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
  companyBenefitKey?: string;
  candleShopStars?: number;
  happy?: number;
  daysSkippedPerMonth?: number;
  [key: string]: unknown;
}
