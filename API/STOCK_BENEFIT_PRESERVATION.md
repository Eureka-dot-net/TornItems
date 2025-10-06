# Stock Benefit Preservation Feature

## Overview
This feature prevents the stock sell recommendation system from suggesting sales that would cause you to lose valuable stock benefits.

## What Are Stock Benefits?

Some stocks in Torn provide passive benefits when you hold a certain number of shares. For example:

**Wind Lines Travel (WLT)**
```json
{
  "stock_id": 30,
  "name": "Wind Lines Travel",
  "acronym": "WLT",
  "current_price": 775.38,
  "benefit": {
    "type": "passive",
    "frequency": 7,
    "requirement": 9000000,
    "description": "Private jet access"
  }
}
```

To keep the "Private jet access" benefit, you must maintain at least **9,000,000 shares** of WLT.

## The Problem (Before This Feature)

Before this implementation, the sell recommendation system would:
1. Look at your stocks
2. Find the one with the best sell_score
3. Recommend selling it without checking if you'd lose benefits

**Example Problem:**
- You own 9,100,000 WLT shares (just above the 9M requirement)
- System recommends selling 200,000 shares to buy an item
- After selling: 8,900,000 shares remaining
- **You lose your private jet access!** ✈️❌

## The Solution (How It Works Now)

The system now:
1. ✅ Fetches stock data including benefit requirements from Torn API
2. ✅ Stores benefit information in the database
3. ✅ Checks if selling would drop you below the requirement
4. ✅ Filters out stocks where benefits would be lost
5. ✅ Recommends the next best stock that's safe to sell

## Implementation Details

### 1. Data Model Enhancement

**StockPriceSnapshot** now includes:
```typescript
interface IStockBenefit {
  type: string;           // e.g., "passive"
  frequency: number;      // How often benefit applies
  requirement: number;    // Minimum shares needed
  description: string;    // e.g., "Private jet access"
}

interface IStockPriceSnapshot {
  stock_id: number;
  ticker: string;
  name: string;
  price: number;
  benefit?: IStockBenefit | null;  // NEW!
  timestamp: Date;
}
```

### 2. Background Fetcher Update

When fetching stock prices every 30 minutes:
```typescript
for (const [stockId, stockData] of Object.entries(stocks)) {
  // Extract benefit information if available
  let benefit = null;
  if (stockData.benefit && stockData.benefit.requirement) {
    benefit = {
      type: stockData.benefit.type || '',
      frequency: stockData.benefit.frequency || 0,
      requirement: stockData.benefit.requirement || 0,
      description: stockData.benefit.description || ''
    };
  }
  
  // Store with stock price data
  await StockPriceSnapshot.create({
    stock_id: stockId,
    ticker: stockData.acronym,
    name: stockData.name,
    price: stockData.current_price,
    benefit: benefit,  // Stored for later use
    timestamp: new Date()
  });
}
```

### 3. Sell Recommendation Logic

When calculating best stock to sell:
```typescript
const affordableStocks = recommendations.filter(stock => {
  // Check if stock has enough value
  if (stock.total_value < requiredAmount) {
    return false;
  }
  
  // NEW: Check benefit preservation
  if (stock.benefit && stock.benefit.requirement > 0) {
    // Only protect the benefit if we currently have it
    const currentlyHasBenefit = stock.owned_shares >= stock.benefit.requirement;
    
    if (currentlyHasBenefit) {
      // Calculate how many shares would be sold
      const adjustedPrice = Math.max(stock.price - 0.1, 0.01);
      const sharesToSell = Math.ceil(requiredAmount / adjustedPrice);
      const sharesAfterSale = stock.owned_shares - sharesToSell;
      
      // Exclude if would drop below requirement
      if (sharesAfterSale < stock.benefit.requirement) {
        return false;  // Skip this stock!
      }
    }
    // If we don't currently have the benefit, we can sell freely
  }
  
  return true;
});
```

## Real-World Examples

### Example 1: Benefit Would Be Lost ❌

**Setup:**
- Need: $100,000,000 for a cheap item
- WLT shares owned: 9,100,000
- WLT price: $775.38
- Benefit requirement: 9,000,000 shares

