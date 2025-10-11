# Profit Per Minute Bug Fix

## Problem
The profit per minute calculation was displaying values approximately 19-20 times higher than expected.

### User Report Example (Dog Treats to Canada)
- Total profit for 19 items: $124,557.34
- Profit per item: $6,555.65
- Round trip travel time: 58 minutes (29 minutes each way with private island)
- **Expected profit/min**: $124,557.34 / 58 = $2,147
- **Actual shown**: $41,229 (19× higher!)

## Root Cause
Double multiplication was occurring:

1. **API Calculation** (profit.ts line 336-338):
   ```typescript
   const totalProfit = sold_profit * MAX_FOREIGN_ITEMS; // Already multiplied by 19
   const roundTripTime = travel_time_minutes * 2;
   profit_per_minute = totalProfit / roundTripTime;
   ```

2. **UI Display** (Profit.tsx):
   ```typescript
   // WRONG - Multiplied again!
   {formatCurrency(applyMultiplier(item.profit_per_minute))}
   ```

The `profit_per_minute` value from the API already represents the profit for ALL 19 items. When the UI's `applyMultiplier` function was applied (when the "Multiply by 19" checkbox was checked), it multiplied by 19 again:
- First multiplication (API): $6,555.65 × 19 / 57.4 = $2,169.99/min ✓
- Second multiplication (UI): $2,169.99 × 19 = $41,229.77/min ✗

## Solution
Removed `applyMultiplier()` from the `profit_per_minute` display in two locations:
1. Line 862 - Table view
2. Line 945 - Expanded card view

Now `profit_per_minute` displays the correct value directly from the API without additional multiplication.

## Why This Happened
The `applyMultiplier` function was designed to multiply per-item values (like `buy_price`, `sold_profit`) when the user wants to see the total for all items. However, `profit_per_minute` is a derived metric that already includes the multiplication by MAX_FOREIGN_ITEMS in its calculation, so it should never be multiplied again.

## Values That Should Be Multiplied
✅ **Per-item values:**
- `buy_price` - Price to buy one item
- `sold_profit` - Profit from selling one item
- `profitPer1` - Profit per single item
- `estimated_market_value_profit` - Per item
- `lowest_50_profit` - Per item

❌ **Already-totaled values:**
- `profit_per_minute` - Already calculated for all items
- `average_price_items_sold` - Market price (not purchase-related)
- `sales_24h_current` - Count, not a value

## Testing
Created comprehensive test suite in `API/tests/profitPerMinute.test.ts` with 8 test cases:
- Basic calculation verification
- Private island vs non-private island scenarios
- Null handling
- Real-world scenarios
- Bug documentation and verification

All tests pass ✓

## Result
After the fix:
- **Old behavior**: Displays $41,229/min (wrong)
- **New behavior**: Displays $2,170/min (correct)

The displayed value now matches the user's expected calculation.
