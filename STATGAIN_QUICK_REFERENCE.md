# /statgain Command - Quick Reference

## ✅ Implementation Complete

The `/statgain` command has been fully implemented with Vladar's gym formula. Users can now predict their stat gains per train and per 150 energy.

## 📁 Files Created

1. **`API/src/models/Gym.ts`** - Mongoose schema for gym data
2. **`API/scripts/seedGyms.ts`** - Seed script with all 32 Torn gyms
3. **`API/src/discord/commands/statgain.ts`** - Discord slash command implementation
4. **`API/tests/statgain.test.ts`** - Comprehensive test suite (8 tests, all passing)
5. **`STATGAIN_IMPLEMENTATION.md`** - Detailed documentation

## 🚀 Setup (Required Before First Use)

### Step 1: Seed Gym Data
```bash
cd API
npm run seed-gyms
```

This populates the database with 32 gyms from Torn.

### Step 2: Register Command
```bash
npm run register-commands
```

This registers the `/statgain` command with Discord.

## 💬 Command Usage

```
/statgain <stat> <amount> <happy> <perkperc> [gym]
```

### Parameters
- **stat**: strength, speed, defense, or dexterity (required)
- **amount**: Your current stat total (required)
- **happy**: Your current happy value 0-100,000 (required)
- **perkperc**: Your perk percentage bonus, e.g., 2 for 2% (required)
- **gym**: Gym name, defaults to "pourfemme" (optional)

### Example
```
/statgain strength 3479 4175 2 pourfemme
```

### Response
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

## 📊 Gyms Included (32 Total)

### London Gyms (5 energy)
- Premier Fitness, Average Joes, Woody's Workout, Beach Bods
- Silver Gym, Pour Femme, Davies Den, Global Gym

### Medium Gyms (10 energy)
- Knuckle Heads, Pioneer Fitness, Anabolic Anomalies, Core
- Racing Fitness, Complete Cardio, Legs Bums and Tums, Deep Burn

### High Gyms (10 energy)
- Apollo Gym, Gun Shop, Force Training, Cha Cha's
- Atlas, Last Round, The Edge, George's

### Special Gyms (varying energy)
- Balboas Gym (25E), Frontline Fitness (25E)
- Gym 3000 (50E), Mr. Isoyamas (50E), Total Rebound (50E), Elites (50E)
- Sports Science Lab (25E)

### Other
- The Jail Gym (5 energy)

## 🧪 Testing

All tests pass:
```bash
npm test -- statgain.test.ts
```

**Results**: 8/8 tests passing ✓

## 🔧 Technical Details

- **Formula**: Vladar's gym formula with stat-specific lookup tables
- **Validation**: Checks for negative values, happy range, gym compatibility
- **Error Handling**: Graceful errors for missing gyms or unsupported stats
- **Database**: MongoDB with Mongoose schema
- **Testing**: Comprehensive unit tests for computation logic

## 📖 Full Documentation

See `STATGAIN_IMPLEMENTATION.md` for detailed documentation including:
- Complete formula explanation
- Lookup table values
- Error handling details
- Future enhancement ideas

## 🎯 Features

✅ Predicts stat gain per train  
✅ Predicts stat gain per 150 energy  
✅ Supports all 4 battle stats  
✅ Includes all 32 Torn gyms  
✅ Validates input parameters  
✅ Handles specialized gyms (with null stats)  
✅ Applies perk bonuses correctly  
✅ Handles high stat values (>50M)  
✅ Formatted output with commas and decimals  
✅ Comprehensive test coverage
