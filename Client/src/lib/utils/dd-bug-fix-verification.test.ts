/**
 * Test to verify the DD bug fix
 * DD should only set happy to 99999 on jump days, not for the entire simulation
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

describe('DD Bug Fix Verification', () => {
  it('should show DD jump now has reasonable impact (not training at 99K happy every day)', () => {
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

    const happyJumpInputs: SimulationInputs = {
      ...baselineInputs,
      happyJump: {
        enabled: true,
        frequencyDays: 7,
        dvdsUsed: 18,
      },
    };

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

    console.log('\n========================================');
    console.log('DD BUG FIX VERIFICATION - 12 MONTHS');
    console.log('========================================');
    console.log(`Baseline (No Jumps):         ${baselineTotal.toLocaleString()} total stats`);
    console.log(`Happy Jump (18 DVDs, weekly): ${happyTotal.toLocaleString()} total stats`);
    console.log(`DD Jump (one-time):          ${ddTotal.toLocaleString()} total stats`);

    const happyBenefit = (happyTotal - baselineTotal) / baselineTotal * 100;
    const ddBenefit = (ddTotal - baselineTotal) / baselineTotal * 100;

    console.log('\nBenefits:');
    console.log(`  Happy Jump vs Baseline:  +${(happyTotal - baselineTotal).toLocaleString()} (${happyBenefit.toFixed(2)}%)`);
    console.log(`  DD vs Baseline:          +${(ddTotal - baselineTotal).toLocaleString()} (${ddBenefit.toFixed(2)}%)`);

    console.log('\n========================================');
    console.log('EXPECTED BEHAVIOR');
    console.log('========================================');
    console.log('✓ Happy Jumps (51 times) should have MAJOR impact (>50%)');
    console.log('✓ DD Jump (1 time) should have MODERATE impact (10-15%)');
    console.log('✓ DD should NOT train at 99K happy every day!');

    // Verify expectations
    expect(happyBenefit).toBeGreaterThan(50); // Happy jumps should have major impact
    expect(ddBenefit).toBeLessThan(20); // DD should have moderate impact, not huge
    expect(ddBenefit).toBeGreaterThan(5); // DD should still have some impact

    console.log('\n✅ Test passed! DD is no longer bugged.');
  });
});
