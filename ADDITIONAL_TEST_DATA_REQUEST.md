# Additional Test Data Request

To further validate the gym progression calculator's accuracy across all scenarios, I would appreciate the following additional test data:

## Format for Each Test Case

Please provide data in this format:

```
Gym: [Tier] Gym Name
Stat: (strength/speed/defense/dexterity)
Happy: (happiness value 1-99999)
Stat Value: (starting stat value before training)
Energy: (total energy used in session)
Perk mult: (total multiplier, e.g., 1.071 for 7.1% perks)
Single Train: (gain per individual train)
Total Predicted Gains: (total gain after session)
```

## Requested Test Cases

### 1. Mid-Tier Stats (50K-500K Range) - 5 tests
- **Purpose:** Validate accuracy in the most common progression range
- **Example:** Silver Gym [L], Strength, Happy: 5025, Stat: 250000, Energy: 500, Perk: 1.071

### 2. Company Benefits - 3 tests
- **Music Store (30% faster gym unlocks):** Test with gym upgrade scenario
- **Fitness Center (3% gain bonus):** Compare with/without benefit
- **Candle Shop (bonus energy):** Test with 10★ (50 energy/day)

### 3. Multi-Stat Balanced Training - 2 tests
- **Balanced build:** All stats being trained equally
- **Focused build:** 80% energy on one stat, 20% split on others

### 4. Very High Stats (500M+) - 2 tests
- **Purpose:** Validate diminishing returns curve
- **Example:** Total Rebound [S], Speed, Happy: 5025, Stat: 500000000+, Energy: 150

### 5. Low Happy Range (1K-3K) - 2 tests
- **Purpose:** Validate lower bound of happiness scaling
- **Example:** Premier Fitness [L], Any stat, Happy: 1500, Stat: 10000, Energy: 250

### 6. Specialty Gym Unlock Tests - 2 tests
- **Balboa's Gym:** Defense+Dex build (25% higher than Str+Spd)
- **Frontline Fitness:** Str+Spd build (25% higher than Def+Dex)

### 7. Edge Cases - 2 tests
- **Zero to low stats:** Starting from 0-1000 stats
- **Maximum happy:** 99,999 happy with various gym tiers

### 8. Energy Variations - 2 tests
- **Very low energy:** 50-100 energy sessions
- **Very high energy:** 2000+ energy sessions (multiple refills)

## Total Requested: 20 Test Cases

These additional tests would help validate:
- ✅ Formula accuracy across ALL stat ranges
- ✅ Company benefit calculations
- ✅ Multi-stat training distribution
- ✅ Specialty gym requirements
- ✅ Edge case handling

## How to Gather Test Data

The most accurate data comes from:

1. **Before training:** Note your exact stat value
2. **Training session:** Use a specific amount of energy at one gym
3. **After training:** Note the new stat value and total gain
4. **Torn gym log:** Check the log for exact energy used and happiness level

**Example from game log:**
```
13:25:29 - 04/11/25 You used 260 energy and 132 happiness training 
your dexterity 26 times in Pioneer Fitness increasing it by 577.72 
to 31,346.49
```

From this, we can extract:
- Gym: Pioneer Fitness [M]
- Stat: Dexterity
- Happy: ~5000 (average, since it decreases during training)
- Stat Value: 30,768.77 (31,346.49 - 577.72)
- Energy: 260
- Single Train: 22.22 (577.72 / 26)
- Total Gain: 577.72

## Priority Order

If providing all 20 is too much, please prioritize:

1. **Mid-tier stats** (most common use case)
2. **Company benefits** (affects many users)
3. **Very high stats** (validates diminishing returns)
4. **Low happy range** (common scenario)

Thank you for helping improve the accuracy of the gym progression calculator!
