# Stock Benefits Calculation Fix

## Problem
The recommendation page was showing incorrect benefit calculations. Benefits were mismatched to the wrong stocks (e.g., ASS showing "10% Bank Interest Bonus" instead of "1x Six Pack of Alcohol").

## Root Cause
**CRITICAL ISSUE DISCOVERED**: The stock benefits were being matched by `stock_id`, but the `stock_id` values from Torn's API are different from the IDs we assumed in the seed script. This caused benefits to be assigned to completely wrong stocks:
- ASS (Alcoholics Synonymous) was showing TCI's benefit (10% Bank Interest Bonus)
- BAG (Big Al's Gun Shop) was showing MCS's benefit (100 Energy)  
- CNC (Crude & Co) was showing THS's benefit (1x Box of Medical Supplies)

Additionally, the benefit value calculation was not extracting the quantity multiplier from item benefit descriptions (e.g., "1x" in "1x Six Pack of Alcohol").

## Changes Made

### 1. Fixed Benefit Matching (`API/src/jobs/aggregateMarketHistory.ts`)
**Changed from stock_id matching to ticker matching:**

**Before:**
```typescript
const benefitsMap: Record<number, any> = {};
for (const benefit of stockBenefits) {
  benefitsMap[benefit.stock_id] = { ... };
}
// Later:
const benefit = benefitsMap[stockId];  // ❌ Wrong! stock_id from API doesn't match seed script
```

**After:**
```typescript
const benefitsMap: Record<string, any> = {};
for (const benefit of stockBenefits) {
  benefitsMap[benefit.ticker] = { ... };  // ✅ Use ticker instead
}
// Later:
const benefit = benefitsMap[ticker];  // ✅ Ticker is consistent across API and seed script
```

### 2. Fixed Benefit Value Calculation (`API/src/jobs/aggregateMarketHistory.ts`)
Updated the benefit value extraction logic to:
- Extract quantity from descriptions like "1x Six Pack of Alcohol" (extracts "1" from "1x")
- Multiply the item's market price by this quantity
- This now correctly calculates daily income and yearly ROI for all item-based benefits

**Code change:**
```typescript
// Check if it's an item benefit
else if (benefitItemId && itemPricesMap[benefitItemId]) {
  // Extract quantity from description (e.g., "1x Six Pack of Alcohol" -> 1)
  let quantity = 1;
  const quantityMatch = benefitDescription.match(/^(\d+)x\s/);
  if (quantityMatch) {
    quantity = parseInt(quantityMatch[1], 10);
  }
  benefitValue = itemPricesMap[benefitItemId] * quantity;
}
```

### 3. Updated Stock Names (`API/scripts/seedStockBenefits.ts`)
Corrected stock names to match Torn City's actual stock names (18 stocks updated).

## Instructions to Apply the Fix

### Windows

1. Open a command prompt or PowerShell
2. Navigate to the API directory:
   ```cmd
   cd path\to\TornItems\API
   ```

3. **IMPORTANT**: The seed script data is already correct. The issue was in the matching logic, not the seed data. You don't need to re-run the seed script unless you want to update the stock names.

4. Wait for the next hourly aggregation job to run, OR manually trigger it by restarting the API server.

### What This Will Do

1. The next time the aggregation job runs (automatically every hour), it will:
   - Match stock benefits by ticker (e.g., "ASS", "BAG", "CNC") instead of stock_id
   - Calculate daily income and yearly ROI using the fixed quantity extraction logic
   - Store the correctly matched values in the StockRecommendation table
2. The recommendation page will then display the correct benefit information for all stocks

## Expected Results

After the next aggregation:
- **All** stocks will show their correct benefits
- **All** stocks with Active benefits and item IDs will show daily income and yearly ROI
- Stock names will match Torn City's actual names (if seed script was re-run)
- Benefit calculations will be accurate based on current market prices

### Example of What Will Be Fixed

**Before (incorrect matching):**
- **ASS** (Alcoholics Synonymous): Showing "10% Bank Interest Bonus" ❌
- **BAG** (Big Al's Gun Shop): Showing "100 Energy" ❌
- **CNC** (Crude & Co): Showing "1x Box of Medical Supplies" ❌

**After (correct matching):**
- **ASS** (Alcoholics Synonymous): Showing "1x Six Pack of Alcohol" ✅
- **BAG** (Big Al's Gun Shop): Showing "1x Ammunition Pack (Special Ammo)" ✅
- **CNC** (Crude & Co): Showing "$80,000,000" ✅

### Stocks That Will Show Daily Income and Yearly ROI

With both fixes applied:

- **ASS** (Alcoholics Synonymous) - Six Pack of Alcohol (item_id: 817) ✅
- **EWM** (Eaglewood Mercenary) - Box of Grenades (item_id: 364) ✅
- **FHG** (Feathery Hotels Group) - Feathery Hotel Coupon (item_id: 367) ✅
- **LSC** (Lucky Shots Casino) - Lottery Voucher (item_id: 369) ✅
- **MUN** (Munster Beverage Corp.) - Six Pack of Energy Drink (item_id: 818) ✅
- **PRN** (Performance Ribaldry Network) - Erotic DVD (item_id: 366) ✅
- **SYM** (Symbiotic Ltd.) - Drug Pack (item_id: 370) ✅
- **THS** (Torn City Health Service) - Box of Medical Supplies (item_id: 365) ✅

Plus all money-based benefits (CNC, GRN, IOU, TMI, TSB, TCT) ✅

## Technical Details

The ticker-based matching is reliable because:
1. Tickers are unique identifiers in Torn City (e.g., "ASS", "BAG", "CNC")
2. Tickers are consistent in both the Torn API and our seed script
3. stock_id values can vary between different sources and aren't reliable for matching

## Note

No seed script re-run is required for the benefit matching fix to work. The aggregation job will automatically use the correct matching logic on its next run.
