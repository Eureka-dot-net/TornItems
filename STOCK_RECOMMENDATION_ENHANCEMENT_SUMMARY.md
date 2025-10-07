# Stock Recommendation Enhancement Summary

## Overview
This implementation adds benefit preservation logic to the stock recommendations endpoint and creates a new endpoint for getting the top recommended stock to sell.

## Changes Made

### 1. Enhanced `/api/stocks/recommendations` Endpoint

#### New Fields Added
- **`can_sell`** (boolean): Indicates whether the user can sell this stock without losing benefits
  - `true` if user owns shares and can sell at least 1 share without losing benefits
  - `false` if user owns no shares OR has benefit and is at/below the requirement threshold

- **`max_shares_to_sell`** (number): Maximum number of shares that can be sold while preserving benefits
  - If no benefit OR user doesn't have the benefit: equals `owned_shares` (can sell all)
  - If user has the benefit: equals `owned_shares - benefit_requirement` (preserve minimum for benefit)
  - If at exact requirement: equals `0` (cannot sell any without losing benefit)

#### Logic
```typescript
if (ownedShares > 0 && benefitRequirement && benefitRequirement > 0) {
  const currentlyHasBenefit = ownedShares >= benefitRequirement;
  
  if (currentlyHasBenefit) {
    // User has the benefit, can only sell shares above the requirement
    maxSharesToSell = Math.max(0, ownedShares - benefitRequirement);
    canSell = maxSharesToSell > 0;
  }
  // If we don't have the benefit, we can sell all shares freely
}
```

### 2. New `/api/stocks/recommendations/top-sell` Endpoint

#### Description
Returns the single best stock to sell based on `sell_score`, with benefit preservation logic applied.

#### Response
Returns a single stock object with all the same fields as the recommendations endpoint:
- `stock_id`, `ticker`, `name`
- `price`, `change_7d_pct`, `volatility_7d_pct`
- `score`, `sell_score`, `recommendation`
- `owned_shares`, `avg_buy_price`
- `unrealized_profit_value`, `unrealized_profit_pct`
- `can_sell`, `max_shares_to_sell`

#### Logic
1. Fetches all owned stocks
2. Calculates sell scores for each
3. Filters to only sellable stocks (`can_sell: true`)
4. Sorts by `sell_score` descending (highest first)
5. Returns the top stock

#### Error Cases
- **404 "No stocks owned"**: User has no stocks in their portfolio
- **404 "No sellable stocks found"**: User owns stocks but none can be sold (all at benefit thresholds)
- **503 "No stock data found"**: Stock price data not available (background fetcher issue)

## Examples

### Example 1: Stock Without Benefit
```json
{
  "stock_id": 5,
  "ticker": "TSB",
  "name": "Torn & Shanghai Banking",
  "owned_shares": 1000,
  "can_sell": true,
  "max_shares_to_sell": 1000
}
```
User can sell all 1,000 shares.

### Example 2: Stock With Benefit - User Has It
```json
{
  "stock_id": 30,
  "ticker": "WLT",
  "name": "Wind Lines Travel",
  "owned_shares": 9100000,
  "benefit_requirement": 9000000,
  "can_sell": true,
  "max_shares_to_sell": 100000
}
```
User has the benefit (owns 9.1M, needs 9M). Can sell up to 100k shares while keeping benefit.

### Example 3: Stock With Benefit - At Exact Requirement
```json
{
  "stock_id": 30,
  "ticker": "WLT",
  "name": "Wind Lines Travel",
  "owned_shares": 9000000,
  "benefit_requirement": 9000000,
  "can_sell": false,
  "max_shares_to_sell": 0
}
```
User has exactly the minimum (9M). Cannot sell any without losing benefit.

### Example 4: Stock With Benefit - Below Requirement
```json
{
  "stock_id": 30,
  "ticker": "WLT",
  "name": "Wind Lines Travel",
  "owned_shares": 5000000,
  "benefit_requirement": 9000000,
  "can_sell": true,
  "max_shares_to_sell": 5000000
}
```
User doesn't have the benefit yet (owns 5M, needs 9M). Can sell all shares freely.

## Testing

### Tests Added
1. **Can sell without benefit**: Verifies all shares can be sold when no benefit exists
2. **Can sell with benefit**: Verifies correct max_shares_to_sell when user has benefit
3. **Cannot sell at exact requirement**: Verifies can_sell is false when at threshold
4. **Can sell all when below requirement**: Verifies full sale allowed when benefit not attained
5. **Top-sell endpoint with no stocks**: Verifies 404 error
6. **Top-sell returns highest sell_score**: Verifies correct sorting
7. **Top-sell excludes unsellable stocks**: Verifies benefit preservation in filtering
8. **Top-sell with all unsellable stocks**: Verifies 404 when nothing can be sold

## Files Modified
1. `/API/src/routes/stocks.ts` - Added logic to both endpoints
2. `/API/tests/stocks.test.ts` - Added comprehensive test coverage

## Compatibility
- Fully backward compatible
- No breaking changes to existing API
- New fields added to existing endpoint
- New endpoint is optional to use

## Benefits
1. **Prevents accidental benefit loss**: Users won't lose stock benefits by selling too much
2. **Clear visibility**: Users can see exactly how much they can sell safely
3. **Quick decisions**: Top-sell endpoint provides instant recommendation
4. **Consistent with Discord bot**: Same logic as existing benefit preservation feature
