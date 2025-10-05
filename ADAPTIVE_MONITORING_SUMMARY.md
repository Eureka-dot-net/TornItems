# Adaptive Item Monitoring System - Implementation Summary

## Overview
This implementation adds a self-adjusting item monitoring system that intelligently manages API usage by checking active items frequently and quiet items less often, while using "curiosity checks" to discover newly active items.

## Key Components

### 1. MonitoredItem Model (`API/src/models/MonitoredItem.ts`)
New MongoDB collection tracking ALL profitable items with these fields:
- **MonitorFrequency** (1-10): How many cycles to wait between checks
- **cycles_since_last_check**: Increments each cycle, reset when checked
- **lastCheckedData**: Cached stock/price/sales from last check
- **lastCheckTimestamp**: When item was last checked

### 2. Updated Background Fetcher (`API/src/services/backgroundFetcher.ts`)

#### New Functions:
- **`updateMonitoredItems()`**: Monitors ALL items with profit > 0
- **`incrementCycleCounters()`**: Increments cycles_since_last_check for all items at cycle start
- **`selectDueItems()`**: Queries items where cycles_since_last_check >= MonitorFrequency
- **`selectCuriosityItems(maxCount)`**: Randomly picks quiet items (MonitorFrequency ≥ 5) for random checks
- **`detectMovement(item, currentData)`**: Compares current vs cached data to detect changes
- **`updateMonitorFrequency(itemId, country, hasMovement, currentData)`**: Adjusts frequency based on movement

#### Refactored `fetchMarketSnapshots()`:
Now uses adaptive monitoring instead of checking all items every cycle:
1. Increment cycle counters for all monitored items
2. Select items that are due (cycles_since_last_check >= MonitorFrequency)
3. Reserve 5% of API budget for curiosity checks
4. Randomly select quiet items (MonitorFrequency ≥ 5) for curiosity
5. Fetch market data for due items + curiosity items
6. Detect movement by comparing to cached data
7. Adjust MonitorFrequency:
   - Movement → reset to 1 (active item, check every cycle)
   - No movement → increment by 1, max 10 (quiet item, check less often)
8. Log statistics and schedule next cycle

### 3. Movement Detection Logic
An item has "movement" if any of these changed:
- **Stock**: Any change in quantity
- **Price**: >1% change (to avoid minor fluctuations)
- **Sales**: Any change in items sold

### 4. Curiosity Checks
- Default: 5% of API budget (3 of 60 requests/min)
- Only checks items with MonitorFrequency ≥ 5 (quiet items)
- Randomly selected each cycle
- If movement found → reset MonitorFrequency to 1
- Purpose: Catch sudden activity in previously quiet items

### 5. Configuration
New environment variable:
```env
CURIOSITY_RATE=0.05  # 5% of API budget for random checks
```

### 6. Smart Monitoring
- MonitoredItem collection tracks ALL profitable items
- Existing APIs continue to work unchanged
- `updateMonitoredItems()` analyzes all items with positive profit

## Benefits

1. **Efficient API Usage**: Only check items when needed, not all items every cycle
2. **Adaptive to Market Activity**: Active items checked frequently, quiet items less often
3. **Discover New Opportunities**: Curiosity checks find newly active items
4. **Stays Within Rate Limit**: Maximum 60 requests/minute respected
5. **Scales Better**: Can monitor hundreds of items instead of just top 20-30
6. **Self-Balancing**: System automatically adjusts based on market conditions

## Example Scenario

### Initial State
- Item A: MonitorFrequency=1 (new item, check every cycle)
- Item B: MonitorFrequency=5 (quiet for a while)
- Item C: MonitorFrequency=10 (very quiet)

### Cycle 1
- Items due: A (cycles=1, freq=1), B (cycles=5, freq=5)
- Curiosity: Maybe C (randomly selected from quiet items)
- Check A, B, and possibly C
- A has movement → reset freq to 1
- B no movement → freq becomes 6
- C had movement → reset freq to 1 (curiosity found activity!)

### Cycle 2
- Items due: A (cycles=1, freq=1), C (cycles=1, freq=1)
- B not due (cycles=1, freq=6)
- Check A and C
- Continue adapting...

## Logging Example

```
=== Starting adaptive monitoring cycle ===
Found 85 items due for monitoring
Selected 2 items for curiosity checks (out of 120 eligible)
Total items to check: 87 (85 due + 2 curiosity)
Successfully stored 87 market snapshots
Movement detected in 12 items (frequencies reset to 1)
Curiosity checks performed: 2
Cycle completed: 87 API calls in 92.34 seconds
Waiting 5.00 seconds before next cycle to respect rate limit...
```

## Files Modified

1. **`API/src/models/MonitoredItem.ts`** - New model (created)
2. **`API/src/services/backgroundFetcher.ts`** - Core logic updated
3. **`API/BACKGROUND_FETCHER.md`** - Documentation updated
4. **`API/.env.example`** - Added CURIOSITY_RATE variable

## Testing Recommendations

1. **Monitor logs** to see adaptive behavior in action
2. **Check MonitoredItem collection** to see frequency distributions
3. **Verify API usage** stays under 60 requests/minute
4. **Track curiosity success rate** - how often curiosity finds movement
5. **Compare coverage** - ensure all profitable items are being monitored
