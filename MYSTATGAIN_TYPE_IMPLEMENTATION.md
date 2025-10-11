# MyStatGain Type Parameter Implementation

## Summary

Added a new `type` parameter to the `/mystatgain` Discord command that allows users to predict stat gains with various happiness boost strategies.

## Changes Made

### 1. Discord Command Update (`API/src/discord/commands/mystatgain.ts`)

**Added new parameter:**
- Parameter name: `type`
- Type: Integer (optional, defaults to 1)
- Description: "Happiness boost type"
- Choices:
  1. None - No happiness boost
  2. eDvD jump - Use 5 Erotic DVDs + Energy Drink
  3. Lollipop / e jump - Use 49 Lollipops + Energy Drink
  4. Box of chocolates / e jump - Use 49 Boxes of Chocolates + Energy Drink

**Display Changes:**
- Happy field now shows: `original → adjusted` when type is not "None"
- Added cost breakdown section when type is not "None"

### 2. DiscordUserManager Helper Functions (`API/src/services/DiscordUserManager.ts`)

**New Function: `calculateAdjustedHappiness(currentHappiness, type)`**
- Calculates adjusted happiness based on the selected boost type
- Formulas:
  - Type 1 (None): No change
  - Type 2 (eDvD jump): (happiness + 52,500) × 2
  - Type 3 (Lollipop): (happiness + 1,225) × 2  
  - Type 4 (Box of chocolates): (happiness + 1,715) × 2

**New Function: `calculateEstimatedCost(type)`**
- Fetches market prices from TornItem database
- Calculates total cost based on item quantities
- Returns formatted breakdown and total cost
- Item requirements:
  - Type 2: 5 × Item 366 (eDvD) + 1 × Item 197 (Energy Drink)
  - Type 3: 49 × Item 310 (Lollipop) + 1 × Item 197 (Energy Drink)
  - Type 4: 49 × Item 36 (Box of Chocolates) + 1 × Item 197 (Energy Drink)

**Updated Function: `getPredictedStatGains(discordId, stat, type = 1)`**
- Now accepts optional `type` parameter
- Applies happiness adjustment before calculating stat gains

## Usage Example

### Without Type (Default)
```
/mystatgain stat:strength
```
Shows predictions with current happiness.

### With Type
```
/mystatgain stat:strength type:2
```
Shows predictions with eDvD jump happiness boost and estimated cost.

## Output Example

When using type 2 (eDvD jump) with 5,000 current happiness:

```
Happy: 5,000 → 115,000
...
💰 Estimated Cost
Total: $23,500,000
eDvD (x5): $23,000,000
Energy Drink: $500,000
```

## Testing Verification

Manual testing confirmed:
- ✅ Happiness calculations are correct for all types
- ✅ Cost calculations retrieve market prices correctly
- ✅ Type parameter defaults to 1 (None) when not specified
- ✅ Build completes successfully with no TypeScript errors

## Future Enhancements

As noted in the problem statement, these helper functions are built into the DiscordUserManager to support future long-term prediction features that will help users decide optimal training strategies.
