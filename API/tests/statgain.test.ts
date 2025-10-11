import { Gym, IGym } from '../src/models/Gym';
import { connectDB, closeDB } from '../src/config/db';

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
    // Replicate the computeStatGain function for testing
    function computeStatGain(
      stat: string,
      statTotal: number,
      happy: number,
      perkPerc: number,
      gym: IGym
    ): { perTrain: number; per150Energy: number } {
      const lookupTable: Record<string, [number, number]> = {
        strength: [1600, 1700],
        speed: [1600, 2000],
        defense: [2100, -600],
        dexterity: [1800, 1500],
      };

      const [lookup2, lookup3] = lookupTable[stat];

      // Get the dots value for this stat from the gym
      const dots = (gym as any)[stat];
      if (dots === null || dots === undefined) {
        throw new Error(`This gym does not support training ${stat}`);
      }

      const adjustedStat =
        statTotal < 50_000_000
          ? statTotal
          : (statTotal - 50_000_000) / (8.77635 * Math.log(statTotal)) + 50_000_000;

      const happyMult = 1 + 0.07 * Math.log(1 + happy / 250);
      const perkBonus = 1 + perkPerc / 100;

      const gain =
        (1 / 200000) *
          dots *
          gym.energyPerTrain *
          perkBonus *
          adjustedStat *
          happyMult +
        8 * Math.pow(happy, 1.05) +
        lookup2 * (1 - Math.pow(happy / 99999, 2)) +
        lookup3;

      return {
        perTrain: gain,
        per150Energy: gain * (150 / gym.energyPerTrain),
      };
    }

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

      const result = computeStatGain('strength', 3479, 4175, 2, mockGym);

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

      const lowResult = computeStatGain('strength', 10000, 5000, 2, lowGym);
      const highResult = computeStatGain('strength', 10000, 5000, 2, highGym);

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
        computeStatGain('speed', 10000, 5000, 2, mockGym);
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

      const result = computeStatGain('strength', 10000, 5000, 0, mockGym);

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

      const noPerkResult = computeStatGain('strength', 10000, 5000, 0, mockGym);
      const withPerkResult = computeStatGain('strength', 10000, 5000, 10, mockGym);

      // With 10% perk bonus, gain should be higher
      expect(withPerkResult.perTrain).toBeGreaterThan(noPerkResult.perTrain);
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
      const result = computeStatGain('strength', 60_000_000, 5000, 2, mockGym);

      expect(result.perTrain).toBeGreaterThan(0);
      expect(result.per150Energy).toBeGreaterThan(0);
    });
  });
});
