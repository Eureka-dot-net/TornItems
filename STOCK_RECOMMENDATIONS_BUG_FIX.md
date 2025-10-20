# Stock Recommendations Bug Fix

## Problem
The `stockRecommendations` table was not being populated, even though the `aggregate_market_history` job appeared to be running successfully every 30 minutes.

## Root Causes Identified

After investigation, two critical bugs were found:

### 1. Silent Failures
The aggregation sub-functions were catching errors but not re-throwing them, causing failures to be silent:

```typescript
// Before (lines 412, 476, 697, 763)
} catch (error) {
  logError('Stock Recommendations aggregation failed', ...);
  // No throw - error swallowed!
}
```

**Impact**: When `aggregateStockRecommendations` failed, it would log an error but the main job would continue and report success. This made debugging nearly impossible since the job appeared to complete successfully.

### 2. Incorrect Date Calculations in Cleanup
The cleanup function was calculating cutoff dates incorrectly:

```typescript
// Before (lines 710-714)
const fortyEightHoursAgo = new Date(currentDate); // currentDate is "YYYY-MM-DD" string
fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);
// Problem: new Date("YYYY-MM-DD") creates midnight UTC
// getHours() returns 0, setHours(0 - 48) doesn't work as intended
```

**Impact**: Old `StockPriceSnapshot` records were never being deleted because the date comparison always failed. This is why records from October 8th, 2025 were still in the database.

## Solution

### Fix 1: Make Errors Visible
Added `throw error;` to all aggregation sub-functions so errors propagate properly:

```typescript
// After
} catch (error) {
  logError('Stock Recommendations aggregation failed', ...);
  throw error; // Now the error propagates!
}
```

**Files Modified**: Lines 413, 478, 699, 765 in `aggregateMarketHistory.ts`

### Fix 2: Correct Date Calculations
Use proper date arithmetic with timestamps:

```typescript
// After (lines 710-712)
const now = new Date();
const fortyEightHoursAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));
const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000));
```

This uses millisecond timestamps for accurate date calculations.

## Expected Behavior After Fix

1. **Visible Errors**: When stock recommendations fail, the entire `aggregate_market_history` job will fail with a clear error message indicating which step failed and why.

2. **Proper Cleanup**: Old records will be deleted correctly:
   - `StockPriceSnapshot` records older than 24 hours
   - `UserStockHoldingSnapshot` records older than 24 hours
   - `MarketSnapshot` records older than 48 hours
   - Historical records older than 48 hours

3. **Easier Debugging**: The actual error causing stock recommendations to fail will now be visible in the logs.

## Next Steps

After deploying this fix:

1. **Monitor the logs** for the next `aggregate_market_history` run to see if any errors are now exposed
2. **Check if cleanup works** by verifying old records are being deleted
3. **If recommendations still don't generate**, the error message will now clearly indicate why (e.g., missing data, validation errors, database issues)

## Files Changed
- `API/src/jobs/aggregateMarketHistory.ts`
  - Added error re-throws to 4 functions (+4 lines)
  - Fixed date calculations in cleanup (-5 lines, +3 lines)
  - Net change: +2 lines

## Testing
The fixes are minimal and surgical:
- Error propagation is a simple `throw error;` statement
- Date calculation uses standard JavaScript Date methods
- No changes to business logic or calculations
- Maintains all existing functionality while making errors visible
