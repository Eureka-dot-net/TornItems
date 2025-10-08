# Boarding Time and Detail Card Enhancement

## Summary
Fixed two issues in the Profit Analysis page:
1. Boarding times showing in the past after page refresh
2. Detail cards not showing all available API information

## Issue 1: Boarding Time Calculation

### Problem
The boarding times were calculated on the server using `new Date()`, which uses the server's local time. When servers are deployed in different regions (with different timezones), the calculated boarding time could be in the past from the user's perspective.

### Solution
Moved the boarding time calculation from server-side (API) to client-side (browser) so it uses the user's local time.

### Changes Made

#### API Changes (`API/src/routes/profit.ts`)
- Removed `boarding_time` field from `CountryItem` interface
- Removed server-side boarding time calculation logic (lines 333-365)
- Added comment explaining that boarding time is now calculated client-side
- The API still provides `next_estimated_restock_time` and `travel_time_minutes` which the client uses for calculation

#### Client Changes (`Client/src/app/pages/Profit.tsx`)
- Added new function `calculateItemBoardingTime(item: CountryItem)` that calculates boarding time client-side
- This function mirrors the original server-side logic but uses the user's local time
- Updated detail cards to call `calculateItemBoardingTime(item)` instead of using `item.boarding_time`

#### Type Changes (`Client/src/lib/types/profit.ts`)
- Removed `boarding_time?: string | null;` from `CountryItem` interface
- Added missing fields: `cycles_skipped` and `last_restock_time`

## Issue 2: Detail Card Information

### Problem
The detail cards were only showing a subset of the available information from the API.

### Solution
Added all missing fields to both Foreign and Torn item detail cards.

### Fields Added

#### Foreign Items Detail Card
- Profit Per 1
- Estimated Market Value Profit
- Lowest 50 Profit
- 24h Sales Previous
- 24h Trend (with color coding: green for positive, red for negative)
- Hour Velocity 24

#### Torn Items Detail Card
- Profit Per 1
- Estimated Market Value Profit
- Lowest 50 Profit
- 24h Sales Previous
- 24h Trend (with color coding: green for positive, red for negative)
- Hour Velocity 24
- Cycles Skipped
- Last Restock Time

## Technical Details

### Client-Side Boarding Time Calculation
The `calculateItemBoardingTime` function:
1. Gets the current time from the user's browser
2. Calculates when the user would land if they boarded now
3. Finds the next restock time after that landing time (advancing by 15-minute cycles if needed)
4. Calculates the boarding time by subtracting travel time from the target restock time

This ensures that:
- Boarding times are always calculated using the user's local time
- The times shown are always in the future (unless the next restock is imminent)
- Different users in different timezones see correct boarding times for their location

### Benefits
1. **Timezone Accuracy**: Users in any timezone see correct boarding times
2. **Real-time Updates**: The 1-second timer in the component ensures boarding times count down correctly
3. **Complete Information**: Users can see all available metrics for informed decision-making
4. **Visual Clarity**: Color coding helps identify trends and profitable items quickly
