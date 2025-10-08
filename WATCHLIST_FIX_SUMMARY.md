# Market Watchlist Quantity Display Fix

## Problem
The Discord bot's market watchlist feature was always showing "1x" for items, regardless of how many were actually available on the market. Additionally, the quantity options were limited to simple sequential values (1x, 2x, 3x, 4x, 5x), which wasn't useful for items with high availability.

## Root Causes

### Bug 1: Incorrect Property Access
**File:** `API/src/jobs/monitorMarketPrices.ts` (Line 134)

The code was using `lowestListing.quantity` but the API returns `lowestListing.amount`:

```typescript
// BEFORE (Incorrect)
const availableQuantity = lowestListing.quantity || 1;  // Always defaulted to 1

// AFTER (Correct)
const availableQuantity = lowestListing.amount || 1;  // Reads actual amount from API
```

**API Response Example:**
```json
{
  "itemmarket": {
    "listings": [
      {
        "price": 1895,
        "amount": 100  // ← This is the correct property name
      }
    ]
  }
}
```

### Bug 2: No Smart Interval Logic
**File:** `API/src/jobs/monitorMarketPrices.ts` (Lines 119-126)

The code was showing simple sequential quantities (1, 2, 3, 4, 5), which wasn't helpful for items with 100+ available:

```typescript
// BEFORE (Simple sequential)
for (let qty = 1; qty <= Math.min(availableQuantity, 5); qty++) {
  // This gave: [1, 2, 3, 4, 5] even for 100 items available
}

// AFTER (Smart intervals)
const quantities = calculateQuantityIntervals(availableQuantity);
for (const qty of quantities) {
  // This gives: [1, 20, 40, 60, 80, 100] for 100 items available
}
```

## Solution

### New Function: `calculateQuantityIntervals()`

This function intelligently calculates purchase quantity options:

**For 5 or fewer items:** Sequential values
- 1 item available → [1]
- 3 items available → [1, 2, 3]
- 5 items available → [1, 2, 3, 4, 5]

**For more than 5 items:** Evenly spaced intervals
- 6 items available → [1, 2, 3, 4, 6]
- 20 items available → [1, 4, 8, 12, 16, 20]
- 50 items available → [1, 10, 20, 30, 40, 50]
- 82 items available → [1, 16, 32, 48, 64, 82]
- 100 items available → [1, 20, 40, 60, 80, 100] ✓ (matches requirement)

**Algorithm:**
1. Always include 1 (minimum purchase)
2. Calculate step size: `floor(availableQuantity / 5)`
3. Add intervals at step multiples (step × 1, step × 2, step × 3, step × 4)
4. Always include the maximum available quantity

## Example Output

### Before Fix
```
💊 1x Gasoline at $1,895 each (below $2,000)
<@user123>
https://www.torn.com/page.php?sid=ItemMarket#/market/view=search&itemID=172

💰 Click here to sell stocks to buy:
1x (score: 85.23) - $1,895 - https://www.torn.com/...
2x (score: 85.23) - $3,790 - https://www.torn.com/...
3x (score: 85.23) - $5,685 - https://www.torn.com/...
4x (score: 85.23) - $7,580 - https://www.torn.com/...
5x (score: 85.23) - $9,475 - https://www.torn.com/...
```

### After Fix
```
💊 100x Gasoline at $1,895 each (below $2,000)
<@user123>
https://www.torn.com/page.php?sid=ItemMarket#/market/view=search&itemID=172

💰 Click here to sell stocks to buy:
1x (score: 85.23) - $1,895 - https://www.torn.com/...
20x (score: 85.23) - $37,900 - https://www.torn.com/...
40x (score: 85.23) - $75,800 - https://www.torn.com/...
60x (score: 85.23) - $113,700 - https://www.torn.com/...
80x (score: 85.23) - $151,600 - https://www.torn.com/...
100x (score: 85.23) - $189,500 - https://www.torn.com/...
```

## Benefits

1. **Accurate Quantity Display:** Users now see the actual available quantity (e.g., "100x" instead of "1x")
2. **Smart Purchase Options:** For high-volume items, users get meaningful interval options
3. **Better Investment Decisions:** Users can see stock recommendations for larger purchases
4. **Maintains Simplicity:** For low-volume items (≤5), still shows simple sequential options

## Testing

Added comprehensive unit tests in `API/tests/monitorMarketPrices.test.ts`:
- ✅ Correct intervals for 1, 3, 5 items (sequential)
- ✅ Correct intervals for 6, 20, 50, 82, 97, 100 items (smart intervals)
- ✅ No duplicate values
- ✅ Always includes 1 as first value
- ✅ Always includes max as last value
- ✅ Lint passes
- ✅ Build succeeds

## Files Changed

1. **API/src/jobs/monitorMarketPrices.ts**
   - Fixed `lowestListing.quantity` → `lowestListing.amount`
   - Added `calculateQuantityIntervals()` function
   - Updated quantity loop to use smart intervals

2. **API/tests/monitorMarketPrices.test.ts** (new file)
   - Comprehensive test coverage for interval calculation
   - Tests for edge cases and various amounts
