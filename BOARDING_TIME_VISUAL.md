# Boarding Time Calculation - Visual Explanation

## Before (Server-Side Calculation) ❌

```
┌─────────────────────────────────────────────────────────────┐
│                    SERVER (e.g., in UTC)                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Get server time: new Date()                             │
│     → Returns: 2024-01-10 15:30:00 UTC                      │
│                                                              │
│  2. Calculate when user would land:                         │
│     → Landing: 2024-01-10 16:00:00 UTC (30 min travel)     │
│                                                              │
│  3. Find next restock after landing:                        │
│     → Next restock: 2024-01-10 16:15:00 UTC                │
│                                                              │
│  4. Calculate boarding time:                                │
│     → Boarding: 2024-01-10 15:45:00 UTC                     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                CLIENT (User in PST = UTC-8)                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  User's actual time: 2024-01-10 07:30:00 PST               │
│  Boarding time shown: 2024-01-10 07:45:00 PST              │
│                                                              │
│  ❌ PROBLEM: Server calculated at 15:30 UTC but user sees  │
│     it as 07:45 PST - which is already in the PAST if the  │
│     user's current time is later than 07:45 PST!           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## After (Client-Side Calculation) ✅

```
┌─────────────────────────────────────────────────────────────┐
│                         SERVER                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  API provides raw data (no time calculation):               │
│  - next_estimated_restock_time: "2024-01-10T16:15:00Z"     │
│  - travel_time_minutes: 30                                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                CLIENT (User in PST = UTC-8)                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Get user's LOCAL time: new Date()                       │
│     → Returns: 2024-01-10 09:30:00 PST                      │
│                                                              │
│  2. Calculate when user would land if boarding now:         │
│     → Landing: 2024-01-10 10:00:00 PST (30 min travel)     │
│                                                              │
│  3. Convert API restock time to user's timezone:            │
│     → Next restock: 2024-01-10 08:15:00 PST                │
│                                                              │
│  4. Check if restock is after landing:                      │
│     → 08:15 PST is BEFORE 10:00 PST landing time           │
│     → Advance to NEXT restock cycle                         │
│     → Updated restock: 2024-01-10 10:15:00 PST             │
│                                                              │
│  5. Calculate boarding time:                                │
│     → Boarding: 2024-01-10 09:45:00 PST                     │
│                                                              │
│  ✅ RESULT: User sees 09:45:00 PST, which is 15 minutes    │
│     in the FUTURE from their current time (09:30:00 PST)   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Real-World Example

### Scenario: User in Tokyo (JST = UTC+9) viewing data from server in New York (EST = UTC-5)

**Before (Broken):**
```
Server time (EST): 10:00 AM
Calculated boarding: 10:30 AM EST → Sent to client
User in Tokyo sees: 12:30 AM JST (next day)
User's actual time: 1:00 AM JST (already past midnight!)
Result: ❌ Boarding time appears to be in the PAST
```

**After (Fixed):**
```
User's local time (JST): 1:00 AM
User calculates boarding time using THEIR clock
Calculated boarding: 1:15 AM JST
Result: ✅ Boarding time is correctly in the FUTURE
```

## Key Benefits

1. **Timezone Independence**: Works correctly regardless of:
   - Server location (UTC, EST, PST, etc.)
   - User location (Tokyo, London, New York, etc.)
   - Daylight saving time differences

2. **Real-Time Accuracy**: 
   - Uses user's actual current time
   - No timezone conversion errors
   - Countdowns work correctly

3. **Future-Proof**:
   - Works when server moves regions
   - Works for distributed/load-balanced servers
   - Works across international deployments

## Implementation Details

### API Response (No Calculation)
```typescript
{
  "next_estimated_restock_time": "2024-01-10T16:15:00.000Z",
  "travel_time_minutes": 30
  // No boarding_time field
}
```

### Client Calculation
```typescript
const calculateItemBoardingTime = (item: CountryItem): string | null => {
  const now = new Date(); // ✅ User's local time
  const travelTime = item.travel_time_minutes;
  
  // When would we land if we board now?
  const landingTime = new Date(now.getTime() + travelTime * 60 * 1000);
  
  // Find next restock after we land
  let restock = new Date(item.next_estimated_restock_time);
  while (restock <= landingTime) {
    restock = new Date(restock.getTime() + 15 * 60 * 1000); // Next 15-min cycle
  }
  
  // Board this much earlier to arrive at restock time
  const boarding = new Date(restock.getTime() - travelTime * 60 * 1000);
  return boarding.toISOString();
};
```

This ensures boarding times are always calculated using the user's current local time, making them accurate and always in the future! 🎯
