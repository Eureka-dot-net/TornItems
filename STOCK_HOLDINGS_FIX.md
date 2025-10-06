# Stock Holdings Clearing Fix - Implementation Summary

## Problem Statement

When a user sells all shares of a stock, the stock continues to show in their holdings with the previous non-zero share count. This happens because:

1. The Torn API only returns stocks the user currently owns
2. When all shares are sold, the stock is not returned in the API response
3. The previous implementation only created snapshots for stocks in the API response
4. Old snapshots with non-zero shares remained as the "most recent" snapshot

## Root Cause Analysis

The `fetchUserStockHoldings()` function had this flow:

```typescript
// OLD IMPLEMENTATION
1. Fetch stocks from API
2. If no stocks returned, exit early
3. For each stock in API response:
   - Calculate weighted average buy price
   - Create snapshot with current shares
4. Insert snapshots to database
```

**Issue:** When a stock is sold (not in API response), no new snapshot is created, leaving the old non-zero snapshot as the most recent entry.

## Solution

Implement the same pattern used in `fetchCityShopStock()` for handling items that go out of stock:

```typescript
// NEW IMPLEMENTATION
1. Fetch stocks from API
2. Track which stock IDs are in current response
3. For each stock in API response:
   - Calculate weighted average buy price
   - Create snapshot with current shares
4. Query for previously owned stocks (total_shares > 0)
5. For stocks not in current response:
   - Create 0-share snapshot
6. Insert all snapshots to database
```

## Code Changes

### File: `API/src/services/backgroundFetcher.ts`

**Changed:**
- Removed early return when no stocks in API response
- Added `currentStockIds` Set to track stocks in API response
- Added aggregation query to find previously owned stocks
- Added loop to create 0-share snapshots for sold stocks
- Added logging when creating 0-share snapshots

**Key Addition:**
```typescript
// Find stocks that were previously owned but are not in current response
const previouslyOwnedStocks = await UserStockHoldingSnapshot.aggregate([
  { $match: { total_shares: { $gt: 0 } } },
  { $sort: { stock_id: 1, timestamp: -1 } },
  { $group: {
      _id: '$stock_id',
      total_shares: { $first: '$total_shares' },
      timestamp: { $first: '$timestamp' }
    }
  }
]);

// Create 0-share snapshots for sold stocks
for (const previousStock of previouslyOwnedStocks) {
  if (!currentStockIds.has(previousStock._id)) {
    logInfo(`Stock ${previousStock._id} no longer owned, creating 0-share snapshot`);
    bulkOps.push({
      stock_id: previousStock._id,
      total_shares: 0,
      avg_buy_price: null,
      transaction_count: 0,
      timestamp: timestamp,
    });
  }
}
```

## Testing

### Unit Tests (`API/tests/userStockHoldings.test.ts`)

Created comprehensive tests for the tracking logic:

1. ✅ Detect stocks sold (in DB but not in API response)
2. ✅ Handle all stocks remaining owned
3. ✅ Handle all stocks being sold
4. ✅ Ignore stocks already at 0 shares
5. ✅ Use most recent snapshot for each stock
6. ✅ Verify zero-share snapshot structure

### Integration Test (`API/tests/stocks.test.ts`)

Added test to verify the API endpoint behavior:

```typescript
it('should show 0 shares for stocks that have been sold', async () => {
  // Create stock price data
  // Create old holding snapshot (1000 shares)
  // Create new holding snapshot (0 shares)
  
  const response = await request(app)
    .get('/api/stocks/recommendations')
    .expect(200);
  
  expect(stock.owned_shares).toBe(0);
  expect(stock.can_sell).toBe(false);
  expect(stock.unrealized_profit_value).toBeNull();
});
```

## Behavior Changes

### Before Fix
- User sells all shares of Stock A
- API no longer returns Stock A
- `fetchUserStockHoldings()` creates no new snapshot
- Database shows last snapshot: 1000 shares (1 hour ago)
- Recommendations API shows user owns 1000 shares ❌

### After Fix
- User sells all shares of Stock A
- API no longer returns Stock A
- `fetchUserStockHoldings()` detects Stock A was previously owned
- Creates new snapshot: 0 shares (now)
- Database shows latest snapshot: 0 shares (now)
- Recommendations API shows user owns 0 shares ✅

## Edge Cases Handled

1. **First run (no previous holdings)**: Works normally, no 0-share snapshots created
2. **User never owned stocks**: No snapshots created, no queries run
3. **Stock already at 0 shares**: Ignored (query filters for total_shares > 0)
4. **Multiple snapshots per stock**: Uses most recent via aggregation
5. **User sells all stocks**: Creates 0-share snapshot for each
6. **User sells some stocks**: Only creates 0-share snapshots for sold stocks

## Performance Impact

**Minimal:**
- Single aggregation query per run (uses indexes)
- Query only returns stocks with total_shares > 0 (typically small set)
- Runs every 30 minutes (low frequency)
- No impact on API endpoint performance

**Database:**
- Creates additional 0-share snapshots (minimal size ~100 bytes each)
- Still subject to 14-day TTL cleanup
- Negligible storage impact

## Logging

New log messages for visibility:

```
Fetching user stock holdings...
Stock 25 no longer owned, creating 0-share snapshot
Stock 13 no longer owned, creating 0-share snapshot
Successfully saved 30 user stock holding snapshots to database
```

## Rollback Plan

If issues arise, revert the single commit that modified:
- `API/src/services/backgroundFetcher.ts`

The changes are isolated to one function and don't affect:
- Database schema
- API endpoints
- Other background jobs
- Frontend code

## Verification

To verify the fix is working:

1. Check logs for "no longer owned" messages after selling stocks
2. Query database for 0-share snapshots:
   ```javascript
   db.userstockholdingsnapshots.find({ total_shares: 0 })
   ```
3. Call recommendations API and verify owned_shares is 0 for sold stocks
4. Verify no stale holdings appear in the UI

## Related Files

- `API/src/services/backgroundFetcher.ts` - Main fix
- `API/tests/userStockHoldings.test.ts` - New unit tests
- `API/tests/stocks.test.ts` - Updated integration tests
- `API/src/models/UserStockHoldingSnapshot.ts` - Model (unchanged)
- `API/src/routes/stocks.ts` - Endpoint (unchanged, works with fix)
