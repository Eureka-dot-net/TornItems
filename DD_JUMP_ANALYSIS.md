# Diabetes Day Jump Impact Analysis

## Issue Summary

User noticed that doing 1 DD jump has a major impact on stats over 6/12 months, while doing 2 DD jumps has only a minor additional benefit over doing 1 jump.

## Investigation Results

### Current Behavior

Diabetes Day (DD) jumps are **ONE-TIME events** that occur only at the beginning of the simulation:
- **1 DD jump:** Occurs on day 7
- **2 DD jumps:** Occur on days 5 and 7

### Test Results (6 months)

```
Baseline (No DD):    4,018,468 total stats
1 DD Jump:           4,510,448 total stats (+12.24%)
2 DD Jumps:          4,812,702 total stats (+19.76%)

Direct DD Gains:
- 1 DD: 73,735 stats
- 2 DD: 120,663 stats (Jump 1: 73,516 + Jump 2: 47,147)

Additional benefit of 2nd jump: +302,254 stats (6.70% over 1 DD)
```

### Test Results (12 months)

```
Baseline (No DD):    33,409,190 total stats
1 DD Jump:           37,318,727 total stats (+11.70%)
2 DD Jumps:          39,721,014 total stats (+18.89%)

Additional benefit of 2nd jump: +2,402,287 stats (6.44% over 1 DD)
```

## Why The Disparity?

### 1. Compounding Effect
The DD jump happens early (days 5-7), giving the gained stats **months to compound**:

- **Direct DD gain:** 120,663 stats (for 2 jumps)
- **Total benefit:** 794,234 stats over 6 months
- **Compounding multiplier:** 6.58x

The early stat boost means:
- You train at higher base stats for the remaining ~173 days (6 months)
- Each subsequent training session gives slightly more gains
- This compounds over time

### 2. Why 2nd Jump Has Less Impact

The second jump (day 7) happens only **2 days after the first jump** (day 5):

**Energy Analysis:**
```
1 DD Jump:
  - Energy: 1900 (base 1150 + green egg 500 + seasonal 250)
  - Direct gain: 73,735 stats

2 DD Jumps:
  - Jump 1 (day 5): 1900 energy → 73,516 stats
  - Jump 2 (day 7): 1200 energy → 47,147 stats (no items left!)
  - Total: 3100 energy → 120,663 stats
```

**Key Issue:** With only 1 Green Egg available:
- First jump gets: base 1150 + green egg 500 + seasonal 250 = **1900 energy**
- Second jump gets: base 1150 + logo click 50 = **1200 energy** (37% less!)

The second jump is **significantly weaker** because:
1. It happens only 2 days later (minimal stat growth between jumps)
2. It has much less energy available (no items left to use)
3. Both jumps occur so early that the compounding effect is similar

## Why This Might Be Unintuitive

Users might expect:
1. **Recurring DD jumps** (weekly/monthly) rather than one-time
2. **More items available** for a proper 2-jump strategy
3. **Better spacing** between jumps for stat growth

However, the current implementation treats DD as a **special one-week event** at the start of the simulation.

## Findings

### Current Implementation is Working As Designed

The code correctly implements:
- ✅ 99,999 happy during DD jumps
- ✅ Proper energy calculations with items
- ✅ Stat gains based on happy/energy
- ✅ Compounding effects over time

### The "Issue" is Actually Expected Behavior

- ✅ 1 DD jump has major impact because it compounds over months
- ✅ 2 DD jumps has minor additional benefit because:
  - Second jump is only 2 days later
  - Second jump has 37% less energy
  - Both jumps are one-time events at the start

## Recommendations

### Option 1: Document Current Behavior (No Code Changes)
Add clear documentation that:
- DD is a one-time event in the first week
- 2 jumps means days 5 & 7, not recurring
- Benefits compound over the simulation period
- Second jump has less energy if using same items

### Option 2: Make DD Recurring (Code Changes Required)
Implement DD jumps to recur (e.g., monthly) like Happy Jumps:
- Add "DD Frequency" field to UI
- Update logic to schedule recurring DD jumps
- This would make 1 DD vs 2 DD comparison more meaningful

### Option 3: Better Item Distribution (Code Changes)
Allow users to specify items per jump:
- "Jump 1: Green Egg + Seasonal Mail"
- "Jump 2: FHC + Logo Click"
- This would make 2 jumps more comparable to 1 jump

## Conclusion

The current behavior is **working correctly** but may not match user expectations. The major impact of 1 DD jump and minor benefit of a 2nd jump is due to:

1. **One-time nature** of DD jumps (not recurring)
2. **Early timing** (days 5-7) causing maximum compounding
3. **Item limitations** making 2nd jump much weaker
4. **Close spacing** (2 days apart) providing minimal additional benefit

If the goal is to make 2 DD jumps more impactful, consider:
- Making DD jumps recurring (monthly)
- Allowing more items for 2-jump strategy
- Better spacing between jumps

Otherwise, document that DD is a one-time boost and the 2-jump option is for min-maxing the first week only.
