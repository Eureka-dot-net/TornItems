# Stock Recommendations Table Fix

## Problem
The `stockRecommendations` table was not getting filled with data after the `aggregate_market_history` job ran.

## Root Cause
The issue was caused by a timing/data availability problem in the `aggregateStockRecommendations` function:

1. **Data Retention Policy**: The `aggregate_market_history` job includes a cleanup step that deletes `StockPriceSnapshot` records older than 24 hours (line 738-744 in `aggregateMarketHistory.ts`)

2. **Data Requirements**: The `aggregateStockRecommendations` function needs 7 days of price data to calculate trend percentages and volatility metrics

3. **Early Exit**: The original code (line 541-543) would query for snapshots from the last 7 days, and if none were found, it would return early without generating any recommendations

4. **The Gap**: After the cleanup job runs, only 24 hours of snapshot data remains. When `aggregateStockRecommendations` runs next, it can't find 7 days of snapshots and exits early, leaving the `stockRecommendations` table empty.

## Solution
Modified the `aggregateStockRecommendations` function to fall back to `StockMarketHistory` when recent `StockPriceSnapshot` data is insufficient:

### Changes Made
1. **Fallback Query**: When no recent snapshots exist from the last 7 days, the function now queries `StockMarketHistory` for aggregated daily data (lines 542-615)

2. **Data Transformation**: Historical data is transformed to match the expected format, including:
   - Using closing prices for trend calculations
   - Retrieving stock_id and benefit_requirement from the most recent snapshot
   - Filtering out stocks where stock_id cannot be determined

3. **Graceful Handling**: The function logs informative messages and only returns if neither snapshot nor historical data is available

### Code Flow
```
1. Try to get 7 days of StockPriceSnapshot data
   ↓
2. If no snapshots found:
   a. Query StockMarketHistory for last 7 days
   b. Get stock_id and benefit_requirement from latest available snapshots
   c. Transform historical data to match snapshot format
   d. Continue with recommendation calculations
   ↓
3. If some snapshots found but < 6 days:
   - Supplement with StockMarketHistory (existing logic)
   ↓
4. Calculate recommendations using available data
```

## Files Modified
- `API/src/jobs/aggregateMarketHistory.ts`: Added fallback logic to use StockMarketHistory when StockPriceSnapshot data is insufficient

## Testing Recommendations
To verify the fix works:

1. **Check Job Logs**: Monitor logs for the `aggregate_market_history` job to see if it logs:
   - "No recent StockPriceSnapshot data found, falling back to StockMarketHistory"
   - "Using X stocks from StockMarketHistory for recommendations"

2. **Verify Data**: After the job runs, check that `StockRecommendation` collection has records:
   ```javascript
   db.stockrecommendations.count()
   db.stockrecommendations.findOne()
   ```

3. **API Test**: Call the stock recommendations endpoint:
   ```bash
   curl http://your-api/stocks/recommendations
   ```

## Prevention
This fix ensures that stock recommendations can be generated as long as either:
- Recent StockPriceSnapshot data exists (preferred), OR
- StockMarketHistory has aggregated daily data (fallback)

Since `StockMarketHistory` is populated by the same job that cleans up snapshots, this ensures continuous availability of recommendation data.

## Related Code
- **Job Scheduler**: `API/src/services/backgroundFetcher.ts` (line 1724-1731)
- **Cleanup Logic**: `API/src/jobs/aggregateMarketHistory.ts` (line 738-752)
- **Stock Fetching**: `API/src/services/backgroundFetcher.ts` `fetchStockPrices()` function
- **API Route**: `API/src/routes/stocks.ts` (line 8-76)
