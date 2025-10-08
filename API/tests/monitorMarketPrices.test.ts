import { calculateQuantityIntervals } from '../src/jobs/monitorMarketPrices';

describe('Market Price Monitoring', () => {
  describe('calculateQuantityIntervals', () => {
    it('should return [1] for 1 item available', () => {
      const result = calculateQuantityIntervals(1);
      expect(result).toEqual([1]);
    });

    it('should return [1, 2, 3] for 3 items available', () => {
      const result = calculateQuantityIntervals(3);
      expect(result).toEqual([1, 2, 3]);
    });

    it('should return [1, 2, 3, 4, 5] for 5 items available', () => {
      const result = calculateQuantityIntervals(5);
      expect(result).toEqual([1, 2, 3, 4, 5]);
    });

    it('should return intervals for 6 items available', () => {
      const result = calculateQuantityIntervals(6);
      expect(result[0]).toBe(1); // Always starts with 1
      expect(result[result.length - 1]).toBe(6); // Always ends with max
      // 25% = 1.5 -> 2, 50% = 3, 75% = 4.5 -> 5
      expect(result).toEqual([1, 2, 3, 5, 6]);
    });

    it('should return evenly spaced intervals for 100 items available', () => {
      const result = calculateQuantityIntervals(100);
      expect(result).toHaveLength(5);
      expect(result[0]).toBe(1); // Always starts with 1
      expect(result[result.length - 1]).toBe(100); // Always ends with max
      // Should match the example from the problem statement: 1, 25, 50, 75, 100
      expect(result).toEqual([1, 25, 50, 75, 100]);
    });

    it('should return evenly spaced intervals for 50 items available', () => {
      const result = calculateQuantityIntervals(50);
      expect(result).toHaveLength(5);
      expect(result[0]).toBe(1);
      expect(result[result.length - 1]).toBe(50);
      // 25% = 12.5 -> 13, 50% = 25, 75% = 37.5 -> 38
      expect(result).toEqual([1, 13, 25, 38, 50]);
    });

    it('should return evenly spaced intervals for 20 items available', () => {
      const result = calculateQuantityIntervals(20);
      expect(result).toHaveLength(5);
      expect(result[0]).toBe(1);
      expect(result[result.length - 1]).toBe(20);
      // 25% = 5, 50% = 10, 75% = 15
      expect(result).toEqual([1, 5, 10, 15, 20]);
    });

    it('should return evenly spaced intervals for 82 items available (from problem statement example)', () => {
      const result = calculateQuantityIntervals(82);
      expect(result).toHaveLength(5);
      expect(result[0]).toBe(1);
      expect(result[result.length - 1]).toBe(82);
      // 25% = 20.5 -> 21, 50% = 41, 75% = 61.5 -> 62
      expect(result).toEqual([1, 21, 41, 62, 82]);
    });

    it('should not have duplicate values', () => {
      const testCases = [1, 3, 5, 6, 10, 20, 50, 82, 100];
      for (const amount of testCases) {
        const result = calculateQuantityIntervals(amount);
        const uniqueValues = [...new Set(result)];
        expect(result.length).toBe(uniqueValues.length);
      }
    });

    it('should always include 1 as the first value for any amount', () => {
      const testCases = [1, 3, 5, 6, 10, 20, 50, 82, 100];
      for (const amount of testCases) {
        const result = calculateQuantityIntervals(amount);
        expect(result[0]).toBe(1);
      }
    });

    it('should always include the max as the last value for any amount', () => {
      const testCases = [1, 3, 5, 6, 10, 20, 50, 82, 100];
      for (const amount of testCases) {
        const result = calculateQuantityIntervals(amount);
        expect(result[result.length - 1]).toBe(amount);
      }
    });

    it('should return exactly 5 values for amounts > 5', () => {
      const testCases = [6, 10, 20, 50, 82, 100];
      for (const amount of testCases) {
        const result = calculateQuantityIntervals(amount);
        expect(result).toHaveLength(5);
      }
    });
  });
});
