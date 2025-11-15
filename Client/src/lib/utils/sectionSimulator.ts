/**
 * Helper functions for simulating gym progression with multiple training sections
 */

import { simulateGymProgression, type SimulationInputs, type SimulationResult, type DailySnapshot } from './gymProgressionCalculator';
import { getCompanyBenefit } from './gymHelpers';
import type { Gym } from './gymProgressionCalculator';
import type { ItemPrices } from '../hooks/useItemPrices';

// Training section interface
export interface TrainingSection {
  id: string;
  startDay: number;
  endDay: number;
  statWeights: { strength: number; speed: number; defense: number; dexterity: number };
  hoursPlayedPerDay: number;
  xanaxPerDay: number;
  hasPointsRefill: boolean;
  maxEnergy: number;
  perkPercs: { strength: number; speed: number; defense: number; dexterity: number };
  edvdJumpEnabled: boolean;
  edvdJumpFrequency: number;
  edvdJumpDvds: number;
  edvdJumpLimit: 'indefinite' | 'count' | 'stat';
  edvdJumpCount: number;
  edvdJumpStatTarget: number;
  edvdJumpAdultNovelties: boolean;
  candyJumpEnabled: boolean;
  candyJumpItemId: number;
  candyJumpUseEcstasy: boolean;
  candyJumpQuantity: number;
  candyJumpFactionBenefit: number;
  energyJumpEnabled: boolean;
  energyJumpItemId: number;
  energyJumpQuantity: number;
  energyJumpFactionBenefit: number;
  lossReviveEnabled: boolean;
  lossReviveNumberPerDay: number;
  lossReviveEnergyCost: number;
  lossReviveDaysBetween: number;
  lossRevivePricePerLoss: number;
  diabetesDayEnabled: boolean;
  diabetesDayNumberOfJumps: 1 | 2;
  diabetesDayFHC: 0 | 1 | 2;
  diabetesDayGreenEgg: 0 | 1 | 2;
  diabetesDaySeasonalMail: boolean;
  diabetesDayLogoClick: boolean;
  companyBenefitKey: string;
  candleShopStars: number;
  happy: number;
  daysSkippedPerMonth: number;
  statDriftPercent: number;
  balanceAfterGymIndex: number;
  ignorePerksForGymSelection: boolean;
  islandCostPerDay?: number;
}

export interface ComparisonStateWithSections {
  id: string;
  name: string;
  sections: TrainingSection[];
}

/**
 * Simulate gym progression with multiple training sections
 * Each section is simulated sequentially, with end stats from one section
 * becoming the initial stats for the next section
 */
