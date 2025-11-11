import type { CompanyBenefit } from '../utils/gymProgressionCalculator';
import { COMPANY_BENEFIT_TYPES } from '../constants/gymConstants';

// Get company benefit - keeps Music Store and Fitness Center unchanged
export const getCompanyBenefit = (benefitKey: string, candleShopStars: number): CompanyBenefit => {
  switch (benefitKey) {
    case COMPANY_BENEFIT_TYPES.NONE:
      return {
        name: 'No Benefits',
        gymUnlockSpeedMultiplier: 1.0,
        bonusEnergyPerDay: 0,
        gymGainMultiplier: 1.0,
      };
    case COMPANY_BENEFIT_TYPES.MUSIC_STORE:
      return {
        name: '3★ Music Store',
        gymUnlockSpeedMultiplier: 1.3, // 30% faster (unchanged)
        bonusEnergyPerDay: 0,
        gymGainMultiplier: 1.0,
      };
    case COMPANY_BENEFIT_TYPES.CANDLE_SHOP:
      return {
        name: `${candleShopStars}★ Candle Shop`,
        gymUnlockSpeedMultiplier: 1.0,
        bonusEnergyPerDay: candleShopStars * 5, // 5 energy per star
        gymGainMultiplier: 1.0,
      };
    case COMPANY_BENEFIT_TYPES.FITNESS_CENTER:
      return {
        name: '10★ Fitness Center',
        gymUnlockSpeedMultiplier: 1.0,
        bonusEnergyPerDay: 0,
        gymGainMultiplier: 1.03, // 3% gym gains (unchanged)
      };
    default:
      return {
        name: 'No Benefits',
        gymUnlockSpeedMultiplier: 1.0,
        bonusEnergyPerDay: 0,
        gymGainMultiplier: 1.0,
      };
  }
};
