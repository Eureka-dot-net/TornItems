# Stat Gain Calculation Refactoring Summary

## Problem
The stat gain calculation formula was duplicated in multiple places:
- `/statgain` command had its own `computeStatGain()` function
- `/mystatgain` command had its own `computeStatGain()` function
- Tests had a replicated version of the function
- Perk parsing logic was also duplicated

This violates the DRY (Don't Repeat Yourself) principle and makes maintenance difficult - any formula change would need to be made in multiple places.

## Solution
Created a centralized, single-source-of-truth architecture for stat gain calculations.

### New Shared Utility: `utils/statGainCalculator.ts`
```typescript
// Core calculation function - used by all commands
export function computeStatGain(
  stat: string,
  statTotal: number,
  happy: number,
  perkPerc: number,
  dots: number,
  energyPerTrain: number
): StatGainResult

// Extended version with current energy calculation
export function computeStatGainWithCurrentEnergy(
  ...params,
  currentEnergy: number
): StatGainResultWithCurrentEnergy
```

### Enhanced DiscordUserManager
Added methods for complete user stat prediction:

```typescript
// Parse gym gain perks from user data
static parsePerkPercentage(perks: TornPerksResponse, stat: string): number

// Get complete stat gain prediction for a user
static async getPredictedStatGains(
  discordId: string, 
  stat: string
): Promise<StatGainResultWithCurrentEnergy | null>
```

## Files Updated

### 1. `/src/utils/statGainCalculator.ts` (NEW)
- Core stat gain calculation functions
- Implements Vladar's formula in one place
- Exported interfaces for type safety

### 2. `/src/services/DiscordUserManager.ts`
- Added `parsePerkPercentage()` method
- Added `getPredictedStatGains()` method
- Imports from `statGainCalculator.ts`

### 3. `/src/discord/commands/statgain.ts`
- **Removed** local `computeStatGain()` function (52 lines removed)
- Now imports and uses shared `computeStatGain()`
- Calls: `computeStatGain(stat, amount, happy, perkPerc, statDots, gym.energyPerTrain)`

### 4. `/src/discord/commands/mystatgain.ts`
- **Removed** local `computeStatGain()` function (48 lines removed)
- **Removed** local `parsePerkPercentage()` function (40 lines removed)
- Now uses `DiscordUserManager.getPredictedStatGains(discordId, stat)`
- Simplified from ~200 lines to ~130 lines

### 5. `/tests/statgain.test.ts`
- **Removed** local `computeStatGain()` function (52 lines removed)
- Now imports shared `computeStatGain()`
- Added helper wrapper for test compatibility

## Benefits

### ✅ Single Source of Truth
- Formula exists in exactly **one** place: `statGainCalculator.ts`
- Future changes only need to update one file
- Eliminates risk of inconsistencies between implementations

### ✅ DRY Principle
- No duplicated code
- Perk parsing logic shared
- Calculation logic shared

### ✅ Maintainability
- Formula updates: 1 file instead of 3
- Bug fixes: 1 place instead of 3
- Testing: verify shared function once

### ✅ Reusability
- Any future command can import `computeStatGain()`
- Any future feature can use `DiscordUserManager.getPredictedStatGains()`
- Utilities can be composed for new use cases

### ✅ Type Safety
- Shared interfaces ensure consistency
- TypeScript catches parameter mismatches
- Better IDE autocomplete

## Code Reduction
- **Total lines removed**: ~192 lines of duplicated code
- **Total lines added**: ~100 lines of shared utilities
- **Net reduction**: ~92 lines
- **Duplication eliminated**: 3 copies → 1 canonical version

## Usage Examples

### Before (Duplicated)
```typescript
// In statgain.ts
function computeStatGain(...) { /* 52 lines of formula */ }

// In mystatgain.ts  
function computeStatGain(...) { /* 48 lines of formula */ }
function parsePerkPercentage(...) { /* 40 lines */ }

// In tests
function computeStatGain(...) { /* 52 lines of formula */ }
```

### After (Shared)
```typescript
// In statgain.ts
import { computeStatGain } from '../../utils/statGainCalculator';
const result = computeStatGain(stat, amount, happy, perkPerc, dots, energyPerTrain);

// In mystatgain.ts
import { DiscordUserManager } from '../../services/DiscordUserManager';
const result = await DiscordUserManager.getPredictedStatGains(discordId, stat);

// In tests
import { computeStatGain } from '../src/utils/statGainCalculator';
const result = computeStatGainFromGym(stat, amount, happy, perkPerc, gym);
```

## Testing
All existing tests continue to pass with no changes to expected behavior:
- ✅ 12 stat gain computation tests
- ✅ Formula verification with exact values (4.8, 35.46, 316.16, 382.53)
- ✅ Gym validation
- ✅ Perk calculation
- ✅ High stat values (>50M)

## Future Enhancements
With centralized utilities, future improvements are easier:
- Add caching layer to `statGainCalculator`
- Add statistical analysis (average gains, trends)
- Create gym comparison features
- Build training planners
- All features automatically use the canonical formula
