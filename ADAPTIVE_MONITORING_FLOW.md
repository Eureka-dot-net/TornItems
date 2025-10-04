# Adaptive Monitoring Flow Diagram

## System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    MONITORING CYCLE START                        │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 1: Increment cycles_since_last_check for ALL items       │
│  ─────────────────────────────────────────────────────────────  │
│  MonitoredItem.updateMany({}, { $inc: { cycles_since... } })   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 2: Select Due Items                                       │
│  ─────────────────────────────────────────────────────────────  │
│  WHERE cycles_since_last_check >= MonitorFrequency             │
│                                                                  │
│  Example:                                                        │
│  • Item A: cycles=1, freq=1 → DUE                              │
│  • Item B: cycles=3, freq=5 → not due                          │
│  • Item C: cycles=10, freq=10 → DUE                            │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 3: Calculate Curiosity Budget                             │
│  ─────────────────────────────────────────────────────────────  │
│  Budget = RATE_LIMIT_PER_MINUTE × CURIOSITY_RATE               │
│  Example: 60 × 0.05 = 3 requests                                │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 4: Select Curiosity Items                                 │
│  ─────────────────────────────────────────────────────────────  │
│  • Find items with MonitorFrequency >= 5                        │
│  • AND not already due                                          │
│  • Randomly select up to curiosity budget                       │
│                                                                  │
│  Example: Randomly pick 3 from quiet items                      │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 5: Combine & Limit                                        │
│  ─────────────────────────────────────────────────────────────  │
│  Items to check = due_items + curiosity_items                   │
│  Limit to RATE_LIMIT_PER_MINUTE (60)                           │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 6: Fetch Market Data (API Calls)                         │
│  ─────────────────────────────────────────────────────────────  │
│  For each item:                                                 │
│  • GET /v2/market/{itemId}/itemmarket                           │
│  • Extract: stock, price, sales, listings                       │
│  • Save MarketSnapshot to MongoDB                               │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 7: Detect Movement                                        │
│  ─────────────────────────────────────────────────────────────  │
│  Compare current vs lastCheckedData:                            │
│  • Stock changed? → MOVEMENT                                    │
│  • Price changed >1%? → MOVEMENT                                │
│  • Sales changed? → MOVEMENT                                    │
│  • Otherwise → NO MOVEMENT                                      │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 8: Update MonitorFrequency                                │
│  ─────────────────────────────────────────────────────────────  │
│  IF movement detected:                                          │
│    MonitorFrequency = 1                                         │
│    (check every cycle - item is ACTIVE)                         │
│                                                                  │
│  IF no movement:                                                │
│    MonitorFrequency += 1 (max 10)                               │
│    (check less often - item is QUIET)                           │
│                                                                  │
│  ALWAYS:                                                        │
│    cycles_since_last_check = 0                                  │
│    lastCheckedData = currentData                                │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 9: Log Statistics                                         │
│  ─────────────────────────────────────────────────────────────  │
│  • Total items checked                                          │
│  • Due items vs curiosity items                                 │
│  • Movement detected count                                      │
│  • API calls made                                               │
│  • Cycle duration                                               │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Step 10: Calculate Wait Time & Schedule Next Cycle            │
│  ─────────────────────────────────────────────────────────────  │
│  minRequiredTime = (totalApiCalls / RATE_LIMIT) × 60 sec       │
│  waitTime = max(0, minRequiredTime - elapsed)                  │
│  setTimeout(fetchMarketSnapshots, waitTime)                     │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
                          [NEXT CYCLE]
```

## Example: Item Lifecycle

```
New Item Discovered (profit > 0)
│
├─ MonitorFrequency: 1
├─ cycles_since_last_check: 0
└─ lastCheckedData: null

Cycle 1: Check (due: cycles=1 >= freq=1)
│
├─ Movement detected! (stock changed)
├─ MonitorFrequency: 1 (reset)
├─ cycles_since_last_check: 0 (reset)
└─ lastCheckedData: updated

Cycle 2: Check (due: cycles=1 >= freq=1)
│
├─ No movement
├─ MonitorFrequency: 2 (increment)
├─ cycles_since_last_check: 0 (reset)
└─ lastCheckedData: updated

Cycle 3: Skip (not due: cycles=1 < freq=2)
│
└─ cycles_since_last_check: 2

Cycle 4: Check (due: cycles=2 >= freq=2)
│
├─ No movement
├─ MonitorFrequency: 3 (increment)
├─ cycles_since_last_check: 0 (reset)
└─ lastCheckedData: updated

... (item gets quieter, freq increases to 10)

Cycle N: MonitorFrequency = 10, cycles = 8
│
├─ Not due normally (cycles < freq)
├─ BUT selected for curiosity check!
├─ Movement detected! (price changed)
├─ MonitorFrequency: 1 (reset - back to active)
└─ cycles_since_last_check: 0
```

## Benefits Visualization

```
Traditional Approach (check all items every cycle):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
API Calls per minute: 120 (all items)
Result: EXCEEDS 60/min limit ❌

Adaptive Monitoring (smart scheduling):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cycle 1:
  Active items (freq=1): ████████████ (30 items)
  Medium items (freq=2-4): ██████ (15 items)
  Quiet items (freq=5-10): ██ (5 items)
  Curiosity checks: █ (3 items)
  Total: 53 API calls ✓

Cycle 2:
  Active items (freq=1): ████████████ (30 items)
  Medium items (due): ████ (10 items)
  Quiet items (due): █ (2 items)
  Curiosity checks: █ (3 items)
  Total: 45 API calls ✓

Average over time: ~40-55 API calls/cycle
Stays within 60/min limit ✓
Monitors ALL profitable items (100+) ✓
```