**Calculation:**
- Shares to sell: $100,000,000 / $775.28 ≈ 129,000 shares
- Shares after sale: 9,100,000 - 129,000 = **8,971,000 shares**
- Is 8,971,000 < 9,000,000? **YES**
- **Result: WLT is excluded from recommendations**

### Example 2: Benefit Preserved ✅

**Setup:**
- Need: $1,000,000 for a cheap item
- WLT shares owned: 10,000,000
- WLT price: $775.38
- Benefit requirement: 9,000,000 shares

**Calculation:**
- Shares to sell: $1,000,000 / $775.28 ≈ 1,290 shares
- Shares after sale: 10,000,000 - 1,290 = **9,998,710 shares**
- Is 9,998,710 < 9,000,000? **NO**
- **Result: WLT can be recommended if it has best sell_score**

### Example 3: Choose Alternative Stock

**Setup:**
- Need: $50,000,000
- Stock A (WLT): 9,050,000 shares, sell_score: 2.5, has benefit (req: 9M)
- Stock B (TSB): 500,000 shares, sell_score: 1.8, no benefit

**Without benefit check:**
- Would recommend WLT (higher sell_score)
- After selling: 8,985,000 shares (lose benefit ❌)

**With benefit check:**
- WLT excluded (would lose benefit)
- Recommends TSB instead (safe to sell ✅)
- User keeps their WLT benefit

### Example 4: No Benefit to Lose ✅ (NEW)

**Setup:**
- Need: $100,000,000 for a cheap item
- WLT shares owned: 5,000,000
- WLT price: $775.38
- Benefit requirement: 9,000,000 shares

**Calculation:**
- User currently has: 5,000,000 shares
- Benefit requirement: 9,000,000 shares
- Currently has benefit? **NO** (5M < 9M)
- Shares to sell: $100,000,000 / $775.28 ≈ 129,000 shares
- Shares after sale: 5,000,000 - 129,000 = **4,871,000 shares**

**Result:**
- User doesn't currently have the benefit (5M < 9M requirement)
- Since there's no benefit to lose, WLT can be recommended
- **WLT is allowed to be sold freely** ✅

This ensures users who are building up to a benefit (but haven't reached it yet) can still sell their shares when needed.

## Testing

The test suite includes 5 scenarios:

1. **Reject stock when benefit would be lost**
   - Verifies stock is excluded when selling drops below requirement AND user currently has benefit

2. **Accept stock when benefit is safe**
   - Verifies stock is recommended when enough shares remain

3. **Prefer by sell_score when both safe**
   - Verifies normal scoring applies when no benefit risk

4. **Skip to next best when primary unsafe**
   - Verifies fallback to lower-scored stock when top choice risky

5. **Allow selling when user doesn't have benefit** (NEW)
   - Verifies stock can be sold freely if user doesn't currently meet benefit requirement

Run tests:
```bash
npm test -- stockSellHelper.test.ts
```

## Database Impact

**Storage:** Minimal overhead
- Benefit is stored as nested object in existing StockPriceSnapshot documents
- Only stocks with benefits have non-null values
- Most stocks have no benefits, so benefit field is null
- Estimated: ~5-10 stocks have benefits out of ~32 total stocks

**Performance:** No significant impact
- Benefit data is fetched in same aggregation query
- No additional database calls
- Filtering happens in-memory after data retrieval

## Future Considerations

### Potential Enhancements
1. **User Preferences:** Allow users to mark certain benefits as "must keep"
2. **Benefit Value:** Calculate monetary value of benefits vs. selling
3. **Warnings:** Alert user when they're getting close to benefit thresholds
4. **Multiple Benefits:** Handle stocks with multiple benefit tiers

### Known Limitations
1. Only prevents loss when selling for cheap items
2. Doesn't prevent manual sales that lose benefits
3. Assumes all benefits are equally valuable
4. Doesn't account for temporary vs. permanent benefits

## Summary

✅ **What's New:**
- Stock benefits are now tracked and stored
- Sell recommendations preserve stock benefits
- Comprehensive tests ensure benefit protection works

✅ **Benefits:**
- Never accidentally lose valuable stock benefits
- Smarter stock sell recommendations
- Transparent filtering logic

✅ **No Breaking Changes:**
- Backward compatible (benefit field is optional)
- Existing functionality unchanged
- Only adds protective filtering layer
