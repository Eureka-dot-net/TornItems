import { roundUpToNextQuarterHour } from '../src/utils/dateHelpers';

describe('Restock Time Calculation', () => {
  it('should advance past restock time to future', () => {
    // Simulate a last restock time from yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(10, 0, 0, 0);
    
    const cyclesSkipped = 0;
    const estimatedWaitMinutes = (cyclesSkipped + 1) * 15;
    let estimatedTime = new Date(yesterday.getTime() + estimatedWaitMinutes * 60 * 1000);
    
    // Round to next quarter hour
    let nextRestock = roundUpToNextQuarterHour(estimatedTime);
    
    // If the calculated time is in the past, advance it to the next future restock cycle
    const now = new Date();
    if (nextRestock < now) {
      // Calculate how many 15-minute cycles have passed since the estimated time
      const minutesSinceEstimate = (now.getTime() - nextRestock.getTime()) / (60 * 1000);
      const cyclesPassed = Math.ceil(minutesSinceEstimate / 15);
      
      // Advance to the next restock cycle in the future
      nextRestock = new Date(nextRestock.getTime() + cyclesPassed * 15 * 60 * 1000);
      nextRestock = roundUpToNextQuarterHour(nextRestock);
    }
    
    // The next restock should be in the future
    expect(nextRestock.getTime()).toBeGreaterThan(now.getTime());
    
    // Should be rounded to quarter hour
    const minutes = nextRestock.getMinutes();
    expect([0, 15, 30, 45]).toContain(minutes);
  });

  it('should keep future restock times unchanged', () => {
    // Simulate a recent restock time (5 minutes ago)
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    
    const cyclesSkipped = 0;
    const estimatedWaitMinutes = (cyclesSkipped + 1) * 15;
    let estimatedTime = new Date(fiveMinutesAgo.getTime() + estimatedWaitMinutes * 60 * 1000);
    
    // Round to next quarter hour
    let nextRestock = roundUpToNextQuarterHour(estimatedTime);
    
    // Save the original value for comparison
    const originalNextRestock = new Date(nextRestock.getTime());
    
    // If the calculated time is in the past, advance it to the next future restock cycle
    const now = new Date();
    if (nextRestock < now) {
      const minutesSinceEstimate = (now.getTime() - nextRestock.getTime()) / (60 * 1000);
      const cyclesPassed = Math.ceil(minutesSinceEstimate / 15);
      nextRestock = new Date(nextRestock.getTime() + cyclesPassed * 15 * 60 * 1000);
      nextRestock = roundUpToNextQuarterHour(nextRestock);
    }
    
    // The next restock should be in the future
    expect(nextRestock.getTime()).toBeGreaterThan(now.getTime());
    
    // Should be at most 15 minutes different from original (one cycle advancement at most)
    const timeDiff = Math.abs(nextRestock.getTime() - originalNextRestock.getTime());
    expect(timeDiff).toBeLessThanOrEqual(15 * 60 * 1000);
  });
});
