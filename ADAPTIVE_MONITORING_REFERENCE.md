# Adaptive Monitoring Quick Reference

## Key Concepts

### MonitorFrequency
- **Range**: 1-10
- **Meaning**: Number of cycles to wait between checks
- **1**: Check every cycle (active item)
- **10**: Check every 10 cycles (very quiet item)

### Cycle Counter
- **Field**: `cycles_since_last_check`
- **Behavior**: Increments by 1 each cycle
- **Reset**: Set to 0 when item is checked

### Movement Detection
An item has "movement" if ANY of these changed:
- ✓ Stock: any difference
- ✓ Price: >1% change
- ✓ Sales: any difference

### Frequency Adjustment Rules
```
IF movement_detected:
    MonitorFrequency = 1
    (Item is ACTIVE - check every cycle)
ELSE:
    MonitorFrequency = min(MonitorFrequency + 1, 10)
    (Item is QUIET - check less often)
```

## Environment Variables

```bash
# API Rate Limit (requests per minute)
TORN_RATE_LIMIT=60

# Curiosity check percentage (0.05 = 5%)
CURIOSITY_RATE=0.05
```

## Database Queries

### Find all due items
```javascript
MonitoredItem.find({
  $expr: { $gte: ['$cycles_since_last_check', '$MonitorFrequency'] }
})
```

### Find quiet items eligible for curiosity
```javascript
MonitoredItem.find({
  MonitorFrequency: { $gte: 5 },
  $expr: { $lt: ['$cycles_since_last_check', '$MonitorFrequency'] }
})
```

### Get frequency distribution
```javascript
db.monitoreditems.aggregate([
  { $group: { 
      _id: "$MonitorFrequency", 
      count: { $sum: 1 } 
  }},
  { $sort: { _id: 1 }}
])
```

## Monitoring Statistics

### Expected API Usage
- **Active items** (freq=1): ~30-40% of items, checked every cycle
- **Medium items** (freq=2-4): ~30-40% of items, checked every 2-4 cycles
- **Quiet items** (freq=5-10): ~20-30% of items, checked every 5-10 cycles
- **Curiosity checks**: 5% of budget (3 requests per cycle @ 60/min)

### Typical Cycle Stats
```
Total monitored items: 450
Items due this cycle: 85
Curiosity checks: 2
Total API calls: 87
Movement detected: 12 (14%)
Average MonitorFrequency: 3.2
```

## Code Functions Reference

### Core Functions
```typescript
// Update all monitored items (runs every 10 min)
updateMonitoredItems()

// Main monitoring cycle (self-scheduling)
fetchMarketSnapshots()

// Helper functions
incrementCycleCounters()           // +1 to all cycle counters
selectDueItems()                   // Find items to check
selectCuriosityItems(maxCount)     // Random quiet items
detectMovement(item, currentData)  // Check for changes
updateMonitorFrequency(...)        // Adjust frequency
```

## Debugging Queries

### Check specific item status
```javascript
db.monitoreditems.findOne({
  country: "Mexico",
  itemId: 180
})
```

### Find items that should be checked next cycle
```javascript
db.monitoreditems.find({
  $expr: { 
    $gte: [
      { $add: ['$cycles_since_last_check', 1] },
      '$MonitorFrequency'
    ]
  }
}).count()
```

### Items with highest frequency (quietest)
```javascript
db.monitoreditems.find()
  .sort({ MonitorFrequency: -1 })
  .limit(10)
```

### Items checked most recently
```javascript
db.monitoreditems.find()
  .sort({ lastCheckTimestamp: -1 })
  .limit(10)
```

## Log Patterns to Watch

### Good Signs ✓
```
Total items to check: 40-60 (within budget)
Movement detected in 10-20%
Curiosity checks performed: 2-4
Cycle completed: 45 API calls in X seconds
```

### Warning Signs ⚠
```
Total items to check: 120 (exceeding budget)
Movement detected in 80% (too many resets)
Selected 0 items for curiosity (no quiet items)
```

### Critical Issues ❌
```
Rate limit protection: checking 60 of 150 items
Error in adaptive monitoring cycle
Total items to check: 0 (no due items - something wrong)
```

## Tuning Parameters

### Increase coverage (more frequent checks)
```bash
CURIOSITY_RATE=0.10  # 10% instead of 5%
```

### Reduce API usage (slower adaptation)
```bash
CURIOSITY_RATE=0.03  # 3% instead of 5%
TORN_RATE_LIMIT=50   # Lower rate limit
```

### Adjust movement sensitivity
In `detectMovement()` function:
```typescript
// Current: 1% price change threshold
const priceDiff = Math.abs(currentData.price - lastData.price) / lastData.price;
if (priceDiff > 0.01) return true;  // Change 0.01 to 0.05 for 5%
```

## Migration Notes

### From Old System
- Old: Top 20 for Torn, top 10 for others (~120 items)
- New: ALL profitable items (~450 items)
- Old: All items checked every cycle
- New: Smart scheduling based on activity

### Backward Compatibility
- TrackedItem collection still maintained
- Existing APIs continue to work
- Can run both systems in parallel during migration

## Performance Expectations

### API Calls per Cycle
- **Minimum**: 3-5 (only curiosity checks if no due items)
- **Average**: 40-55 (typical distribution of due items)
- **Maximum**: 60 (rate limit protection kicks in)

### Database Operations per Cycle
- 1 bulk update (increment all counters)
- 2-3 queries (select due, select curiosity, get metadata)
- N inserts (market snapshots for checked items)
- N updates (frequency adjustments)

### Memory Usage
- MonitoredItem collection: ~450 documents × 500 bytes = 225 KB
- In-memory during cycle: ~100 item objects × 2 KB = 200 KB
- Total: Minimal overhead
