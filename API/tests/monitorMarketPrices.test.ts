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
      expect(result).toEqual([1, 2, 3, 4, 6]);
    });

    it('should return evenly spaced intervals for 100 items available', () => {
      const result = calculateQuantityIntervals(100);
      expect(result[0]).toBe(1); // Always starts with 1
      expect(result[result.length - 1]).toBe(100); // Always ends with max
      // Should match the example from the problem statement
      expect(result).toEqual([1, 20, 40, 60, 80, 100]);
    });

    it('should return evenly spaced intervals for 50 items available', () => {
      const result = calculateQuantityIntervals(50);
      expect(result[0]).toBe(1);
      expect(result[result.length - 1]).toBe(50);
      expect(result).toEqual([1, 10, 20, 30, 40, 50]);
    });

    it('should return evenly spaced intervals for 20 items available', () => {
      const result = calculateQuantityIntervals(20);
      expect(result[0]).toBe(1);
      expect(result[result.length - 1]).toBe(20);
      expect(result).toEqual([1, 4, 8, 12, 16, 20]);
    });

    it('should return evenly spaced intervals for 97 items available (from problem statement example)', () => {
      const result = calculateQuantityIntervals(97);
      expect(result[0]).toBe(1);
      expect(result[result.length - 1]).toBe(97);
      // Step = floor(97/5) = 19
      // [1, 19, 38, 57, 76, 97]
      expect(result).toEqual([1, 19, 38, 57, 76, 97]);
    });

    it('should return evenly spaced intervals for 82 items available (from problem statement example)', () => {
      const result = calculateQuantityIntervals(82);
      expect(result[0]).toBe(1);
      expect(result[result.length - 1]).toBe(82);
      // Step = floor(82/5) = 16
      // [1, 16, 32, 48, 64, 82]
      expect(result).toEqual([1, 16, 32, 48, 64, 82]);
    });

    it('should not have duplicate values', () => {
      const testCases = [1, 3, 5, 6, 10, 20, 50, 82, 97, 100];
      for (const amount of testCases) {
        const result = calculateQuantityIntervals(amount);
        const uniqueValues = [...new Set(result)];
        expect(result.length).toBe(uniqueValues.length);
      }
    });

    it('should always include 1 as the first value for any amount', () => {
      const testCases = [1, 3, 5, 6, 10, 20, 50, 82, 97, 100];
      for (const amount of testCases) {
        const result = calculateQuantityIntervals(amount);
        expect(result[0]).toBe(1);
      }
    });

    it('should always include the max as the last value for any amount', () => {
      const testCases = [1, 3, 5, 6, 10, 20, 50, 82, 97, 100];
      for (const amount of testCases) {
        const result = calculateQuantityIntervals(amount);
        expect(result[result.length - 1]).toBe(amount);
      }
    });
  });
});
