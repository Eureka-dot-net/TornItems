import { 
  calculate7DayPercentChange, 
  calculateVolatilityPercent, 
  calculateScores,
  getRecommendation 
} from '../src/utils/stockMath';

describe('Stock Calculations', () => {
  describe('calculate7DayPercentChange', () => {
    it('calculates percent change correctly for price increase', () => {
      const current = 110;
      const past = 100;
      const change = calculate7DayPercentChange(current, past);
      expect(change.toFixed(2)).toBe('10.00');
    });

    it('calculates percent change correctly for price decrease', () => {
      const current = 90;
      const past = 100;
      const change = calculate7DayPercentChange(current, past);
      expect(change.toFixed(2)).toBe('-10.00');
    });

    it('calculates percent change correctly for known case from problem statement', () => {
      const current = 107.28;
      const past = 107.38;
      const change = calculate7DayPercentChange(current, past);
      expect(change.toFixed(2)).toBe('-0.09');
    });

    it('calculates percent change correctly for Performance Ribaldry case', () => {
      const current = 602.69;
      const past = 603.9;
      const change = calculate7DayPercentChange(current, past);
      expect(change.toFixed(2)).toBe('-0.20');
      // This should be displayed as -0.20% on the frontend, NOT -20%
    });
  });

  describe('calculateVolatilityPercent', () => {
    it('returns 0 for empty array', () => {
      expect(calculateVolatilityPercent([])).toBe(0);
    });

    it('returns 0 for single price', () => {
      expect(calculateVolatilityPercent([100])).toBe(0);
    });

    it('calculates volatility for stable prices', () => {
      const prices = [100, 100, 100, 100, 100];
      const vol = calculateVolatilityPercent(prices);
      expect(vol).toBe(0);
    });

    it('calculates volatility for varying prices', () => {
      // Prices with known volatility pattern
      const prices = [100, 102, 101, 103, 102];
      const vol = calculateVolatilityPercent(prices);
      // Volatility should be > 0 for varying prices
      expect(vol).toBeGreaterThan(0);
      expect(vol).toBeLessThan(10); // Reasonable bound
    });
  });

  describe('calculateScores', () => {
    it('calculates normalized score correctly for known case', () => {
      const change = -0.09;
      const vol = 4.0; // %
      const { score, sell_score } = calculateScores(change, vol);
      expect(score.toFixed(3)).toBe('0.023'); // ≈ hold signal
      expect(sell_score.toFixed(3)).toBe('-0.023');
    });

    it('handles zero volatility with guard', () => {
      const change = 5.0;
      const vol = 0;
      const { score, sell_score } = calculateScores(change, vol);
      // Should not throw error, uses minimum volatility
      expect(score).toBeDefined();
      expect(sell_score).toBeDefined();
      expect(Math.abs(score)).toBeGreaterThan(0);
    });

    it('calculates strong buy signal for large negative change', () => {
      const change = -15.0; // 15% drop
      const vol = 4.0;
      const { score } = calculateScores(change, vol);
      expect(score).toBeGreaterThan(3); // Should trigger STRONG_BUY
    });

    it('calculates strong sell signal for large positive change', () => {
      const change = 15.0; // 15% increase
      const vol = 4.0;
      const { score } = calculateScores(change, vol);
      expect(score).toBeLessThan(-3); // Should trigger STRONG_SELL
    });
  });

  describe('getRecommendation', () => {
    it('returns STRONG_BUY for score >= 3', () => {
      expect(getRecommendation(3.0)).toBe('STRONG_BUY');
      expect(getRecommendation(5.0)).toBe('STRONG_BUY');
    });

    it('returns BUY for score >= 1 and < 3', () => {
      expect(getRecommendation(1.0)).toBe('BUY');
      expect(getRecommendation(2.0)).toBe('BUY');
    });

    it('returns HOLD for score > -1 and < 1', () => {
      expect(getRecommendation(0.5)).toBe('HOLD');
      expect(getRecommendation(0)).toBe('HOLD');
      expect(getRecommendation(-0.5)).toBe('HOLD');
    });

    it('returns SELL for score > -3 and <= -1', () => {
      expect(getRecommendation(-1.0)).toBe('SELL');
      expect(getRecommendation(-2.0)).toBe('SELL');
    });

    it('returns STRONG_SELL for score <= -3', () => {
      expect(getRecommendation(-3.0)).toBe('STRONG_SELL');
      expect(getRecommendation(-5.0)).toBe('STRONG_SELL');
    });
  });

  describe('Integration test - complete calculation flow', () => {
    it('calculates percent change and normalized score correctly', () => {
      const current = 107.28;
      const past = 107.38;
      const vol = 4.0; // %
      
      const change = calculate7DayPercentChange(current, past);
      expect(change.toFixed(2)).toBe('-0.09');
      
      const { score } = calculateScores(change, vol);
      expect(score.toFixed(3)).toBe('0.023'); // ≈ hold signal
      
      const recommendation = getRecommendation(score);
      expect(recommendation).toBe('HOLD');
    });

    it('produces realistic scores for small price movements', () => {
      // Small price drop (2%) with moderate volatility (4%)
      const change = -2.0;
      const vol = 4.0;
      const { score } = calculateScores(change, vol);
      
      // Score should be 0.5 (HOLD range), not inflated like 2.2
      expect(score).toBeCloseTo(0.5, 1);
      expect(score).toBeLessThan(1); // Should not reach BUY
      expect(getRecommendation(score)).toBe('HOLD');
    });

    it('ensures consistent scale for percentage metrics', () => {
      // Both change and volatility should be in same units (percent)
      const change_pct = 5.0; // 5%
      const vol_pct = 2.5; // 2.5%
      
      const { score } = calculateScores(change_pct, vol_pct);
      // Score = -5.0 / 2.5 = -2.0 (SELL range)
      expect(score).toBeCloseTo(-2.0, 1);
      expect(getRecommendation(score)).toBe('SELL');
    });
  });
});
