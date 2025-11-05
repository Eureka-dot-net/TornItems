/**
 * Investigation: DD Jump Impact Analysis
 * Tests to understand why 1 DD jump has major impact but 2 DD jumps has minor additional benefit
 */

import {
  simulateGymProgression,
  type Gym,
  type SimulationInputs,
  type CompanyBenefit,
} from './gymProgressionCalculator';

const GYMS: Gym[] = [
  { name: "premierfitness", displayName: "Premier Fitness [L]", strength: 2, speed: 2, defense: 2, dexterity: 2, energyPerTrain: 5, costToUnlock: 10, energyToUnlock: 0 },
  { name: "knuckleheads", displayName: "Knuckle Heads [M]", strength: 4.8, speed: 4.4, defense: 4, dexterity: 4.2, energyPerTrain: 10, costToUnlock: 50000, energyToUnlock: 16950 },
];

const noBenefit: CompanyBenefit = {
  name: 'No Benefits',
  gymUnlockSpeedMultiplier: 1.0,
  bonusEnergyPerDay: 0,
  gymGainMultiplier: 1.0,
};

describe('DD Jump Impact Investigation', () => {
  it('should show DD jump impact over 6 months', () => {
    // Baseline - No DD
    const baselineInputs: SimulationInputs = {
      statWeights: { strength: 1, speed: 1, defense: 1, dexterity: 1 },
      months: 6,
      xanaxPerDay: 3,
      hasPointsRefill: true,
      hoursPlayedPerDay: 16,
      maxEnergy: 150,
      companyBenefit: noBenefit,
      initialStats: { strength: 80000, speed: 80000, defense: 80000, dexterity: 80000 },
      happy: 5025,
      perkPercs: { strength: 14.597, speed: 14.597, defense: 14.597, dexterity: 14.597 },
      currentGymIndex: 1,
      lockGym: false,
      diabetesDay: {
        enabled: false,
        numberOfJumps: 1,
        featheryHotelCoupon: 0,
        greenEgg: 0,
        seasonalMail: false,
        logoEnergyClick: false,
      },
    };

    // 1 DD Jump
    const oneDDInputs: SimulationInputs = {
      ...baselineInputs,
      diabetesDay: {
        enabled: true,
        numberOfJumps: 1,
        featheryHotelCoupon: 0,
        greenEgg: 1,
        seasonalMail: true,
        logoEnergyClick: false,
      },
    };

    // 2 DD Jumps
    const twoDDInputs: SimulationInputs = {
      ...baselineInputs,
      diabetesDay: {
        enabled: true,
        numberOfJumps: 2,
        featheryHotelCoupon: 0,
        greenEgg: 1,
        seasonalMail: true,
        logoEnergyClick: true,
      },
    };

    const baselineResult = simulateGymProgression(GYMS, baselineInputs);
    const oneDDResult = simulateGymProgression(GYMS, oneDDInputs);
    const twoDDResult = simulateGymProgression(GYMS, twoDDInputs);

    const baselineTotal = baselineResult.finalStats.strength + baselineResult.finalStats.speed + 
                          baselineResult.finalStats.defense + baselineResult.finalStats.dexterity;
    const oneDDTotal = oneDDResult.finalStats.strength + oneDDResult.finalStats.speed + 
                       oneDDResult.finalStats.defense + oneDDResult.finalStats.dexterity;
    const twoDDTotal = twoDDResult.finalStats.strength + twoDDResult.finalStats.speed + 
                       twoDDResult.finalStats.defense + twoDDResult.finalStats.dexterity;

    const oneDDBenefit = oneDDTotal - baselineTotal;
    const twoDDBenefit = twoDDTotal - baselineTotal;
    const additionalBenefitOf2nd = twoDDTotal - oneDDTotal;

    console.log('\n========================================');
    console.log('DD JUMP IMPACT ANALYSIS - 6 MONTHS');
    console.log('========================================');
    console.log(`Baseline (No DD):    ${baselineTotal.toLocaleString()} total stats`);
    console.log(`1 DD Jump:           ${oneDDTotal.toLocaleString()} total stats`);
    console.log(`2 DD Jumps:          ${twoDDTotal.toLocaleString()} total stats`);
    console.log('\nBenefits:');
    console.log(`  1 DD vs No DD:     +${oneDDBenefit.toLocaleString()} (${(oneDDBenefit / baselineTotal * 100).toFixed(2)}%)`);
    console.log(`  2 DD vs No DD:     +${twoDDBenefit.toLocaleString()} (${(twoDDBenefit / baselineTotal * 100).toFixed(2)}%)`);
    console.log(`  2 DD vs 1 DD:      +${additionalBenefitOf2nd.toLocaleString()} (${(additionalBenefitOf2nd / oneDDTotal * 100).toFixed(2)}%)`);

    if (oneDDResult.diabetesDayTotalGains) {
      const oneDDGain = Object.values(oneDDResult.diabetesDayTotalGains).reduce((a,b)=>a+b,0);
      console.log(`\n1 DD Jump Direct Gain: ${oneDDGain.toLocaleString()} stats`);
    }

    if (twoDDResult.diabetesDayJump1Gains && twoDDResult.diabetesDayJump2Gains) {
      const jump1Total = Object.values(twoDDResult.diabetesDayJump1Gains).reduce((a,b)=>a+b,0);
      const jump2Total = Object.values(twoDDResult.diabetesDayJump2Gains).reduce((a,b)=>a+b,0);
      console.log(`\n2 DD Jump Details:`);
      console.log(`  Jump 1 (day 5):    ${jump1Total.toLocaleString()} stats`);
      console.log(`  Jump 2 (day 7):    ${jump2Total.toLocaleString()} stats`);
      console.log(`  Total DD Gain:     ${(jump1Total + jump2Total).toLocaleString()} stats`);
    }

    // Check for energy configuration issues
    console.log('\n========================================');
    console.log('ENERGY ANALYSIS');
    console.log('========================================');
    
    // Calculate DD energy for 1 jump
    const oneDDEnergy = 1000 + 150 + 500 + 250; // xanax + points refill + green egg + seasonal mail
    console.log(`1 DD Jump Energy: ${oneDDEnergy} (base 1150 + green egg 500 + seasonal 250)`);
    
    // Calculate DD energy for 2 jumps
    const jump1Energy = 1000 + 150 + 500 + 250; // xanax + points + green egg + seasonal
    const jump2Energy = 1000 + 150 + 50; // xanax + points + logo click (no items left)
    console.log(`2 DD Jump 1 Energy: ${jump1Energy} (base 1150 + green egg 500 + seasonal 250)`);
    console.log(`2 DD Jump 2 Energy: ${jump2Energy} (base 1150 + logo click 50)`);
    console.log(`Total 2 DD Energy: ${jump1Energy + jump2Energy}`);

    expect(baselineTotal).toBeGreaterThan(0);
    expect(oneDDTotal).toBeGreaterThan(baselineTotal);
    expect(twoDDTotal).toBeGreaterThan(oneDDTotal);
  });

  it('should show DD jump impact over 12 months', () => {
    // Same config but 12 months
    const baselineInputs: SimulationInputs = {
      statWeights: { strength: 1, speed: 1, defense: 1, dexterity: 1 },
      months: 12,
      xanaxPerDay: 3,
      hasPointsRefill: true,
      hoursPlayedPerDay: 16,
      maxEnergy: 150,
      companyBenefit: noBenefit,
      initialStats: { strength: 80000, speed: 80000, defense: 80000, dexterity: 80000 },
      happy: 5025,
      perkPercs: { strength: 14.597, speed: 14.597, defense: 14.597, dexterity: 14.597 },
      currentGymIndex: 1,
      lockGym: false,
      diabetesDay: {
        enabled: false,
        numberOfJumps: 1,
        featheryHotelCoupon: 0,
        greenEgg: 0,
        seasonalMail: false,
        logoEnergyClick: false,
      },
    };

    const oneDDInputs: SimulationInputs = {
      ...baselineInputs,
      diabetesDay: {
        enabled: true,
        numberOfJumps: 1,
        featheryHotelCoupon: 0,
        greenEgg: 1,
        seasonalMail: true,
        logoEnergyClick: false,
      },
    };

    const twoDDInputs: SimulationInputs = {
      ...baselineInputs,
      diabetesDay: {
        enabled: true,
        numberOfJumps: 2,
        featheryHotelCoupon: 0,
        greenEgg: 1,
        seasonalMail: true,
        logoEnergyClick: true,
      },
    };

    const baseline12 = simulateGymProgression(GYMS, baselineInputs);
    const oneDD12 = simulateGymProgression(GYMS, oneDDInputs);
    const twoDD12 = simulateGymProgression(GYMS, twoDDInputs);

    const baseline12Total = baseline12.finalStats.strength + baseline12.finalStats.speed + 
                            baseline12.finalStats.defense + baseline12.finalStats.dexterity;
    const oneDD12Total = oneDD12.finalStats.strength + oneDD12.finalStats.speed + 
                         oneDD12.finalStats.defense + oneDD12.finalStats.dexterity;
    const twoDD12Total = twoDD12.finalStats.strength + twoDD12.finalStats.speed + 
                         twoDD12.finalStats.defense + twoDD12.finalStats.dexterity;

    const oneDDBenefit = oneDD12Total - baseline12Total;
    const twoDDBenefit = twoDD12Total - baseline12Total;
    const additionalBenefitOf2nd = twoDD12Total - oneDD12Total;

    console.log('\n========================================');
    console.log('DD JUMP IMPACT ANALYSIS - 12 MONTHS');
    console.log('========================================');
    console.log(`Baseline (No DD):    ${baseline12Total.toLocaleString()} total stats`);
    console.log(`1 DD Jump:           ${oneDD12Total.toLocaleString()} total stats`);
    console.log(`2 DD Jumps:          ${twoDD12Total.toLocaleString()} total stats`);
    console.log('\nBenefits:');
    console.log(`  1 DD vs No DD:     +${oneDDBenefit.toLocaleString()} (${(oneDDBenefit / baseline12Total * 100).toFixed(2)}%)`);
    console.log(`  2 DD vs No DD:     +${twoDDBenefit.toLocaleString()} (${(twoDDBenefit / baseline12Total * 100).toFixed(2)}%)`);
    console.log(`  2 DD vs 1 DD:      +${additionalBenefitOf2nd.toLocaleString()} (${(additionalBenefitOf2nd / oneDD12Total * 100).toFixed(2)}%)`);

    expect(baseline12Total).toBeGreaterThan(0);
    expect(oneDD12Total).toBeGreaterThan(baseline12Total);
    expect(twoDD12Total).toBeGreaterThan(oneDD12Total);
  });
});
