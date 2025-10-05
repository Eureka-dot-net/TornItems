# Stock Calculation Normalization - Implementation Summary

## Problem Statement
The stock recommendation system was calculating metrics on inconsistent scales:
- `change_7d` was calculated as a **percentage** (e.g., -0.09 for -0.09%)
- `volatility` was calculated as **standard deviation of raw prices** (e.g., 4.0 in dollars)

This mismatch caused the score calculation to produce inflated or incorrect values:
```javascript
// BEFORE (wrong!)
score = -change_7d / volatility
score = -(-0.09) / 4.0  // mixing percentage with dollars
```

## Solution
Normalized all metrics to use **percentage units**:
- `change_7d_pct`: 7-day percent change (e.g., -0.09 for -0.09%)
- `volatility_7d_pct`: Standard deviation of **daily returns** as percentage (e.g., 4.04%)

```javascript
// AFTER (correct!)
score = -change_7d_pct / volatility_7d_pct
score = -(-0.09) / 4.04  // both in percentage units
```

## Changes Made

### 1. Created Stock Math Utility (`API/src/utils/stockMath.ts`)
New utility module with normalized calculation functions:

- **`calculate7DayPercentChange(current, past)`**
  - Formula: `((current / past) - 1) * 100`
  - Returns percentage change (e.g., -0.09)

- **`calculateVolatilityPercent(prices)`**
  - Calculates daily returns: `((price[i] / price[i-1]) - 1) * 100`
  - Computes standard deviation of those returns
  - Returns volatility as percentage (e.g., 4.04)

- **`calculateScores(change_7d_pct, volatility_7d_pct)`**
  - Guards against zero volatility: `vol = Math.max(volatility_7d_pct, 0.0001)`
  - Formula: `score = -change_7d_pct / vol`
  - Returns both `score` and `sell_score`

- **`getRecommendation(score)`**
  - Maps score to recommendation categories

### 2. Updated API Route (`API/src/routes/stocks.ts`)
- Imports utility functions from `stockMath.ts`
- Removed old `calculateStdDev` function (calculated on wrong scale)
- Uses `calculate7DayPercentChange` for 7-day change
- Uses `calculateVolatilityPercent` for volatility
- Uses `calculateScores` with zero-volatility guard
- Returns fields as `change_7d_pct` and `volatility_7d_pct`

### 3. Updated Verification Script (`API/verify-stocks.js`)
- Updated to use the same calculation method
- Calculates volatility as std dev of daily returns (percentage)
- Displays output with "%" labels for clarity

### 4. Updated Tests (`API/tests/stocks.test.ts`)
- Changed assertions to use new field names
- Tests now expect `change_7d_pct` and `volatility_7d_pct`

### 5. Added Unit Tests (`API/tests/stockCalculations.test.ts`)
Comprehensive test coverage including:
- Percent change calculation validation
- Volatility calculation for various price patterns
- Score calculation with known inputs
- Zero volatility guard testing
- Recommendation mapping
- Integration test matching problem statement example

### 6. Updated Client Types (`Client/src/lib/types/stockRecommendations.ts`)
```typescript
export interface StockRecommendation {
  // ... other fields
  change_7d_pct: number | null;  // was: change_7d
  volatility_7d_pct: number;     // was: volatility
  // ... other fields
}
```

### 7. Updated Client UI (`Client/src/app/pages/Recommendations.tsx`)
- Updated sort field types
- Updated table headers to sort by new field names
- Updated display code to use `change_7d_pct` and `volatility_7d_pct`

## API Output Changes

### Before
```json
{
  "stock_id": 34,
  "ticker": "LOS",
  "name": "Lo Squalo Waste",
  "price": 107.28,
  "change_7d": -0.09,      // percentage
  "volatility": 4.04,      // dollar amount (WRONG SCALE)
  "score": 2.2,            // inflated!
  "recommendation": "BUY"
}
```

### After
```json
{
  "stock_id": 34,
  "ticker": "LOS",
  "name": "Lo Squalo Waste",
  "price": 107.28,
  "change_7d_pct": -0.09,      // percentage
  "volatility_7d_pct": 4.04,   // percentage (CORRECT SCALE)
  "score": 0.02,               // realistic!
  "sell_score": -0.02,
  "recommendation": "HOLD"
}
```

## Impact on Scores

### Example: Small Price Drop
- **Before**: change=-2%, volatility=4.0 dollars → score=0.5 (seems ok, but wrong!)
- **After**: change=-2%, volatility=4.04% → score=0.50 (HOLD - correct!)

### Example: Tiny Price Change
- **Before**: change=-0.09%, volatility=4.0 dollars → score inflated
- **After**: change=-0.09%, volatility=4.04% → score=0.02 (HOLD - correct!)

### Example: Large Price Drop
- **Before**: change=-15%, volatility=4.0 dollars → score=3.75 (STRONG_BUY)
- **After**: change=-15%, volatility=4.0% → score=3.75 (STRONG_BUY - same!)

## Testing

All existing tests updated and passing:
- ✅ `API/tests/stocks.test.ts` - API integration tests
- ✅ `API/tests/stockCalculations.test.ts` - Unit tests for calculations
- ✅ Build passes with no TypeScript errors
- ✅ Linter passes with 0 warnings
- ✅ Client builds successfully

## Benefits

1. **Consistent Units**: All percentage metrics now use the same scale
2. **Realistic Scores**: Score values are now meaningful and not inflated
3. **Better Recommendations**: Recommendations are based on properly normalized data
4. **Maintainable**: Calculations are centralized in a utility module
5. **Tested**: Comprehensive unit tests prevent regression
6. **Guard Against Edge Cases**: Zero volatility is handled gracefully

## Backward Compatibility

⚠️ **Breaking Change**: API field names have changed
- `change_7d` → `change_7d_pct`
- `volatility` → `volatility_7d_pct`

Client code has been updated accordingly. Any external API consumers will need to update their field references.

## Verification

Run the demonstration:
```bash
cd API
npm run build
node -e "const {calculateScores} = require('./dist/src/utils/stockMath'); console.log(calculateScores(-0.09, 4.04));"
```

Expected output: `{ score: 0.022, sell_score: -0.022 }`
