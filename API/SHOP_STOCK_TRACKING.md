# Shop Stock Tracking System

## Overview
This system tracks how quickly items sell out and how often they restock in Torn city shops. It measures two key metrics:
1. **Sellout Duration** - How long an item stays in stock after restocking
2. **Cycles Skipped** - How many 15-minute Torn restock cycles are skipped before the next restock

## Architecture

### Data Model: `ShopItemState`
Located in `API/src/models/ShopItemState.ts`

Tracks the latest known state for each `(shopId, itemId)` pair:

```typescript
{
  // Basic item information
  shopId: String,
  itemId: String,
  itemName: String,
  shopName: String,
  type: String,
  price: Number,
  in_stock: Number,
  lastUpdated: Date,

  // Tracking fields
  lastRestockTime: Date,           // When stock jumped from 0 → positive
  lastSelloutTime: Date,            // When stock dropped from >0 → 0
  selloutDurationMinutes: Number,   // Duration from restock → sellout
  cyclesSkipped: Number,            // 15-min intervals skipped before next restock
  averageSelloutMinutes: Number,    // Rolling average (optional)
  averageCyclesSkipped: Number      // Rolling average (optional)
}
```

### Helper Functions
Located in `API/src/utils/dateHelpers.ts`

- **`roundUpToNextQuarterHour(date)`** - Rounds a date up to the next :00, :15, :30, or :45 boundary
- **`minutesBetween(startDate, endDate)`** - Calculates the number of minutes between two dates

### Integration Point
Located in `API/src/services/backgroundFetcher.ts`

The `fetchCityShopStock()` function runs every minute and:
1. Fetches current shop stock from Torn API
2. Updates `CityShopStock` (current state)
3. Appends to `CityShopStockHistory` (historical records)
4. **NEW:** Calls `trackShopItemState()` for each item to detect and track transitions

## State Transition Logic

### Transition Detection

The system compares previous and current stock levels:

| Previous Stock | Current Stock | Transition | Action |
|---------------|---------------|------------|---------|
| > 0 | 0 | **SELLOUT** | Record sellout time and calculate duration |
| 0 | > 0 | **RESTOCK** | Record restock time and calculate cycles skipped |
| > 0 | > 0 | Still in stock | Update stock level only |
| 0 | 0 | Still empty | No change |

### Sellout Detection
When `previous.in_stock > 0` and `current.in_stock = 0`:

1. Record `lastSelloutTime = now`
2. Calculate `selloutDurationMinutes = (now - lastRestockTime) / 60000`
3. Update rolling average: `averageSelloutMinutes = (prevAvg + newDuration) / 2`
4. Log: `[Sellout] {itemName} sold out in {X} min`

### Restock Detection
When `previous.in_stock = 0` and `current.in_stock > 0`:

1. Record `lastRestockTime = now`
2. Calculate expected restock time:
   - Round `lastSelloutTime` up to next 15-minute mark
   - Example: Sellout at 12:07 → expected restock at 12:15
3. Calculate cycles skipped:
   - `timeSinceSellout = now - expectedRestockTime`
   - `cyclesSkipped = max(0, round(timeSinceSellout / 15 minutes))`
4. Update rolling average: `averageCyclesSkipped = (prevAvg + newSkipped) / 2`
5. Log: `[Restock] {itemName} restocked after skipping {X} cycles (last sellout HH:MM, new restock HH:MM)`

## Example Scenarios

### Scenario 1: Fast-Selling Item
```
12:00 - Restock detected (stock: 0 → 100)
12:03 - Sellout detected (stock: 100 → 0)
  → selloutDurationMinutes = 3
  → Log: "[Sellout] Hammer sold out in 3.0 min"

12:15 - Restock detected (stock: 0 → 100)
  → Expected restock: 12:15 (next quarter after 12:03)
  → Actual restock: 12:15
  → cyclesSkipped = 0
  → Log: "[Restock] Hammer restocked after skipping 0 cycles"
```

### Scenario 2: Slow-Selling Item with Skipped Cycles
```
12:00 - Restock detected (stock: 0 → 100)
12:25 - Sellout detected (stock: 100 → 0)
  → selloutDurationMinutes = 25
  → Log: "[Sellout] Xanax sold out in 25.0 min"

13:00 - Restock detected (stock: 0 → 100)
  → Expected restock: 12:30 (next quarter after 12:25)
  → Actual restock: 13:00
  → Time difference: 30 minutes
  → cyclesSkipped = round(30 / 15) = 2
  → Log: "[Restock] Xanax restocked after skipping 2 cycles (last sellout 12:25, new restock 13:00)"
```

## Usage & Queries

### Get Items with Fastest Sellout Times
```javascript
const fastestSelling = await ShopItemState.find({
  selloutDurationMinutes: { $exists: true }
})
.sort({ selloutDurationMinutes: 1 })
.limit(10);
```

### Get Items with Most Skipped Cycles
```javascript
const mostSkipped = await ShopItemState.find({
  cyclesSkipped: { $exists: true }
})
.sort({ cyclesSkipped: -1 })
.limit(10);
```

### Get Current State of a Specific Item
```javascript
const itemState = await ShopItemState.findOne({
  shopId: '1',
  itemId: '206'  // Xanax
});
```

## Testing

Unit tests for helper functions are in `API/tests/dateHelpers.test.ts`:
- Tests for quarter-hour rounding
- Tests for minute calculations
- Edge case handling

Run tests with: `npm test`

## Logging

The system provides clear, observable logs:
- `[Sellout] {itemName} sold out in {X} min` - When an item sells out
- `[Restock] {itemName} restocked after skipping {X} cycles (...)` - When an item restocks

## Performance

- Minimal overhead: 1 MongoDB query per item per fetch (findOne on ShopItemState)
- Efficient upserts prevent duplicate entries
- Indexed by compound key `{ shopId, itemId }` for fast lookups

## Future Enhancements

Potential improvements:
1. API endpoints to query tracking data
2. Dashboard visualization of sellout/restock patterns
3. Alerts for unusual patterns (e.g., unusually long sellout times)
4. Historical trend analysis (sellout getting faster/slower over time)
