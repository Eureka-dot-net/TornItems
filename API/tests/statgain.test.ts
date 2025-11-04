import { Gym, IGym } from '../src/models/Gym';
import { connectDB, closeDB } from '../src/config/db';
import { computeStatGain } from '../src/utils/statGainCalculator';

describe('Gym Model and Stat Gain Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  describe('Gym Model', () => {
    it('should create a gym with all stats', async () => {
      const gym = new Gym({
        name: 'testgym',
        displayName: 'Test Gym',
        strength: 3.4,
        speed: 3.6,
        defense: 3.6,
        dexterity: 3.8,
        energyPerTrain: 5,
      });

      expect(gym.name).toBe('testgym');
      expect(gym.displayName).toBe('Test Gym');
      expect(gym.strength).toBe(3.4);
      expect(gym.energyPerTrain).toBe(5);
    });

    it('should create a gym with null stats', async () => {
      const gym = new Gym({
        name: 'specialgym',
        displayName: 'Special Gym',
        strength: 8,
        speed: null,
        defense: null,
        dexterity: null,
        energyPerTrain: 50,
      });

      expect(gym.name).toBe('specialgym');
      expect(gym.strength).toBe(8);
      expect(gym.speed).toBeNull();
      expect(gym.defense).toBeNull();
      expect(gym.dexterity).toBeNull();
    });
  });

  describe('Stat Gain Computation', () => {
    // Helper function to call computeStatGain with gym object
    function computeStatGainFromGym(
      stat: string,
      statTotal: number,
      happy: number,
      perkPerc: number,
      gym: IGym
    ): { perTrain: number; per150Energy: number } {
      const dots = (gym as any)[stat];
      if (dots === null || dots === undefined) {
        throw new Error(`This gym does not support training ${stat}`);
      }
      return computeStatGain(stat, statTotal, happy, perkPerc, dots, gym.energyPerTrain);
    }

    it('should match expected values: 3k strength & 4k happy (~4.8 per train)', () => {
      const mockGym: IGym = {
        name: 'pourfemme',
        displayName: 'Pour Femme [L]',
        strength: 3.4,
        speed: 3.6,
        defense: 3.6,
        dexterity: 3.8,
        energyPerTrain: 5,
      } as IGym;

      const result = computeStatGainFromGym('strength', 3000, 4000, 2, mockGym);

      // Exact value from problem statement
      expect(result.perTrain).toBeCloseTo(4.8, 1);
    });

    it('should match expected values: 3k strength & 30k happy (~35.46 per train)', () => {
      const mockGym: IGym = {
        name: 'pourfemme',
        displayName: 'Pour Femme [L]',
        strength: 3.4,
        speed: 3.6,
        defense: 3.6,
        dexterity: 3.8,
        energyPerTrain: 5,
      } as IGym;

      const result = computeStatGainFromGym('strength', 3000, 30000, 2, mockGym);

      // Exact value from problem statement
      expect(result.perTrain).toBeCloseTo(35.46, 1);
    });

    it('should match expected values: 3m strength & 4k happy (~316.16 per train)', () => {
      const mockGym: IGym = {
        name: 'pourfemme',
        displayName: 'Pour Femme [L]',
        strength: 3.4,
        speed: 3.6,
        defense: 3.6,
        dexterity: 3.8,
        energyPerTrain: 5,
      } as IGym;

      const result = computeStatGainFromGym('strength', 3000000, 4000, 2, mockGym);

      // Exact value from problem statement
      expect(result.perTrain).toBeCloseTo(316.16, 1);
    });

    it('should match expected values: 3m strength & 30k happy (~382.53 per train)', () => {
      const mockGym: IGym = {
        name: 'pourfemme',
        displayName: 'Pour Femme [L]',
        strength: 3.4,
        speed: 3.6,
        defense: 3.6,
        dexterity: 3.8,
        energyPerTrain: 5,
      } as IGym;

      const result = computeStatGainFromGym('strength', 3000000, 30000, 2, mockGym);

      // Exact value from problem statement
      expect(result.perTrain).toBeCloseTo(382.53, 1);
    });

    it('should compute stat gain for basic stats', () => {
      const mockGym: IGym = {
        name: 'pourfemme',
        displayName: 'Pour Femme [L]',
        strength: 3.4,
        speed: 3.6,
        defense: 3.6,
        dexterity: 3.8,
        energyPerTrain: 5,
      } as IGym;

      const result = computeStatGainFromGym('strength', 3479, 4175, 2, mockGym);

      expect(result.perTrain).toBeGreaterThan(0);
      expect(result.per150Energy).toBeGreaterThan(0);
      expect(result.per150Energy).toBe(result.perTrain * 30); // 150 / 5 = 30
    });

    it('should compute higher gains with better gym', () => {
      const lowGym: IGym = {
        name: 'premierfitness',
        displayName: 'Premier Fitness [L]',
        strength: 2,
        speed: 2,
        defense: 2,
        dexterity: 2,
        energyPerTrain: 5,
      } as IGym;

      const highGym: IGym = {
        name: 'sportssciencelab',
        displayName: 'Sports Science Lab [S]',
        strength: 9,
        speed: 9,
        defense: 9,
        dexterity: 9,
        energyPerTrain: 25,
      } as IGym;

      const lowResult = computeStatGainFromGym('strength', 10000, 5000, 2, lowGym);
      const highResult = computeStatGainFromGym('strength', 10000, 5000, 2, highGym);

      // Higher dot value and energy should give more gain per train
      expect(highResult.perTrain).toBeGreaterThan(lowResult.perTrain);
    });

    it('should throw error when gym does not support stat', () => {
      const mockGym: IGym = {
        name: 'gym3000',
        displayName: 'Gym 3000 [S]',
        strength: 8,
        speed: null,
        defense: null,
        dexterity: null,
        energyPerTrain: 50,
      } as IGym;

      expect(() => {
        computeStatGainFromGym('speed', 10000, 5000, 2, mockGym);
      }).toThrow('This gym does not support training speed');
    });

    it('should compute correctly with zero perks', () => {
      const mockGym: IGym = {
        name: 'pourfemme',
        displayName: 'Pour Femme [L]',
        strength: 3.4,
        speed: 3.6,
        defense: 3.6,
        dexterity: 3.8,
        energyPerTrain: 5,
      } as IGym;

      const result = computeStatGainFromGym('strength', 10000, 5000, 0, mockGym);

      expect(result.perTrain).toBeGreaterThan(0);
      expect(result.per150Energy).toBeGreaterThan(0);
    });

    it('should apply perk bonus correctly', () => {
      const mockGym: IGym = {
        name: 'pourfemme',
        displayName: 'Pour Femme [L]',
        strength: 3.4,
        speed: 3.6,
        defense: 3.6,
        dexterity: 3.8,
        energyPerTrain: 5,
      } as IGym;

      const noPerkResult = computeStatGainFromGym('strength', 10000, 5000, 0, mockGym);
      const withPerkResult = computeStatGainFromGym('strength', 10000, 5000, 10, mockGym);

      // With 10% perk bonus, gain should be higher (though the difference may be small)
      expect(withPerkResult.perTrain).toBeGreaterThanOrEqual(noPerkResult.perTrain);
    });

    it('should handle high stat values correctly', () => {
      const mockGym: IGym = {
        name: 'sportssciencelab',
        displayName: 'Sports Science Lab [S]',
        strength: 9,
        speed: 9,
        defense: 9,
        dexterity: 9,
        energyPerTrain: 25,
      } as IGym;

      // Test with stat over 50 million to ensure adjusted stat formula is applied
      const result = computeStatGainFromGym('strength', 60_000_000, 5000, 2, mockGym);

      expect(result.perTrain).toBeGreaterThan(0);
      expect(result.per150Energy).toBeGreaterThan(0);
    });
  });
});
