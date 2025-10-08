# Changes Summary - Boarding Time and Detail Cards

## Overview
This PR fixes two critical issues in the Profit Analysis page:
1. **Boarding times showing in the past** - Fixed by moving calculation to client-side
2. **Incomplete detail information** - Fixed by displaying all available API data

## Files Changed
- `API/src/routes/profit.ts` - Removed server-side boarding time calculation
- `Client/src/app/pages/Profit.tsx` - Added client-side boarding time calculation and expanded detail cards
- `Client/src/lib/types/profit.ts` - Updated TypeScript interfaces to match new API response

## Detailed Changes

### 1. Boarding Time Calculation Fix

#### Before
```typescript
// API calculated boarding time using server's local time
if (travel_time_minutes > 0) {
  const now = new Date(); // ❌ Uses server timezone
  const landingTimeIfBoardNow = new Date(now.getTime() + travelTimeToDestination * 60 * 1000);
  
  // ... calculation logic ...
  
  boarding_time = boardingTimeDate.toISOString();
}

// Client used the pre-calculated value
{item.boarding_time && (
  <Typography>{formatDateTime(item.boarding_time)}</Typography>
)}
```

#### After
```typescript
// API provides the raw data without calculation
// NOTE: boarding_time calculation moved to client-side to avoid timezone issues
// The client will calculate boarding time using next_estimated_restock_time and travel_time_minutes

// Client calculates boarding time using user's local time
const calculateItemBoardingTime = (item: CountryItem): string | null => {
  if (!item.travel_time_minutes || item.travel_time_minutes <= 0) return null;
  
  const now = new Date(); // ✅ Uses user's local timezone
  const travelTimeToDestination = item.travel_time_minutes;
  
  // Calculate when we would land if we boarded right now
  const landingTimeIfBoardNow = new Date(now.getTime() + travelTimeToDestination * 60 * 1000);
  
  let targetRestockTime: Date;
  
  if (item.next_estimated_restock_time) {
    // We have restock data - find next restock after our landing time
    let estimatedRestock = new Date(item.next_estimated_restock_time);
    
    // If the estimated restock is before we would land, advance to next cycle(s)
    while (estimatedRestock <= landingTimeIfBoardNow) {
      estimatedRestock = new Date(estimatedRestock.getTime() + 15 * 60 * 1000);
    }
    
    targetRestockTime = estimatedRestock;
  } else {
    // No restock data - find next quarter hour after landing time
    targetRestockTime = roundUpToNextQuarterHour(landingTimeIfBoardNow);
  }
  
  // Boarding time is the target restock time minus the travel time
  const boardingTimeDate = new Date(targetRestockTime.getTime() - travelTimeToDestination * 60 * 1000);
  return boardingTimeDate.toISOString();
};

// Usage in the UI
{item.travel_time_minutes && item.travel_time_minutes > 0 && (
  <Typography>{formatDateTime(calculateItemBoardingTime(item))}</Typography>
)}
```

**Why this fixes the issue:**
- Server time could be in any timezone (UTC, EST, PST, etc.)
- User's browser always uses their local timezone
- By calculating on the client, we ensure the boarding time is always correct for the user's location
- The countdown timer will work correctly regardless of server location

### 2. Detail Card Information Enhancement

#### Before - Foreign Items Detail Card
```
✅ Country
✅ Buy Price
✅ Market Price
✅ Avg Sold Price
✅ Sold Profit
✅ In Stock
✅ Travel Time
✅ Profit/Min
✅ 24h Sales
✅ Boarding Time
✅ Boarding Time Left
```

#### After - Foreign Items Detail Card
```
✅ Country
✅ Buy Price
✅ Market Price
➕ Profit Per 1 (NEW)
✅ Avg Sold Price
➕ Estimated Market Value Profit (NEW)
➕ Lowest 50 Profit (NEW)
✅ Sold Profit
✅ In Stock
✅ 24h Sales Current (renamed from "24h Sales")
➕ 24h Sales Previous (NEW)
➕ 24h Trend (NEW - with color coding)
➕ Hour Velocity 24 (NEW)
✅ Travel Time
✅ Profit/Min
✅ Boarding Time
✅ Boarding Time Left
```

#### Before - Torn Items Detail Card
```
✅ Shop
✅ Buy Price
✅ Market Price
✅ Avg Sold Price
✅ Sold Profit
✅ In Stock
✅ 24h Sales
✅ Sellout Duration
✅ Next Restock
```

#### After - Torn Items Detail Card
```
✅ Shop
✅ Buy Price
✅ Market Price
➕ Profit Per 1 (NEW)
✅ Avg Sold Price
➕ Estimated Market Value Profit (NEW)
➕ Lowest 50 Profit (NEW)
✅ Sold Profit
✅ In Stock
✅ 24h Sales Current (renamed from "24h Sales")
➕ 24h Sales Previous (NEW)
➕ 24h Trend (NEW - with color coding)
➕ Hour Velocity 24 (NEW)
✅ Sellout Duration
➕ Cycles Skipped (NEW)
➕ Last Restock (NEW)
✅ Next Restock
```

### New Field Descriptions

| Field | Description | Color Coding |
|-------|-------------|--------------|
| Profit Per 1 | Profit per single item after 5% sales tax | Green if positive |
| Estimated Market Value Profit | Estimated profit based on current market price | Green if positive |
| Lowest 50 Profit | Profit based on the lowest 50% of recent sales | Green if positive |
| 24h Sales Previous | Number of sales in the previous 24-hour period | None |
| 24h Trend | Change in sales between previous and current 24h period | Green if positive, red if negative |
| Hour Velocity 24 | Average sales per hour over the last 24 hours | None |
| Cycles Skipped | Number of 15-minute restock cycles skipped (Torn only) | None |
| Last Restock | Time of the last detected restock (Torn only) | None |

## Testing Notes

The changes are backward compatible:
- API still provides all the necessary data for calculation
- Client handles missing fields gracefully with null checks
- Existing functionality continues to work as before
- New fields add value without breaking existing workflows

## User Benefits

1. **Accurate Boarding Times**: Users in any timezone see correct boarding times
2. **Real-time Countdowns**: Boarding time countdown works correctly with client-side calculation
3. **Complete Information**: All API metrics are now visible for better decision-making
4. **Visual Clarity**: Color coding helps identify trends and profitable items at a glance
5. **No Server Dependency**: Boarding time calculation doesn't depend on server timezone
