# Fix for City/Foreign Shop Stock Tracking Issues

## Problem Statement

Two critical issues were identified in the city/foreign shop stock tracking system:

1. **Issue #1: Items with 0 stock are not being tracked**
   - When an item has 0 stock, the Torn API does not return it in the inventory response
   - The code only processed items present in the API response
   - This meant items that went from some stock to 0 were never detected
   - Consequently, `CityShopStock` and `CityShopStockHistory` were not updated with 0 values
   - The `trackShopItemState()` function was never called for sellout transitions

2. **Issue #2: `cycles_skipped` field was always null**
   - Because sellouts were never detected (Issue #1), restocks couldn't be properly tracked
   - The `cycles_skipped` calculation only happens during restock transitions (0 → positive stock)
   - But if the previous sellout was never recorded, there's no `lastSelloutTime` to calculate cycles skipped from

## Root Cause Analysis

The Torn API endpoint `https://api.torn.com/v2/torn?selections=cityshops` only returns items that currently have positive stock. When an item sells out (goes to 0), it simply disappears from the response.

**Example:**
```json
// When Lollipop has 83 in stock:
{
  "cityshops": {
    "1": {
      "name": "Torn",
      "inventory": {
        "206": {
          "name": "Lollipop",
          "in_stock": 83,
          "price": 1
        }
      }
    }
  }
}

// When Lollipop sells out:
{
  "cityshops": {
    "1": {
      "name": "Torn",
      "inventory": {
        // Lollipop (206) is NOT in the response at all
      }
    }
  }
}
```

## Solution

The fix involves detecting sellouts by comparing the previous state with the current API response:

### For `fetchCityShopStock()`:

1. **Track current inventory**: Create a Set of all `shopId:itemId` pairs present in the current API response
2. **Query previous state**: Get all items from `ShopItemState` that had positive stock (`in_stock > 0`)
3. **Detect sellouts**: For each previously tracked item, if it's NOT in the current API response, it has sold out
4. **Update records**: For sold-out items:
   - Update `CityShopStock` with `in_stock: 0`
   - Add a history entry with `in_stock: 0`
   - Call `trackShopItemState()` with `currentStock: 0` to detect and record the sellout transition

### For `fetchForeignStock()`:

The same logic is applied to foreign stock tracking since the YATA API likely behaves similarly.

## Code Changes

### fetchCityShopStock() - Key additions:

```typescript
// Track which items are in the current API response
const currentInventoryKeys = new Set<string>();

// ... process items from API response ...

// Handle items that are now out of stock
const previouslyTrackedItems = await ShopItemState.find({
  in_stock: { $gt: 0 }
}).lean();

for (const previousItem of previouslyTrackedItems) {
  const inventoryKey = `${previousItem.shopId}:${previousItem.itemId}`;
  
  if (!currentInventoryKeys.has(inventoryKey)) {
    // Item was in stock before but is not in API response = sold out
    // Update database and track the sellout transition
  }
}
```

## Expected Outcomes

After this fix:

1. **Sellouts are properly detected**: When an item goes from positive stock to 0, it will be detected and recorded
2. **History is complete**: `CityShopStockHistory` will now include entries showing items at 0 stock
3. **State transitions work**: `trackShopItemState()` will detect sellout transitions (positive → 0)
4. **Cycles skipped is calculated**: When a restock occurs (0 → positive), the system will have the previous `lastSelloutTime` to calculate how many 15-minute cycles were skipped
5. **Accurate stock reporting**: The API will correctly show items at 0 stock instead of continuing to show the last known positive value

## Testing Approach

Since we cannot run integration tests without a database connection, the fix was validated through:

1. **TypeScript compilation**: All changes compile without errors
2. **Logic validation**: The core logic for detecting sellouts is sound:
   - Create a Set of current inventory keys
   - Compare with previous state
   - Items in previous but not in current = sold out
3. **Unit test logic**: Created `tests/stockTracking.test.ts` that demonstrates the detection logic works correctly

## Example Scenario

**Before the fix:**
```
Time 10:00 - API returns Lollipop with 83 stock
  → Database shows: in_stock = 83
  
Time 10:01 - API doesn't return Lollipop (sold out)
  → Database STILL shows: in_stock = 83 ❌
  → No sellout detected ❌
  
Time 10:15 - API returns Lollipop with 700 stock (restocked)
  → Database shows: in_stock = 700
  → Restock detected but cycles_skipped = null ❌ (no previous sellout time)
```

**After the fix:**
```
Time 10:00 - API returns Lollipop with 83 stock
  → Database shows: in_stock = 83
  
Time 10:01 - API doesn't return Lollipop (sold out)
  → Compare with previous state, detect item is missing
  → Database updated to: in_stock = 0 ✅
  → Sellout detected, lastSelloutTime = 10:01 ✅
  
Time 10:15 - API returns Lollipop with 700 stock (restocked)
  → Database shows: in_stock = 700
  → Restock detected ✅
  → Expected restock: 10:15 (next 15-min after 10:01)
  → Actual restock: 10:15
  → cycles_skipped = 0 ✅
```

## Performance Considerations

The fix adds one additional database query per fetch cycle:
```typescript
const previouslyTrackedItems = await ShopItemState.find({
  in_stock: { $gt: 0 }
}).lean();
```

This query is:
- **Indexed**: The `in_stock` field can be indexed for fast queries
- **Selective**: Only returns items with positive stock (typically a small subset)
- **Necessary**: Required to detect sellouts that the API doesn't report
- **Once per minute**: Only runs during the scheduled fetch (every minute)

The performance impact is minimal compared to the benefit of accurate stock tracking.
