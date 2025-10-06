# Implementation Summary - Stock Market History & Sales Tax

## Problem Statement

The issue requested two major enhancements:

1. **Add history tracking to the batch job** for:
   - Stock market data (opening, closing, lowest, highest, daily volatility)
   - Shop item stock data (average sold out duration, cycles skipped)
   - Automatic cleanup of old transactional data

2. **Apply 5% sales tax** to profit calculations (deducted from sold price)

## Solution Overview

### Part 1: Stock Market History

**Created:** `StockMarketHistory` model to store daily aggregates

**Fields:**
- Opening price (first price of the day)
- Closing price (last price of the day)
- Lowest value
- Highest value  
- Daily volatility (calculated as `((high - low) / low) * 100`)

**Implementation:**
- New function `aggregateStockMarketHistory()` in the batch job
- Processes all historical data retroactively for any missing days
- Prevents duplicates by checking existing history before processing
- Calculates metrics from `StockPriceSnapshot` collection

**Data Retention:**
- `StockPriceSnapshot` (raw data): Deleted after 14 days
- `StockMarketHistory` (aggregates): Kept indefinitely

### Part 2: Shop Item Stock History

**Created:** `ShopItemStockHistory` model to store daily aggregates

**Fields:**
- Average sold out duration (in minutes)
- Number of cycles skipped

**Implementation:**
- New function `aggregateShopItemStockHistory()` in the batch job
- Collects data from `ShopItemState` which already tracks these metrics
- Creates daily snapshots of the rolling averages
- Works for both city shops and foreign shops

**Data Retention:**
- `CityShopStockHistory` (raw data): Deleted after 48 hours
- `ForeignStockHistory` (raw data): Deleted after 48 hours
- `ShopItemStockHistory` (aggregates): Kept indefinitely

### Part 3: Automatic Data Cleanup

**Created:** `cleanupOldData()` function in the batch job

**Deletes:**
- `MarketSnapshot` records older than 14 days
- `CityShopStockHistory` records older than 48 hours
- `ForeignStockHistory` records older than 48 hours

**Benefits:**
- Prevents database bloat
- Maintains performance
- Preserves aggregated history while removing raw transactional data

### Part 4: 5% Sales Tax

**Applied to all profit calculations:**

1. **profit.ts route** (live API responses)
   - `profitPer1 = (market * 0.95) - buy`
   - `estimated_market_value_profit = (market * 0.95) - buy`
   - `lowest_50_profit = (avgLowest50 * 0.95) - buy`
   - `sold_profit = (avgSoldPrice * 0.95) - buy`

2. **aggregateMarketHistory job** (historical data)
   - Same calculations applied to aggregated data
   - Ensures consistency between live and historical profit figures

**Impact:**
- More accurate profit calculations
- Accounts for real trading costs
- Higher impact on expensive items (as mentioned in requirements)

## Files Created

1. `API/src/models/StockMarketHistory.ts` - Stock market history model
2. `API/src/models/ShopItemStockHistory.ts` - Shop item stock history model
3. `API/tests/historyModels.test.ts` - Tests for new models and calculations
4. `API/STOCK_HISTORY_IMPLEMENTATION.md` - Detailed implementation documentation

## Files Modified

1. `API/src/jobs/aggregateMarketHistory.ts`
   - Added imports for new models
   - Added `aggregateStockMarketHistory()` function
   - Added `aggregateShopItemStockHistory()` function
   - Added `cleanupOldData()` function
   - Applied 5% sales tax to profit calculations
   - Integrated new functions into main job flow

2. `API/src/routes/profit.ts`
   - Applied 5% sales tax to all profit calculations
   - Updated `profitPer1`, `estimated_market_value_profit`, `lowest_50_profit`, `sold_profit`

## Testing

**Unit Tests Added:**
- StockMarketHistory model creation and uniqueness constraint
- ShopItemStockHistory model creation and uniqueness constraint
- Sales tax calculation verification (5% deduction from market prices)

**Manual Testing Recommended:**
1. Run the batch job and verify stock market history is created
2. Verify shop item stock history is created
3. Check logs for cleanup operations
4. Query profit API and verify sales tax is applied
5. Check that old data is being deleted after the retention period

## Deployment Notes

### No Breaking Changes
- All changes are additive
- Existing API responses maintain the same structure
- Only profit values are adjusted (more accurate now)

### Database Impact
- Two new collections will be created automatically
- No migration required
- Cleanup will begin on first batch job run after deployment

### Monitoring
Check logs for:
```
=== Starting Stock Market History aggregation ===
=== Stock Market History aggregation completed ===
=== Starting Shop Item Stock History aggregation ===
=== Shop Item Stock History aggregation completed ===
=== Starting cleanup of old transactional data ===
=== Cleanup of old transactional data completed ===
```

## Performance Impact

### Expected Load
- Stock market history: ~32 stocks × ~1 record per day = 32 records/day max
- Shop item history: ~1000 items × 1 record per day = 1000 records/day max
- Cleanup: Deletes thousands of old records daily (improves performance)

### Optimizations
- Bulk write operations for all inserts
- Indexed queries for all lookups
- Duplicate detection prevents redundant processing
- Incremental processing (only missing dates)

## Next Steps

1. Deploy changes to production
2. Monitor first batch job execution
3. Verify history data is being created correctly
4. Confirm cleanup operations are working
5. Validate profit calculations with sales tax

## Rollback Plan

If needed, the changes can be rolled back by:
1. Reverting the code changes
2. Optionally dropping the new collections (StockMarketHistory, ShopItemStockHistory)
3. Re-enabling automatic deletion in existing models if it was previously in place

The changes are designed to be safe and non-destructive to existing data.
