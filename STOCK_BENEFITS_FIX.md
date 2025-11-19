# Stock Benefits Calculation Fix

## Problem
The recommendation page was showing incorrect benefit calculations. Only one stock (those with money benefits) showed ROI and daily income, while item-based benefits were not calculating correctly.

## Root Cause
The benefit value calculation in `aggregateMarketHistory.ts` was not extracting the quantity multiplier from item benefit descriptions. For example:
- "1x Six Pack of Alcohol" was being treated as just the item price, not `1 * item_price`
- This caused all item-based stock benefits to have incorrect daily income and yearly ROI values

## Changes Made

### 1. Fixed Benefit Value Calculation (`API/src/jobs/aggregateMarketHistory.ts`)
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

### 2. Updated Stock Names (`API/scripts/seedStockBenefits.ts`)
Corrected stock names to match Torn City's actual stock names:
- ASS: "Asian Appreciation Stocks" → "Alcoholics Synonymous"
- ELT: "Elites Ltd" → "Empty Lunchbox Traders"
- EVL: "Evil Ducks Recruiting" → "Evil Ducks Candy Corp"
- CBD: "Herbal and High" → "Herbal Releaf Co."
- HRG: "Human Resources Group" → "Home Retail Group"
- IIL: "I Industries Ltd" → "I Industries Ltd."
- LAG: "Legal Aliens Group" → "Legal Authorities Group"
- LOS: "Logistics" → "Lo Squalo Waste Management"
- MSG: "Messaging Inc" → "Messaging Inc."
- PRN: "Porno Groove Magazine" → "Performance Ribaldry Network"
- PTS: "Points Building Society" → "PointLess"
- SYM: "Symbiotic Ltd" → "Symbiotic Ltd."
- TGP: "The Gentlemen's Club" → "Tell Group Plc."
- TSB: "The Torn Strip Bank" → "Torn & Shanghai Banking"
- TCC: "Torn Clothing Company" → "Torn City Clothing"
- THS: "Torn & Hospitalized Ltd." → "Torn City Health Service"
- WLT: "White Line Travel" → "Wind Lines Travel"
- YAZ: "Yazoo Ltd" → "Yazoo"

## Instructions to Apply the Fix

### Windows

1. Open a command prompt or PowerShell
2. Navigate to the API directory:
   ```cmd
   cd path\to\TornItems\API
   ```

3. Run the seed script:
   ```cmd
   npx ts-node scripts/seedStockBenefits.ts
   ```

4. Wait for the aggregation job to run (it runs hourly), OR manually trigger it by restarting the API server if you have that capability.

### What This Will Do

1. The seed script will update the StockBenefit table with the correct stock names
2. The next time the aggregation job runs (automatically every hour), it will:
   - Fetch the updated stock benefit data
   - Calculate daily income and yearly ROI using the fixed quantity extraction logic
   - Store the corrected values in the StockRecommendation table
3. The recommendation page will then display the correct benefit information for all stocks

## Expected Results

After running the seed script and waiting for the next aggregation:
- **All** stocks with Active benefits and item IDs will show daily income and yearly ROI
- Stock names will match Torn City's actual names
- Benefit calculations will be accurate based on current market prices

### Example Stocks That Should Now Show Values

- **ASS** (Alcoholics Synonymous): Should show daily income based on Six Pack of Alcohol price
- **EWM** (Eaglewood Mercenary): Should show daily income based on Box of Grenades price
- **FHG** (Feathery Hotels Group): Should show daily income based on Feathery Hotel Coupon price
- **LSC** (Lucky Shots Casino): Should show daily income based on Lottery Voucher price
- **MUN** (Munster Beverage Corp.): Should show daily income based on Six Pack of Energy Drink price
- **PRN** (Performance Ribaldry Network): Should show daily income based on Erotic DVD price
- **SYM** (Symbiotic Ltd.): Should show daily income based on Drug Pack price
- **THS** (Torn City Health Service): Should show daily income based on Box of Medical Supplies price

Stocks with money benefits (like CNC, GRN, IOU, TMI, TSB, TCT) should continue to work as before.

## Note

The seed script has already been run by you, but the stock names were incorrect. Running it again with the corrected names will update the database entries. The aggregation job will then use these updated names in its calculations.
