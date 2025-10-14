# Points Market Monitoring Feature

## Overview
Added support for monitoring the Torn.com points market through the Discord bot's market watch system. Users can now watch for cheap point listings using itemId `0` or the name "points".

## What Changed

### 1. Discord Command: `/addwatch`
**File:** `API/src/discord/commands/addwatch.ts`

Users can now add the points market to their watchlist using:
- `/addwatch itemid:0 price:30000` - Using itemId 0
- `/addwatch name:points price:30000` - Using name "points"

The command automatically recognizes both "points" and "point" (case-insensitive) and maps them to itemId 0 with the name "Points".

### 2. Market Price Monitoring Job
**File:** `API/src/jobs/monitorMarketPrices.ts`

Enhanced the monitoring job to handle two different market types:

#### Points Market (itemId 0)
- **API Endpoint:** `https://api.torn.com/v2/market?selections=pointsmarket&limit=20&key={apiKey}`
- **Response Format:**
  ```json
  {
    "pointsmarket": {
      "18588311": {
        "cost": 30350,
        "quantity": 30,
        "total_cost": 910500
      },
      "18588312": {
        "cost": 30350,
        "quantity": 30,
        "total_cost": 910500
      }
    }
  }
  ```
- **Alert URL:** `https://www.torn.com/pmarket.php`
- **Quantity Options:** Only shows full quantity (no partial purchases allowed)

#### Regular Item Market
- **API Endpoint:** `https://api.torn.com/v2/market/{itemId}/itemmarket?limit=20&key={apiKey}`
- **Alert URL:** `https://www.torn.com/page.php?sid=ItemMarket#/market/view=search&itemID={itemId}`
- **Quantity Options:** Smart intervals (1, 25%, 50%, 75%, 100% of available)

## Key Differences: Points vs Items

| Feature | Points Market | Item Market |
|---------|--------------|-------------|
| Item ID | 0 | 1-999999 |
| API Endpoint | `/v2/market?selections=pointsmarket` | `/v2/market/{id}/itemmarket` |
| Response Field | `pointsmarket` (object) | `itemmarket.listings` (array) |
| Price Field | `cost` | `price` |
| Quantity Field | `quantity` | `amount` |
| Alert URL | `pmarket.php` | `imarket.php` |
| Purchase Options | Full quantity only | Multiple quantity options |

## Usage Example

### Adding a Points Watch
```
User: /addwatch name:points price:30000
Bot: ✅ Added **Points** (ID: 0) to your watch list.
     You'll be alerted in this channel when the price drops below $30,000.
     📊 You have 1 of 5 watches.
```

### Receiving an Alert
```
🚨 Cheap item found!
💊 30x Points at $29,500 each (below $30,000)
@User
https://www.torn.com/pmarket.php

💰 Click here to sell stocks to buy:
30x (score: 0.85) - $885,000 - https://www.torn.com/page.php?sid=stocks&stockID=5&tab=owned&sellamount=450
```

## Implementation Details

### Code Structure
1. **Special Handling in addwatch.ts**
   - Detects itemId 0 or name "points"/"point"
   - Sets standardized name "Points" for consistency
   - Bypasses TornItem database lookup for points

2. **Conditional Logic in monitorMarketPrices.ts**
   - Uses `isPointsMarket` flag to track market type
   - Different API call based on itemId
   - Different response parsing for points vs items
   - Different URL generation for alerts
   - Single quantity option for points (full amount only)

### Type Safety
- Added proper TypeScript types for pointsmarket response
- Ensured type safety with explicit casting
- Maintained backward compatibility with existing item market code

## Testing

### Existing Tests
All existing tests in `tests/monitorMarketPrices.test.ts` continue to pass:
- ✅ 12/12 tests passing
- Tests cover `calculateQuantityIntervals` function (used for regular items)
- Points market uses full quantity only, so intervals aren't calculated

### Manual Testing Checklist
- [ ] Add points watch with itemId 0
- [ ] Add points watch with name "points"
- [ ] Verify alert triggers when price drops below threshold
- [ ] Verify alert URL is pmarket.php
- [ ] Verify only one quantity option is shown
- [ ] Verify stock sell recommendation works correctly

## Backward Compatibility

✅ **Fully backward compatible** - All existing functionality remains unchanged:
- Regular item market monitoring works exactly as before
- Existing watchlist items continue to function
- No database migrations required
- No breaking changes to API or Discord commands

## Rate Limiting

The points market monitoring uses the same rate limiting system as regular items:
- Shared Bottleneck instance
- Same rate limits apply
- Same retry logic with exponential backoff

## Future Enhancements

Potential improvements for future consideration:
1. Add dedicated tests for points market monitoring
2. Consider allowing multiple listings (not just lowest) for points
3. Add statistics tracking for points market prices
4. Consider separate rate limiting for points vs items
