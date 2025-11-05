/**
 * Investigation: Happy Jump vs DD Jump comparison
 * Tests to understand why Happy Jumps with 18 DVDs (99K happy) have less impact than DD jumps
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

describe('Happy Jump vs DD Jump Investigation', () => {
  it('should compare Happy Jump (18 DVDs) vs DD Jump over 12 months', () => {
    // Baseline
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
    };

    // Happy Jump with 18 DVDs (weekly)
    const happyJumpInputs: SimulationInputs = {
      ...baselineInputs,
      happyJump: {
        enabled: true,
        frequencyDays: 7,
        dvdsUsed: 18,
      },
    };

    // DD Jump (one-time)
    const ddJumpInputs: SimulationInputs = {
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

    const baselineResult = simulateGymProgression(GYMS, baselineInputs);
    const happyJumpResult = simulateGymProgression(GYMS, happyJumpInputs);
    const ddResult = simulateGymProgression(GYMS, ddJumpInputs);

    const baselineTotal = baselineResult.finalStats.strength + baselineResult.finalStats.speed + 
                          baselineResult.finalStats.defense + baselineResult.finalStats.dexterity;
    const happyTotal = happyJumpResult.finalStats.strength + happyJumpResult.finalStats.speed + 
                       happyJumpResult.finalStats.defense + happyJumpResult.finalStats.dexterity;
    const ddTotal = ddResult.finalStats.strength + ddResult.finalStats.speed + 
                    ddResult.finalStats.defense + ddResult.finalStats.dexterity;

    // Calculate happy value for 18 DVDs
    const happyWith18DVDs = (5025 + 2500 * 18) * 2;

    console.log('\n========================================');
    console.log('HAPPY JUMP VS DD JUMP - 12 MONTHS');
    console.log('========================================');
    console.log(`Baseline (No Jumps):         ${baselineTotal.toLocaleString()} total stats`);
    console.log(`Happy Jump (18 DVDs, weekly): ${happyTotal.toLocaleString()} total stats`);
    console.log(`DD Jump (one-time):          ${ddTotal.toLocaleString()} total stats`);

    console.log('\nBenefits:');
    console.log(`  Happy Jump vs Baseline:  +${(happyTotal - baselineTotal).toLocaleString()} (${(((happyTotal - baselineTotal) / baselineTotal) * 100).toFixed(2)}%)`);
    console.log(`  DD vs Baseline:          +${(ddTotal - baselineTotal).toLocaleString()} (${(((ddTotal - baselineTotal) / baselineTotal) * 100).toFixed(2)}%)`);

    console.log('\n========================================');
    console.log('CONFIGURATION COMPARISON');
    console.log('========================================');
    
    console.log('\nHappy Values:');
    console.log(`  Happy Jump (18 DVDs): ${happyWith18DVDs.toLocaleString()}`);
    console.log(`  DD Jump: 99,999`);

    console.log('\nEnergy per Jump:');
    console.log(`  Happy Jump: 1,150 energy (1000 xanax + 150 points refill)`);
    console.log(`  DD Jump: 1,900 energy (1000 xanax + 150 points + 500 green egg + 250 seasonal)`);
    console.log(`  DIFFERENCE: DD has 65% MORE energy per jump!`);

    const totalDays = 12 * 30;
    const happyJumps = Math.floor(totalDays / 7);
    console.log('\nFrequency over 12 months:');
    console.log(`  Happy Jumps: ~${happyJumps} jumps (weekly recurring)`);
    console.log(`  DD Jumps: 1 jump (one-time on day 7)`);

    console.log('\nTotal Energy Spent on Jumps:');
    console.log(`  Happy Jumps: ${happyJumps} × 1,150 = ${(happyJumps * 1150).toLocaleString()} energy`);
    console.log(`  DD Jump: 1 × 1,900 = 1,900 energy`);

    expect(baselineTotal).toBeGreaterThan(0);
    expect(happyTotal).toBeGreaterThan(baselineTotal);
    expect(ddTotal).toBeGreaterThan(baselineTotal);
  });
});
