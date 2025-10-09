# Fix for 7-Day Stock Change Calculation Issue

## Issue Summary
After implementing the 30-minute recommendation caching optimization, the 7-day change percentages were consistently very low (near 0%) instead of showing meaningful weekly trends.

## Root Cause Analysis

### The Problem
The `aggregateStockRecommendations()` function calculates 7-day percentage changes by:
1. Querying `StockPriceSnapshot` records from the last 7 days
2. Using the oldest and newest prices to calculate the change

However, the `cleanupOldData()` function was deleting all `StockPriceSnapshot` records older than 24 hours after each aggregation run.

### The Flow
```
Time 0:00 - Stock price snapshots collected every minute
Time 0:30 - Aggregation runs, calculates recommendations with available data
Time 0:30 - Cleanup runs, deletes all data older than 24 hours
Time 1:00 - More snapshots collected
Time 1:30 - Aggregation runs again
            ❌ Only has ~24 hours of data instead of 7 days!
            ❌ "7-day change" is actually ~24-hour change
```

### Why It Went Unnoticed Initially
- The code was logically correct in calculating the change from oldest to newest price
- The aggregation pipeline worked as designed
- But the cleanup was too aggressive, removing the historical data needed for accurate calculations

## The Fix

### Code Changes
**File:** `API/src/jobs/aggregateMarketHistory.ts`

Changed the cleanup threshold from 24 hours to 8 days:

```typescript
// Before (INCORRECT - line 665-666):
const twentyFourHoursAgo = new Date(currentDate);
twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

// After (CORRECT):
const eightDaysAgo = new Date(currentDate);
eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

// And the deletion query (line 692-694):
// Before:
const stockPriceResult = await StockPriceSnapshot.deleteMany({
  timestamp: { $lt: twentyFourHoursAgo }
});

// After:
const stockPriceResult = await StockPriceSnapshot.deleteMany({
  timestamp: { $lt: eightDaysAgo }
});
```

### Documentation Updates
**File:** `STOCK_RECOMMENDATIONS_OPTIMIZATION.md`

Updated section 5 to reflect:
- Retention of 8 days instead of 24 hours
- Explanation that 7 days are needed for calculations
- Note about the 1-day buffer for safety

### Additional Resilience: StockMarketHistory Fallback

To make the system more resilient against data gaps, the `aggregateStockRecommendations()` function now includes a **fallback mechanism**:

**How it works:**
1. After querying StockPriceSnapshot, checks if we have at least 6 days of data
2. If snapshot data is insufficient, queries `StockMarketHistory` for the missing days
3. Uses daily closing prices from the history table to fill gaps
4. Combines historical prices with available snapshot data
5. Provides accurate 7-day calculations even when snapshot data is incomplete

**Benefits:**
- Immediate accuracy even during transition period after deploying the fix
- Resilience against future data gaps from system downtime
- Uses existing aggregated historical data efficiently

**Example log output:**
```
Stock FHG has only 3.2 days of snapshot data, supplementing with StockMarketHistory
Stock FHG: Extended from 3.2 days to ~7 days using 4 historical prices
```

## Why 8 Days?
- **7 days**: Required for accurate 7-day change calculation
- **+1 day**: Buffer to handle edge cases and timing variations
- **Still efficient**: ~192 hours of data per stock vs unlimited retention
- **Database impact**: Minimal - stock prices are fetched every minute, so 8 days ≈ 11,520 records per stock max

## Expected Outcomes

### Immediate (After Deployment)
- Fix is live, new data won't be deleted prematurely
- Existing data still limited to whatever exists now

### After 7+ Days (Full Effectiveness)
- Database will have accumulated 7+ days of stock price snapshots
- `change_7d_pct` will show accurate weekly trends
- Values will be meaningful (not artificially near 0%)
- Stock recommendations will be based on actual 7-day performance

### Example Data Expectations
Before fix (with only 24h of data):
```json
{
  "ticker": "FHG",
  "change_7d_pct": 0.09,  // Actually ~24h change, very small
  "volatility_7d_pct": 0.15,
  "score": -0.6,
  "recommendation": "HOLD"
}
```

After fix (with 7 days of data):
```json
{
  "ticker": "FHG", 
  "change_7d_pct": -5.24,  // Real 7-day change, meaningful
  "volatility_7d_pct": 2.18,
  "score": 2.4,
  "recommendation": "BUY"
}
```

## Verification Steps

### 1. Check Data Retention (Immediate)
```javascript
// In MongoDB shell or via API
db.stockpricesnapshots.aggregate([
  {
    $group: {
      _id: '$ticker',
      oldestTimestamp: { $min: '$timestamp' },
      newestTimestamp: { $max: '$timestamp' }
    }
  }
])
```

Expected: `oldestTimestamp` should eventually be 7+ days old (after accumulation period)

### 2. Monitor Cleanup Logs
Look for log messages like:
```
Deleted X old StockPriceSnapshot records (>8 days)
```

Instead of:
```
Deleted X old StockPriceSnapshot records (>24 hours)  // Old behavior
```

### 3. Verify Recommendations (After 7+ Days)
- Check `/api/stocks/recommendations` endpoint
- Look for `change_7d_pct` values that vary meaningfully
- Values should show realistic weekly trends (e.g., -5% to +5% range typically)
- Compare with manual price checks from 7 days ago

### 4. Database Size Monitoring
- Monitor StockPriceSnapshot collection size
- Should stabilize at approximately: (# of stocks) × (minutes per day × 8 days)
- For 32 stocks: 32 × (1440 × 8) ≈ 368,640 records max

## Related Files
- `API/src/jobs/aggregateMarketHistory.ts` - Contains the fix
- `API/src/utils/stockMath.ts` - Stock calculation utilities (unchanged)
- `STOCK_RECOMMENDATIONS_OPTIMIZATION.md` - Updated documentation
- `API/verify-stocks.js` - Test script for validation

## Testing the Fix
You can test the calculation logic using the verification script:

```bash
cd API
node verify-stocks.js
```

This creates test data with 7+ days of history and verifies the calculations work correctly.

## Future Considerations
- Consider making the retention period configurable via environment variable
- Add monitoring/alerts if data retention drops below expected levels
- Document this as a critical parameter in deployment guides

## Summary
This was a subtle but critical bug where aggressive data cleanup prevented accurate long-term calculations. The fix ensures that historical data is retained long enough for meaningful analysis while still keeping the database efficient.
