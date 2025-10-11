# MyStatGain Type Parameter Implementation

## Summary

Added a new `type` parameter to the `/mystatgain` Discord command that allows users to predict stat gains with various happiness boost strategies, along with energy boosters (Xanax and points refill).

## Latest Updates (Oct 11, 2025)

### New Required Parameters
1. **type** - Now required (was optional)
2. **numxanax** - New required parameter (dropdown: 0-4)
3. **pointsrefill** - New required parameter (boolean: true/false)

### New Display Field
- **Estimated Energy** - Shows calculated energy available after using Xanax and/or points refill
  - Formula: `current energy + (numXanax * 250) + (pointsRefill ? 150 : 0)`
  - Can reach up to 1,150 total energy

### Enhanced Cost Calculation
Cost breakdown now includes:
- Happiness boost items (based on type selection)
- Xanax (item 206) - market price × quantity
- Points refill - 30 points at 30k each = $900,000

## Command Parameters

### Required Parameters

1. **stat** - The stat to train
   - Choices: Strength, Speed, Defense, Dexterity

2. **type** - Happiness boost type
   - 1: None
   - 2: eDvD jump
   - 3: Lollipop / e jump
   - 4: Box of chocolates / e jump

3. **numxanax** - Number of Xanax to use
   - Choices: 0, 1, 2, 3, 4
   - Each Xanax adds 250 energy

4. **pointsrefill** - Use points refill for energy
   - Choices: true, false
   - Adds 150 energy if true
   - Costs 30 points at 30k each ($900,000)

## Changes Made

### 1. Discord Command Update (`API/src/discord/commands/mystatgain.ts`)

**Updated parameters:**
- `type`: Changed from optional to required
- `numxanax`: New required integer option with choices 0-4
- `pointsrefill`: New required boolean option

**Display Changes:**
- Added "Estimated Energy" field showing total available energy
- Enhanced cost breakdown to include Xanax and points refill

### 2. DiscordUserManager Helper Functions (`API/src/services/DiscordUserManager.ts`)

**Updated Function: `calculateEstimatedCost(type, numXanax, pointsRefill)`**
- Now accepts `numXanax` and `pointsRefill` parameters
- Calculates Xanax cost based on market price (item 206)
- Adds points refill cost (30 × 30,000 = $900,000)
- Returns null only if type=1 AND numXanax=0 AND pointsRefill=false

## Happiness Boost Formulas

- **Type 1 (None)**: No change
- **Type 2 (eDvD jump)**: (happiness + 12,500) × 2  *(Note: 5 × 2,500, NOT 52,500)*
- **Type 3 (Lollipop)**: (happiness + 1,225) × 2  
- **Type 4 (Box of chocolates)**: (happiness + 1,715) × 2

## Energy Calculation

```
Estimated Energy = Current Energy + (numXanax × 250) + (pointsRefill ? 150 : 0)
```

- Base: Current energy from user's Torn stats
- Xanax boost: Each Xanax adds 250 energy (max 1,000 from 4 Xanax)
- Points refill: Adds 150 energy if enabled
- **Maximum possible**: 1,150 energy (if user has 0 current + 4 Xanax + points refill)

## Cost Breakdown Example

### Example Command:
```
/mystatgain stat:strength type:2 numxanax:3 pointsrefill:true
```

### Example Output:
```
💰 Estimated Cost
Total: $XX,XXX,XXX
eDvD (x5): $XX,XXX,XXX
Energy Drink: $XXX,XXX
Xanax (x3): $X,XXX,XXX
Points Refill (30 pts): $900,000
```

## Item IDs Reference

- Item 36: Box of Chocolates
- Item 197: Energy Drink
- Item 206: Xanax
- Item 310: Lollipop
- Item 366: Erotic DVD (eDvD)

## Usage Example

### Command:
```
/mystatgain stat:strength type:2 numxanax:2 pointsrefill:false
```

### Expected Display:
```
🏋️ Your Stat Gain Prediction

Stat: Strength
Gym: Pour Femme [L] (3.4 dots, 5E)

Stat Total: 3,000,000
Happy: 5,000 → 25,000
Current Energy: 150
Estimated Energy: 650  (150 + 2×250)
Perks: +2.00%

Per Train: +XXX.XX Strength
Per 150 Energy: +XXX.XX Strength

💰 Estimated Cost
Total: $XX,XXX,XXX
eDvD (x5): $XX,XXX,XXX
Energy Drink: $XXX,XXX
Xanax (x2): $X,XXX,XXX
```

## Testing Verification

- ✅ TypeScript compilation successful
- ✅ All parameters now required as specified
- ✅ Estimated energy calculation validated
- ✅ Cost calculations include Xanax and points refill
- ✅ eDvD price fix maintained (5 × 2,500, not 52,500)

## Future Enhancements

As noted in the original problem statement, these helper functions are built into the DiscordUserManager to support future long-term prediction features that will help users decide optimal training strategies.
