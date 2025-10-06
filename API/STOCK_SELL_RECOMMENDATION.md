# Stock Sell Recommendation Implementation

## Overview
This implementation adds automatic stock sell recommendations to Discord market price alerts. When a cheap item is detected, the system now calculates which stock the user should sell to pay for it and includes a direct link to execute the sale.

## What Was Implemented

### 1. New Utility: `stockSellHelper.ts`
**File:** `API/src/utils/stockSellHelper.ts`

Core function that calculates the best stock to sell:
```typescript
export async function calculateBestStockToSell(requiredAmount: number): Promise<SellRecommendation | null>
```

**Logic Flow:**
1. Fetches user's current stock holdings from database
2. Retrieves stock price data for owned stocks (including benefit information)
3. Calculates sell_score for each owned stock
4. Filters stocks with enough total value to cover the required amount
5. **Filters out stocks where selling would cause loss of benefits**
6. Sorts by sell_score descending (highest = best to sell)
7. Calculates shares to sell with -0.1 price buffer
8. Generates Torn.com sell URL

**Key Features:**
- Uses the existing stock recommendation scoring system (sell_score)
- Higher sell_score = better to sell (typically stocks that have increased in price)
- **Preserves stock benefits by ensuring remaining shares meet benefit requirements**
- Adds price buffer of -0.1 to account for market fluctuations
- Caps shares at owned amount
- Returns null if no suitable stock found

### 2. Enhanced Market Monitoring Job
**File:** `API/src/jobs/monitorMarketPrices.ts` (modified)

Added integration with stock sell helper:
- Calculates best stock to sell when cheap item is found
- Adds sell recommendation to Discord alert message
- Gracefully handles cases where no stock is available

**New Alert Format:**
```
🚨 Cheap item found!
💊 Xanax listed at $819,000 (below $830,000)
<@123456789>
https://www.torn.com/page.php?sid=ItemMarket#/market/view=search&itemID=206

💰 To pay for it, sell 51 shares of Torn & Shanghai Banking (TSB):
https://www.torn.com/page.php?sid=stocks&stockID=25&tab=owned&sellamount=51
```

### 3. Tests
**File:** `API/tests/stockSellHelper.test.ts`

Comprehensive test suite covering:
- No stocks owned scenario
- Insufficient stock value scenario
- Multiple stocks with sell_score comparison
- Share calculation with price buffer
- Share capping at owned amount
- URL generation
- **Benefit preservation scenarios:**
  - Rejecting stock when selling would cause benefit loss (user has benefit)
  - Accepting stock with benefit when selling is safe (user keeps benefit)
  - Allowing stock sale when user doesn't currently have the benefit (NEW)
  - Choosing next best stock when primary choice would lose benefit
  - Preferring stocks by sell_score when both preserve benefits

## Technical Details

### Sell Score Calculation
The sell_score is calculated as the inverse of the buy score:
```typescript
sell_score = -score
```

Where score is:
```typescript
score = -change_7d_pct / volatility_7d_pct
```

A higher sell_score indicates:
- Stock price has increased (positive change_7d_pct)
- Lower volatility (more stable)
- Better candidate to sell to lock in gains

### Price Buffer
The code applies a -0.1 buffer to the current price when calculating shares:
```typescript
const adjustedPrice = Math.max(bestStock.price - 0.1, 0.01);
const sharesToSell = Math.ceil(requiredAmount / adjustedPrice);
```

This ensures enough shares are sold even if the price drops slightly between check time and execution.

### Benefit Preservation
**NEW:** The system now tracks and preserves stock benefits when recommending which stock to sell.

Stocks from the Torn API can have benefits that require a minimum number of shares:
```json
{
  "benefit": {
    "type": "passive",
    "frequency": 7,
    "requirement": 9000000,
    "description": "Private jet access"
  }
}
```

**Filtering Logic:**
```typescript
// For each stock, check if selling would cause benefit loss
if (stock.benefit && stock.benefit.requirement > 0) {
  // Only protect the benefit if we currently have it
  const currentlyHasBenefit = stock.owned_shares >= stock.benefit.requirement;
  
  if (currentlyHasBenefit) {
    const sharesToSell = Math.ceil(requiredAmount / adjustedPrice);
    const sharesAfterSale = stock.owned_shares - sharesToSell;
    
    // Exclude stock if remaining shares < requirement
    if (sharesAfterSale < stock.benefit.requirement) {
      return false; // Skip this stock
    }
  }
  // If we don't currently have the benefit, we can sell freely
}
```

**How It Works:**
1. When fetching stock prices from Torn API, benefit information is extracted and stored
2. When calculating best stock to sell, the system checks each stock's benefit requirement
3. **Only protects benefits the user currently has** (owned_shares >= requirement)
4. Stocks are filtered out if **they currently have the benefit** AND selling would drop shares below the threshold
5. Stocks without benefits OR stocks where the user doesn't yet have the benefit can be sold freely
6. Among viable stocks, the one with highest sell_score is chosen