export function simulateWithSections(
  gyms: Gym[],
  state: ComparisonStateWithSections,
  totalMonths: number,
  currentGym: number,
  initStats: { strength: number; speed: number; defense: number; dexterity: number },
  apiKey: string,
  simulatedDate: Date | null,
  showCost: boolean,
  itemPrices?: ItemPrices
): SimulationResult {
  const totalDays = totalMonths * 30;
  const sections = [...state.sections].sort((a, b) => a.startDay - b.startDay);
  
  // Validate sections
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    if (section.startDay < 1 || section.endDay > totalDays) {
      throw new Error(`Section ${i + 1} has invalid day range`);
    }
    if (i > 0 && sections[i - 1].endDay + 1 !== section.startDay) {
      throw new Error(`Gap between sections ${i} and ${i + 1}`);
    }
  }
  
  // Run simulation for each section, chaining the end stats to the next section's initial stats
  let currentStats = { ...initStats };
  let currentGymIndex = currentGym;
  let currentEnergySpent: number | undefined = undefined; // Track energy spent for gym progression
  const allSnapshots: DailySnapshot[] = [];
  
  // Tracking for aggregated results
  let totalEdvdJumps = 0;
  let totalEdvdCost = 0;
  const edvdGains = { strength: 0, speed: 0, defense: 0, dexterity: 0 };
  let totalXanaxCost = 0;
  let totalPointsCost = 0;
  let totalCandyCost = 0;
  let totalEnergyCost = 0;
  let totalLossReviveIncome = 0;
  let totalIslandCost = 0;
  const diabetesDayGains = { strength: 0, speed: 0, defense: 0, dexterity: 0 };
  let ddJump1Gains: { strength: number; speed: number; defense: number; dexterity: number } | undefined;
  let ddJump2Gains: { strength: number; speed: number; defense: number; dexterity: number } | undefined;
  
  for (const section of sections) {
    const sectionDays = section.endDay - section.startDay + 1;
    const sectionMonths = sectionDays / 30;
    
    const benefit = getCompanyBenefit(section.companyBenefitKey, section.candleShopStars);
    
    const inputs: SimulationInputs = {
      statWeights: section.statWeights,
      months: sectionMonths,
      xanaxPerDay: section.xanaxPerDay,
      hasPointsRefill: section.hasPointsRefill,
      hoursPlayedPerDay: section.hoursPlayedPerDay,
      maxEnergy: section.maxEnergy,
      companyBenefit: benefit,
      apiKey,
      initialStats: currentStats,
      happy: section.happy,
      perkPercs: section.perkPercs,
      currentGymIndex: currentGymIndex,
      initialEnergySpent: currentEnergySpent, // Pass gym unlock progress to next section
      lockGym: false,
      statDriftPercent: section.statDriftPercent,
      balanceAfterGymIndex: section.balanceAfterGymIndex,
      ignorePerksForGymSelection: section.ignorePerksForGymSelection,
      edvdJump: section.edvdJumpEnabled ? {
        enabled: true,
        frequencyDays: section.edvdJumpFrequency,
        dvdsUsed: section.edvdJumpDvds,
        limit: section.edvdJumpLimit,
        count: section.edvdJumpCount,
        statTarget: section.edvdJumpStatTarget,
        adultNovelties: section.edvdJumpAdultNovelties,
      } : undefined,
      diabetesDay: section.diabetesDayEnabled ? {
        enabled: true,
        numberOfJumps: section.diabetesDayNumberOfJumps,
        featheryHotelCoupon: section.diabetesDayFHC,
        greenEgg: section.diabetesDayGreenEgg,
        seasonalMail: section.diabetesDaySeasonalMail,
        logoEnergyClick: section.diabetesDayLogoClick,
      } : undefined,
      candyJump: section.candyJumpEnabled ? {
        enabled: true,
        itemId: section.candyJumpItemId,
        useEcstasy: section.candyJumpUseEcstasy,
        quantity: section.candyJumpQuantity,
        factionBenefitPercent: section.candyJumpFactionBenefit,
      } : undefined,
      energyJump: section.energyJumpEnabled ? {
        enabled: true,
        itemId: section.energyJumpItemId,
        quantity: section.energyJumpQuantity,
        factionBenefitPercent: section.energyJumpFactionBenefit,
      } : undefined,
      lossRevive: section.lossReviveEnabled ? {
        enabled: true,
        numberPerDay: section.lossReviveNumberPerDay,
        energyCost: section.lossReviveEnergyCost,
        daysBetween: section.lossReviveDaysBetween,
        pricePerLoss: section.lossRevivePricePerLoss,
      } : undefined,
      daysSkippedPerMonth: section.daysSkippedPerMonth,
      islandCostPerDay: showCost ? section.islandCostPerDay : undefined,
      simulatedDate: simulatedDate,
      itemPrices: (showCost && itemPrices) ? {
        dvdPrice: itemPrices.prices[366],
        xanaxPrice: itemPrices.prices[206],
        ecstasyPrice: itemPrices.prices[196],
        candyEcstasyPrice: itemPrices.prices[197],
        pointsPrice: itemPrices.prices[0],
        candyPrices: {
          310: itemPrices.prices[310],
          36: itemPrices.prices[36],
          528: itemPrices.prices[528],
          529: itemPrices.prices[529],
          151: itemPrices.prices[151],
        },
        energyPrices: {
          985: itemPrices.prices[985],
          986: itemPrices.prices[986],
          987: itemPrices.prices[987],
          530: itemPrices.prices[530],
          532: itemPrices.prices[532],
          533: itemPrices.prices[533],
          367: itemPrices.prices[367],
        },
      } : undefined,
    };
    
    const sectionResult = simulateGymProgression(gyms, inputs);
    
    // Adjust day numbers in snapshots to be relative to the total simulation
    const adjustedSnapshots = sectionResult.dailySnapshots.map(snapshot => ({
      ...snapshot,
      day: snapshot.day + section.startDay - 1,
    }));
    
    allSnapshots.push(...adjustedSnapshots);
    
    // Update current stats, gym index, and energy spent for next section
    currentStats = sectionResult.finalStats;
    currentEnergySpent = sectionResult.finalEnergySpent;
    
    // Update gym index from the last snapshot
    if (sectionResult.dailySnapshots.length > 0) {
      const lastSnapshot = sectionResult.dailySnapshots[sectionResult.dailySnapshots.length - 1];
      // Find the gym index from the gym name
      const gymIndex = gyms.findIndex(g => g.name === lastSnapshot.currentGym);
      if (gymIndex !== -1) {
        currentGymIndex = gymIndex;
      }
    }
    
    // Aggregate costs and gains
    if (sectionResult.edvdJumpCosts) {
      totalEdvdJumps += sectionResult.edvdJumpCosts.totalJumps;
      totalEdvdCost += sectionResult.edvdJumpCosts.totalCost;
    }
    if (sectionResult.edvdJumpGains) {
      edvdGains.strength += sectionResult.edvdJumpGains.totalGains.strength;
      edvdGains.speed += sectionResult.edvdJumpGains.totalGains.speed;
      edvdGains.defense += sectionResult.edvdJumpGains.totalGains.defense;
      edvdGains.dexterity += sectionResult.edvdJumpGains.totalGains.dexterity;
    }
    if (sectionResult.xanaxCosts) {
      totalXanaxCost += sectionResult.xanaxCosts.totalCost;
    }
    if (sectionResult.pointsRefillCosts) {
      totalPointsCost += sectionResult.pointsRefillCosts.totalCost;
    }
    if (sectionResult.candyJumpCosts) {
      totalCandyCost += sectionResult.candyJumpCosts.totalCost;
    }
    if (sectionResult.energyJumpCosts) {
      totalEnergyCost += sectionResult.energyJumpCosts.totalCost;
    }
    if (sectionResult.lossReviveIncome) {
      totalLossReviveIncome += sectionResult.lossReviveIncome.totalIncome;
    }
    if (sectionResult.islandCosts) {
      totalIslandCost += sectionResult.islandCosts.totalCost;
    }
    if (sectionResult.diabetesDayTotalGains) {
      diabetesDayGains.strength += sectionResult.diabetesDayTotalGains.strength;
      diabetesDayGains.speed += sectionResult.diabetesDayTotalGains.speed;
      diabetesDayGains.defense += sectionResult.diabetesDayTotalGains.defense;
      diabetesDayGains.dexterity += sectionResult.diabetesDayTotalGains.dexterity;
    }
    if (sectionResult.diabetesDayJump1Gains && !ddJump1Gains) {
      ddJump1Gains = sectionResult.diabetesDayJump1Gains;
    }
    if (sectionResult.diabetesDayJump2Gains && !ddJump2Gains) {
      ddJump2Gains = sectionResult.diabetesDayJump2Gains;
    }
  }
  
  // Build final result
  const finalResult: SimulationResult = {
    dailySnapshots: allSnapshots,
    finalStats: currentStats,
    sectionBoundaries: sections.map(s => s.endDay),
  };
  
  // Add aggregated cost information
  if (totalEdvdJumps > 0 && totalEdvdCost > 0) {
    finalResult.edvdJumpCosts = {
      totalJumps: totalEdvdJumps,
      costPerJump: totalEdvdCost / totalEdvdJumps,
      totalCost: totalEdvdCost,
    };
    finalResult.edvdJumpGains = {
      averagePerJump: {
        strength: edvdGains.strength / totalEdvdJumps,
        speed: edvdGains.speed / totalEdvdJumps,
        defense: edvdGains.defense / totalEdvdJumps,
        dexterity: edvdGains.dexterity / totalEdvdJumps,
      },
      totalGains: edvdGains,
    };
  }
  if (totalXanaxCost > 0) {
    finalResult.xanaxCosts = { totalCost: totalXanaxCost };
  }
  if (totalPointsCost > 0) {
    finalResult.pointsRefillCosts = { totalCost: totalPointsCost };
  }
  if (totalCandyCost > 0) {
    const totalCandyDays = sections.reduce((sum, s) => sum + (s.candyJumpEnabled ? (s.endDay - s.startDay + 1) : 0), 0);
    finalResult.candyJumpCosts = {
      totalDays: totalCandyDays,
      costPerDay: totalCandyDays > 0 ? totalCandyCost / totalCandyDays : 0,
      totalCost: totalCandyCost,
    };
  }
  if (totalEnergyCost > 0) {
    const totalEnergyDays = sections.reduce((sum, s) => sum + (s.energyJumpEnabled ? (s.endDay - s.startDay + 1) : 0), 0);
    finalResult.energyJumpCosts = {
      totalDays: totalEnergyDays,
      costPerDay: totalEnergyDays > 0 ? totalEnergyCost / totalEnergyDays : 0,
      totalCost: totalEnergyCost,
    };
  }
  if (totalLossReviveIncome > 0) {
    const totalLossReviveDays = sections.reduce((sum, s) => {
      if (!s.lossReviveEnabled) return sum;
      const sectionDays = s.endDay - s.startDay + 1;
      return sum + Math.floor(sectionDays / s.lossReviveDaysBetween);
    }, 0);
    finalResult.lossReviveIncome = {
      totalDays: totalLossReviveDays,
      incomePerDay: totalLossReviveDays > 0 ? totalLossReviveIncome / totalLossReviveDays : 0,
      totalIncome: totalLossReviveIncome,
    };
  }
  if (totalIslandCost > 0) {
    finalResult.islandCosts = {
      costPerDay: totalIslandCost / totalDays,
      totalCost: totalIslandCost,
    };
  }
  if (diabetesDayGains.strength + diabetesDayGains.speed + diabetesDayGains.defense + diabetesDayGains.dexterity > 0) {
    finalResult.diabetesDayTotalGains = diabetesDayGains;
  }
  if (ddJump1Gains) {
    finalResult.diabetesDayJump1Gains = ddJump1Gains;
  }
  if (ddJump2Gains) {
    finalResult.diabetesDayJump2Gains = ddJump2Gains;
  }
  
  return finalResult;
}
