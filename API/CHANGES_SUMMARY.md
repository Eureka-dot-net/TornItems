# Summary of Changes

## Issues Fixed

### Issue 1: Items with 0 stock not being tracked
**Problem:** The Torn API doesn't return items with 0 stock in the response. Our code only processed items present in the API response, so items that sold out were never detected.

**Impact:**
- Lollipop shows 83 in stock in database even though it's actually 0
- `CityShopStockHistory` never gets updated when items sell out
- Sellout transitions are never detected

**Fix:** 
- Query `ShopItemState` for all items that previously had stock
- Compare with current API response
- For items not in the response, update their stock to 0 and track the sellout transition

### Issue 2: cycles_skipped always null
**Problem:** Because sellouts were never detected (Issue 1), the `lastSelloutTime` was never recorded. When items restocked, the `cyclesSkipped` calculation couldn't work because it needs the previous sellout time.

**Impact:**
- Items that restock every 15 minutes show `cycles_skipped: null`
- Cannot track how many restock cycles are being skipped
- Analytics and monitoring features don't work properly

**Fix:**
- By fixing Issue 1, sellouts are now detected and `lastSelloutTime` is recorded
- When restocks occur, `cyclesSkipped` is calculated based on the recorded `lastSelloutTime`
- The calculation: `cyclesSkipped = max(0, round((actualRestockTime - expectedRestockTime) / 15 minutes))`

## Code Changes

### `fetchCityShopStock()` in `backgroundFetcher.ts`

**Added:**
1. Track current inventory keys (line 155)
2. Query previously tracked items with positive stock (lines 211-214)
3. Detect items not in current response and update them to 0 stock (lines 216-257)
4. Filter to only city shop items, excluding foreign shops (line 213)

### `fetchForeignStock()` in `backgroundFetcher.ts`

**Added:**
Same logic as city shops, but:
1. Track foreign inventory keys
2. Query previously tracked foreign items
3. Filter to only country codes from COUNTRY_CODE_MAP

## Files Modified

- `API/src/services/backgroundFetcher.ts` - Main fix implementation
- `API/STOCK_TRACKING_FIX.md` - Detailed documentation of the fix
- `API/tests/stockTracking.test.ts` - Unit tests demonstrating the logic

## How It Works Now

### Before:
```
10:00 - API returns: Lollipop = 83
        Database: in_stock = 83 ✓

10:01 - API returns: (no Lollipop - sold out)
        Database: in_stock = 83 ✗ (stale)
        lastSelloutTime: (not set) ✗

10:15 - API returns: Lollipop = 700 (restocked)
        Database: in_stock = 700 ✓
        cycles_skipped: null ✗ (can't calculate without sellout time)
```

### After:
```
10:00 - API returns: Lollipop = 83
        Database: in_stock = 83 ✓

10:01 - API returns: (no Lollipop - sold out)
        Our code detects: Lollipop was at 83, now missing
        Database: in_stock = 0 ✓
        lastSelloutTime: 10:01 ✓
        Log: "[Sellout] Lollipop sold out in 1.0 min"

10:15 - API returns: Lollipop = 700 (restocked)
        Our code detects: Lollipop was at 0, now 700
        Database: in_stock = 700 ✓
        expectedRestockTime: 10:15 (next 15-min after 10:01)
        actualRestockTime: 10:15
        cycles_skipped: 0 ✓
        Log: "[Restock] Lollipop restocked after skipping 0 cycles"
```

## Testing

The fix has been validated through:

1. **TypeScript compilation**: All changes compile without errors
2. **Logic validation**: The core detection logic is sound and tested in `stockTracking.test.ts`
3. **Code review**: Implementation follows existing patterns and handles edge cases

## Performance Impact

Minimal - adds one additional MongoDB query per fetch cycle:
- Query: `ShopItemState.find({ in_stock: { $gt: 0 }, shopId: { $nin: [...] } })`
- Frequency: Once per minute (during scheduled fetch)
- Typical result size: Small (only items currently in stock)
- Index: Can be optimized with index on `in_stock` field

## Next Steps

After deployment:
1. Monitor logs for `[Sellout]` and `[Restock]` messages
2. Verify `cycles_skipped` is being populated for items that restock
3. Check that `CityShopStockHistory` includes entries with `in_stock: 0`
4. Confirm API responses show accurate stock levels (0 when sold out)