**Example 1 - User Has Benefit:**
- Wind Lines Travel (WLT) requires 9,000,000 shares for "Private jet access"
- User owns 9,100,000 shares at $775.38 each (HAS benefit)
- Need $100,000,000 to buy an item
- Would require selling ~129,000 shares
- After sale: 9,100,000 - 129,000 = 8,971,000 shares (below requirement)
- **Result:** WLT is excluded from recommendations to preserve the benefit
- System recommends next best stock without benefit loss risk

**Example 2 - User Doesn't Have Benefit:**
- Wind Lines Travel (WLT) requires 9,000,000 shares for "Private jet access"
- User owns 5,000,000 shares at $775.38 each (does NOT have benefit)
- Need $100,000,000 to buy an item
- Would require selling ~129,000 shares
- After sale: 5,000,000 - 129,000 = 4,871,000 shares (still below requirement)
- **Result:** WLT can be recommended since there's no benefit to lose
- User can sell freely while building up to the benefit threshold

### URL Format
The generated URL follows Torn.com's stock selling interface:
```
https://www.torn.com/page.php?sid=stocks&stockID={id}&tab=owned&sellamount={shares}
```

Parameters:
- `stockID`: The stock's unique identifier
- `sellamount`: Number of shares to sell

## Example Scenarios

### Scenario 1: Single Stock Available
- Item cost: $1,000,000
- Owned: 100 shares of TSB at $10,500 each
- Total value: $1,050,000
- Shares needed: ceil($1,000,000 / $10,499.9) = 96 shares
- Result: Sell 96 shares of TSB

### Scenario 2: Multiple Stocks Available
- Item cost: $500,000
- Stock A: 50 shares at $15,000 (sell_score: 1.5)
- Stock B: 100 shares at $8,000 (sell_score: 2.8)
- Result: Sell Stock B (higher sell_score) - 63 shares

### Scenario 3: No Suitable Stock
- Item cost: $5,000,000
- Owned: 10 shares at $10,000 (total: $100,000)
- Result: No sell recommendation shown

### Scenario 4: Benefit Preservation (NEW)
- Item cost: $100,000,000
- Stock 1 (WLT): 9,100,000 shares at $775.38, requires 9,000,000 for benefit
  - Would need to sell ~129,000 shares
  - Remaining: 8,971,000 shares (below 9,000,000 requirement)
  - **Excluded to preserve benefit**
- Stock 2 (TSB): 500,000 shares at $10,500, no benefit
  - Would need to sell ~9,525 shares
  - Has enough value
  - **Recommended** even though sell_score is lower

## Error Handling

The implementation gracefully handles:
- No stocks owned (returns null)
- No stock with sufficient value (returns null)
- Missing stock price data (returns null)
- Database errors (catches and logs, returns null)

When null is returned, the Discord alert is sent without the sell recommendation section.

## Performance Considerations

- Uses MongoDB aggregation for efficient data retrieval
- Reuses existing stock price snapshots (no additional API calls)
- Minimal overhead: ~2-3 DB queries per alert
- Asynchronous execution doesn't block alert sending

## Future Enhancements

Potential improvements:
- Consider tax implications when selecting stocks to sell
- Support for partial sells from multiple stocks
- Include profit/loss information in recommendation
- Allow user preferences for which stocks to prioritize
- Cache recent calculations to avoid redundant DB queries

## Testing

### Unit Tests
Run tests with:
```bash
npm test -- stockSellHelper.test.ts
```

Note: Tests require MongoDB connection (handled by test setup).

### Manual Testing
To manually test the feature:
1. Ensure stock holdings data is populated
2. Add an item to the market watchlist
3. Wait for price monitoring to trigger
4. Check Discord for alert with sell recommendation

## Dependencies

No new dependencies added. Uses existing:
- Mongoose (database queries)
- Stock calculation utilities (sell_score)
- Discord alert system

## Files Changed

**Original Implementation:**
1. `API/src/utils/stockSellHelper.ts` - New file (179 lines)
2. `API/src/jobs/monitorMarketPrices.ts` - Modified (+19 lines)
3. `API/tests/stockSellHelper.test.ts` - New file (242 lines)

**Benefit Preservation Update:**
1. `API/src/models/StockPriceSnapshot.ts` - Modified (+17 lines for benefit field)
2. `API/src/services/backgroundFetcher.ts` - Modified (+13 lines to extract benefits)
3. `API/src/utils/stockSellHelper.ts` - Modified (+28 lines for benefit filtering)
4. `API/tests/stockSellHelper.test.ts` - Modified (+208 lines for benefit tests)

Total changes: +706 lines of code and tests
