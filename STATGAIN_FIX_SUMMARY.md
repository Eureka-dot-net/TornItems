# Statgain Formula Fix Summary

## Issue
The `/statgain` command was calculating incorrect stat gains because the formula structure didn't match Vladar's spreadsheet formula.

## Root Cause
The formula was treating the happy-related terms as separate additions with incorrect scaling, rather than multiplying the entire inner expression by the base multiplier.

### Previous (Incorrect) Formula
```typescript
const baseTerm = (1 / 200000) * dots * energyPerTrain * perkBonus * adjustedStat * happyMult;
const happyPowerTerm = (8 * Math.pow(happy, 1.05)) / 10000;
const lookup2Term = (lookup2 * (1 - Math.pow(happy / 99999, 2))) / 10000;
const lookup3Term = lookup3 / 10000;

const gain = baseTerm + happyPowerTerm + lookup2Term + lookup3Term;
```

### Corrected Formula
```typescript
const multiplier = (1 / 200000) * dots * energyPerTrain * perkBonus;
const innerExpression = 
  adjustedStat * happyMult + 
  8 * Math.pow(happy, 1.05) + 
  lookup2 * (1 - Math.pow(happy / 99999, 2)) + 
  lookup3;

const gain = multiplier * innerExpression;
```

## Spreadsheet Formula Reference
```
=(1/200000)*C3*D3*K3*(
  IF(H3<50000000, H3, (H3-50000000)/(8.77635*LOG(H3))+50000000) * 
  ROUND(1+0.07*ROUND(LN(1+G3/250),4),4) + 
  8*G3^1.05 + 
  VLOOKUP(B3,Sheet2!K1:M4,2,FALSE)*(1-(G3/99999)^2) + 
  VLOOKUP(B3,Sheet2!K1:M4,3,FALSE)
)
```

Where:
- C3 = Gym Dots
- D3 = Energy per train
- K3 = Bonus Multiplier (perk bonus)
- G3 = Happy
- H3 = Stat value

## Test Results

All test cases now match expected values exactly:

| Stat Value | Happy | Expected | Previous Result | Fixed Result | Status |
|------------|-------|----------|-----------------|--------------|---------|
| 3,000      | 4,000 | 4.80     | 5.49           | 4.80         | ✓ FIXED |
| 3,000      | 30,000| 35.46    | 40.85          | 35.46        | ✓ FIXED |
| 3,000,000  | 4,000 | 316.16   | 316.85         | 316.16       | ✓ FIXED |
| 3,000,000  | 30,000| 382.53   | 387.92         | 382.53       | ✓ FIXED |

All values tested with Pour Femme gym (3.4 dots, 5 energy) with 2% perks.

## Files Modified

1. **API/src/discord/commands/statgain.ts** - Fixed the computeStatGain function
2. **API/tests/statgain.test.ts** - Fixed the test implementation and added exact test cases
3. **STATGAIN_IMPLEMENTATION.md** - Updated documentation to reflect correct formula

## Validation

- ✅ All 12 tests pass
- ✅ Linting passes for modified files
- ✅ Type checking passes
- ✅ Manual verification confirms exact match with expected values
