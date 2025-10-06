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
2. Retrieves stock price data for owned stocks
3. Calculates sell_score for each owned stock
4. Filters stocks with enough total value to cover the required amount
5. Sorts by sell_score descending (highest = best to sell)
6. Calculates shares to sell with -0.1 price buffer
7. Generates Torn.com sell URL

**Key Features:**
- Uses the existing stock recommendation scoring system (sell_score)
- Higher sell_score = better to sell (typically stocks that have increased in price)
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

1. `API/src/utils/stockSellHelper.ts` - New file (179 lines)
2. `API/src/jobs/monitorMarketPrices.ts` - Modified (+19 lines)
3. `API/tests/stockSellHelper.test.ts` - New file (242 lines)

Total changes: +440 lines of code and tests
