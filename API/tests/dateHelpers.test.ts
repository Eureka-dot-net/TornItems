import { roundUpToNextQuarterHour, minutesBetween } from '../src/utils/dateHelpers';

describe('Date Helper Functions', () => {
  describe('roundUpToNextQuarterHour', () => {
    it('should round up to next quarter hour for time at :07', () => {
      const date = new Date('2024-01-01T12:07:00.000Z');
      const result = roundUpToNextQuarterHour(date);
      expect(result.getMinutes()).toBe(15);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('should round up to next quarter hour for time at :17', () => {
      const date = new Date('2024-01-01T12:17:00.000Z');
      const result = roundUpToNextQuarterHour(date);
      expect(result.getMinutes()).toBe(30);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('should round up to next quarter hour for time at :32', () => {
      const date = new Date('2024-01-01T12:32:00.000Z');
      const result = roundUpToNextQuarterHour(date);
      expect(result.getMinutes()).toBe(45);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('should round up to next hour for time at :47', () => {
      const date = new Date('2024-01-01T12:47:00.000Z');
      const result = roundUpToNextQuarterHour(date);
      expect(result.getMinutes()).toBe(0);
      expect(result.getHours()).toBe(13);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('should return same time if already on quarter hour boundary with no seconds', () => {
      const date = new Date('2024-01-01T12:15:00.000Z');
      const result = roundUpToNextQuarterHour(date);
      expect(result.getTime()).toBe(date.getTime());
    });

    it('should round up even if on quarter hour boundary but has seconds', () => {
      const date = new Date('2024-01-01T12:15:30.000Z');
      const result = roundUpToNextQuarterHour(date);
      expect(result.getMinutes()).toBe(30);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });
  });

  describe('minutesBetween', () => {
    it('should calculate minutes between two dates', () => {
      const start = new Date('2024-01-01T12:00:00.000Z');
      const end = new Date('2024-01-01T12:15:00.000Z');
      const result = minutesBetween(start, end);
      expect(result).toBe(15);
    });

    it('should handle fractional minutes', () => {
      const start = new Date('2024-01-01T12:00:00.000Z');
      const end = new Date('2024-01-01T12:00:30.000Z');
      const result = minutesBetween(start, end);
      expect(result).toBe(0.5);
    });

    it('should handle negative duration when end is before start', () => {
      const start = new Date('2024-01-01T12:15:00.000Z');
      const end = new Date('2024-01-01T12:00:00.000Z');
      const result = minutesBetween(start, end);
      expect(result).toBe(-15);
    });

    it('should handle large time differences', () => {
      const start = new Date('2024-01-01T12:00:00.000Z');
      const end = new Date('2024-01-01T14:30:00.000Z');
      const result = minutesBetween(start, end);
      expect(result).toBe(150);
    });
  });
});
