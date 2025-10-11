# /mystatgain Command - Quick Reference

## Overview
The `/mystatgain` command automatically fetches your current Torn stats and calculates your predicted stat gains per train and per energy.

## Prerequisites
- You must first set your Torn API key using `/setkey <your_api_key>`
- Your API key needs permissions for: bars, battlestats, perks, and gym selections

## Usage

```
/mystatgain <stat>
```

### Parameters
- **stat** (required): The stat to train
  - Choices: `strength`, `speed`, `defense`, `dexterity`

### Example
```
/mystatgain strength
```

## What It Does

The command automatically:
1. Retrieves your encrypted API key from the database
2. Fetches your current stats from Torn API:
   - **Bars**: Current energy and happy levels
   - **Battle Stats**: Your current stat value
   - **Perks**: All active perks for gym gain calculation
   - **Gym**: Your currently active gym
3. Calculates your total perk percentage bonus
4. Computes predicted stat gains using Vladar's formula

## Output

The command displays an embed with:
- **Stat**: The stat you're training
- **Gym**: Your active gym (name, dots, energy per train)
- **Stat Total**: Your current stat value
- **Happy**: Your current happy level
- **Current Energy**: Your current energy level
- **Perks**: Your total perk percentage bonus
- **Per Train**: Stat gain per single train
- **Per [Current Energy] Energy**: Stat gain if you use all your current energy
- **Per 150 Energy**: Stat gain per 150 energy (standard comparison)

### Example Output
```
🏋️ Your Stat Gain Prediction

Stat: Strength
Gym: Pour Femme (3.4 dots, 5E)
Stat Total: 3,479
Happy: 4,175
Current Energy: 1,000
Perks: +2.00%

Per Train: +5.04 Strength
Per 1,000 Energy: +1,008.31 Strength
Per 150 Energy: +151.25 Strength
```

## Perk Calculation

The command automatically calculates your total perk percentage by:
1. Scanning all perk types (faction, property, merit, education, job, book, stock, enhancer)
2. Identifying gym gain perks (general and stat-specific)
3. Multiplying all applicable perks together

### Examples
- `"+ 2% gym gains"` → Applies to all stats
- `"+ 1% defense gym gains"` → Only applies to defense
- Both perks active for defense → 2% × 1.01 = 3.02% total

## Gym Data

The command:
- Fetches your active gym ID from Torn API
- Retrieves gym details (name, energy cost, stat multipliers)
- Converts Torn API values to dots (divides by 10)
  - Example: Torn API shows `34` → Displayed as `3.4 dots`

## Error Handling

The command handles various error cases:
- **No API key set**: Prompts you to use `/setkey` first
- **Invalid/expired API key**: Asks you to update your key
- **Gym doesn't support stat**: Notifies you that your gym can't train that stat
- **API errors**: General error message with logging for debugging

## Comparison with /statgain

| Feature | /statgain | /mystatgain |
|---------|-----------|-------------|
| Input required | Manual (stat, amount, happy, perkperc, gym) | Automatic (just stat) |
| Data source | User-provided | Torn API |
| Use case | What-if scenarios, comparing gyms | Current personal stats |
| Setup needed | None | `/setkey` required |

## Technical Details

### API Endpoints Used
1. `https://api.torn.com/v2/user/bars` - Energy and happy levels
2. `https://api.torn.com/v2/user/battlestats` - Current stat values
3. `https://api.torn.com/v2/user?selections=perks` - Active perks
4. `https://api.torn.com/v2/user?selections=gym` - Active gym ID
5. `https://api.torn.com/v2/torn?selections=gyms` - Gym details

### Formula Used
Uses the same Vladar's formula as `/statgain`:
```
gain = (1/200000) * dots * energyPerTrain * perkBonus * 
       (adjustedStat * happyMult + 8*happy^1.05 + lookup2*(1-(happy/99999)^2) + lookup3)
```

## Privacy
- Your API key is stored encrypted in the database
- Command responses are ephemeral (only visible to you)
- No other users can see your stats or results
