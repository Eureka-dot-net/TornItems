/**
 * Stock calculation utilities for normalized percentage metrics
 */

/**
 * Calculate 7-day percentage change
 * @param currentPrice - Current stock price
 * @param pastPrice - Stock price 7 days ago
 * @returns Percentage change (e.g., 4.25 for 4.25%)
 */
export function calculate7DayPercentChange(currentPrice: number, pastPrice: number): number {
  return ((currentPrice / pastPrice) - 1) * 100;
}

/**
 * Calculate volatility as percentage (standard deviation of daily returns)
 * @param prices - Array of daily prices (sorted from newest to oldest or vice versa)
 * @returns Volatility as percentage (e.g., 4.04 for 4.04%)
 */
export function calculateVolatilityPercent(prices: number[]): number {
  if (prices.length < 2) return 0;
  
  // Calculate daily returns as percentages
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    const dailyReturn = ((prices[i] / prices[i - 1]) - 1) * 100;
    returns.push(dailyReturn);
  }
  
  if (returns.length === 0) return 0;
  
  // Calculate mean of returns
  const mean = returns.reduce((sum, val) => sum + val, 0) / returns.length;
  
  // Calculate standard deviation
  const squaredDiffs = returns.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / returns.length;
  
  return Math.sqrt(variance);
}

/**
 * Calculate normalized buy/sell score
 * @param change_7d_pct - 7-day percentage change
 * @param volatility_7d_pct - 7-day volatility percentage
 * @returns Object with score and sell_score
 */
export function calculateScores(
  change_7d_pct: number, 
  volatility_7d_pct: number
): { score: number; sell_score: number } {
  // Guard against zero or very small volatility
  const vol = Math.max(volatility_7d_pct, 0.0001);
  
  const score = -change_7d_pct / vol;
  const sell_score = -score;
  
  return { score, sell_score };
}

/**
 * Get recommendation based on score
 * @param score - Calculated score
 * @returns Recommendation string
 */
export function getRecommendation(score: number): string {
  if (score >= 3) return 'STRONG_BUY';
  if (score >= 1) return 'BUY';
  if (score > -1) return 'HOLD';
  if (score > -3) return 'SELL';
  return 'STRONG_SELL';
}
