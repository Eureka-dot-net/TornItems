# Stat Gain Command Implementation

## Overview
The `/statgain` command predicts stat gain per train and per 150 energy using Vladar's gym formula. This helps Torn players optimize their gym training by selecting the best gym for their current stats, happy level, and perks.

## Files Created

### 1. `API/src/models/Gym.ts`
Mongoose schema for gym data with the following fields:
- `name`: Unique gym identifier (e.g., "pourfemme")
- `displayName`: Human-readable name (e.g., "Pour Femme [L]")
- `strength`: Dots for strength training (nullable)
- `speed`: Dots for speed training (nullable)
- `defense`: Dots for defense training (nullable)
- `dexterity`: Dots for dexterity training (nullable)
- `energyPerTrain`: Energy cost per training session

### 2. `API/scripts/seedGyms.ts`
Seed script that populates the database with all 32 gyms from Torn:
- 8 London gyms (5 energy)
- 8 Medium gyms (10 energy)
- 8 High gyms (10 energy)
- 7 Special gyms (25-50 energy)
- 1 Jail gym (5 energy)

### 3. `API/src/discord/commands/statgain.ts`
Discord slash command implementation with:
- Parameters: `stat`, `amount`, `happy`, `perkperc`, `gym` (optional)
- Validation for inputs (negative values, happy range)
- Dynamic gym selection with fallback to "Pour Femme"
- Vladars formula computation
- Formatted embed response with results

### 4. `API/tests/statgain.test.ts`
Comprehensive test suite covering:
- Gym model creation with all stats
- Gym model with null stats (specialized gyms)
- Basic stat gain computation
- Comparison between different gyms
- Error handling for unsupported stats
- Perk bonus application
- High stat value handling (>50M)

## Setup Instructions

### 1. Seed the Gym Database
Before using the command, populate the database with gym data:

```bash
cd API
npm run seed-gyms
```

This will:
- Clear existing gym data
- Insert all 32 gyms from Torn
- Exit with success message

### 2. Register Discord Commands
Register the `/statgain` command with Discord:

```bash
cd API
npm run register-commands
```

Or for production:
```bash
npm run register-commands-prod
```

## Usage

### Command Syntax
```
/statgain <stat> <amount> <happy> <perkperc> [gym]
```

### Parameters
- **stat** (required): The stat to train
  - Choices: `strength`, `speed`, `defense`, `dexterity`
- **amount** (required): Your current stat total (number ≥ 0)
- **happy** (required): Your current happy value (0-100,000)
- **perkperc** (required): Your perk percentage bonus (number ≥ 0, e.g., 2 for 2%)
- **gym** (optional): Gym name (defaults to "pourfemme")

### Example Usage
```
/statgain strength 3479 4175 2 pourfemme
```

This will calculate stat gains for:
- Training strength
- With 3,479 current strength
- At 4,175 happy
- With 2% perk bonus
- At Pour Femme gym

### Response Format
The command replies with an embed showing:
```
🏋️ Stat Gain Prediction

Stat: Strength
Gym: Pour Femme [L] (3.4 dots, 5E)
Stat Total: 3,479
Happy: 4,175
Perks: +2%

Per Train: +5.03 Strength
Per 150 Energy: +150.90 Strength
```

## Vladar's Formula

The stat gain computation uses Vladar's gym formula:

```typescript
// Adjust stat for diminishing returns above 50M
const adjustedStat = statTotal < 50_000_000
  ? statTotal
  : (statTotal - 50_000_000) / (8.77635 * Math.log(statTotal)) + 50_000_000;

// Apply happy multiplier with proper rounding
const innerRound = Math.round(Math.log(1 + happy / 250) * 10000) / 10000;
const happyMult = Math.round((1 + 0.07 * innerRound) * 10000) / 10000;

// Apply perk bonus
const perkBonus = 1 + perkPerc / 100;

// Calculate gain using stat-specific lookup values
// The entire inner expression is multiplied by the base multiplier
const multiplier = (1 / 200000) * dots * energyPerTrain * perkBonus;
const innerExpression = 
  adjustedStat * happyMult + 
  8 * Math.pow(happy, 1.05) + 
  lookup2 * (1 - Math.pow(happy / 99999, 2)) + 
  lookup3;

const gain = multiplier * innerExpression;
```

### Lookup Values by Stat
- **Strength**: [1600, 1700]
- **Speed**: [1600, 2000]
- **Defense**: [2100, -600]
- **Dexterity**: [1800, 1500]

## Error Handling

The command handles various error cases:

1. **Negative stat amount**: "❌ Stat amount cannot be negative."
2. **Invalid happy range**: "❌ Happy value must be between 0 and 100,000."
3. **Negative perk percentage**: "❌ Perk percentage cannot be negative."
4. **Gym not found**: "❌ Gym "gymname" not found. Please make sure gyms are seeded in the database."
5. **Gym doesn't support stat**: "❌ Pour Femme [L] does not support training strength."

## Testing

Run the test suite:
```bash
cd API
npm test -- statgain.test.ts
```

All 8 tests should pass:
- ✓ should create a gym with all stats
- ✓ should create a gym with null stats
- ✓ should compute stat gain for basic stats
- ✓ should compute higher gains with better gym
- ✓ should throw error when gym does not support stat
- ✓ should compute correctly with zero perks
- ✓ should apply perk bonus correctly
- ✓ should handle high stat values correctly

## Notes

1. **Gym Choices**: The command includes all 32 gyms from Torn. Discord limits dropdown choices to 25 options, so users can also type the gym name directly.

2. **Default Gym**: If no gym is specified, defaults to "pourfemme" (Pour Femme).

3. **Specialized Gyms**: Some gyms only train specific stats (e.g., Gym 3000 only trains strength). The command will error if you try to train an unsupported stat.

4. **Energy Calculation**: The "Per 150 Energy" value is calculated as:
   ```typescript
   per150Energy = perTrain * (150 / gym.energyPerTrain)
   ```

5. **Number Formatting**: 
   - Stat totals and happy values are formatted with commas (e.g., "3,479")
   - Gains are shown with 2 decimal places (e.g., "+5.03 Strength")

## Integration

The command integrates with the existing Discord bot infrastructure:
- Uses the same database connection (`connectDB`)
- Follows the same logging pattern (`logInfo`, `logError`)
- Uses the same command registration system
- Follows the same error handling patterns

## Future Enhancements

Potential improvements for future versions:
1. Add command to list all gyms and their stats
2. Add optimization suggestions (best gym for your stats)
3. Add comparison between multiple gyms
4. Store user preferences (default gym, current stats)
5. Add gym availability checks (faction perks, VIP, etc.)
