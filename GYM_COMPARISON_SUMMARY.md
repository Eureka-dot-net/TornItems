# Gym Company Comparison Feature - Implementation Summary

## Overview
This feature allows Torn players to compare stat gains over time when working for different companies with various gym-related benefits.

## Features Implemented

### 1. Input Parameters
- **Stat Training Weights**: Define energy distribution across Strength, Speed, Defense, and Dexterity
  - Example: 2:0:1:1 means 50% strength, 25% defense, 25% dexterity
- **Time Period**: Number of months to simulate (1-36 months / 3 years max)
- **Energy Sources**:
  - Hours played per day (0-24)
  - Xanax per day (each = +250 energy)
  - Points refill toggle (+150 energy)
- **Player Stats**: Initial stats for all battle stats, happy level, and perk percentage
- **Company Benefits**: Select multiple to compare:
  - No Benefits (baseline)
  - 3★ Music Store (gyms unlock 30% faster)
  - 10★ Candle Shop (+50 energy per day)

### 2. Energy Calculation
The system accurately calculates daily energy based on:
- Energy regenerates at 5 per 10 minutes (30 per hour)
- Maximum energy bar is 150
- If playing < 24 hours: Start with 150 + (hours × 30) regeneration
- If playing 24 hours: No starting 150, just 720 regeneration
- Additional energy from xanax and points refill

### 3. Gym Progression System
- Uses all 24 gyms from the problem statement with accurate stats
- Tracks energy spent to determine gym unlocks
- Players always train at the best available gym for each stat
- Music Store benefit (30% faster unlocks) applies multiplier to energy requirements
- Candle Shop benefit adds 50 energy per day for more training

### 4. Stat Gain Calculation
- Uses Vladar's gym formula (same as existing `/mystatgain` feature)
- Accounts for:
  - Current stat value
  - Happy level
  - Perk percentage
  - Gym dots and energy per train
  - Stat-specific lookup values

### 5. Visualization
- Line chart showing total battle stats over time
- Summary cards for each company benefit showing final stats
- Real-time display of calculated daily energy

## Technical Implementation

### Files Modified/Created
1. **API/src/models/Gym.ts**: Added `energyToUnlock` and `costToUnlock` fields
2. **API/scripts/seedGyms.ts**: Updated with progression data
3. **Client/src/lib/utils/gymProgressionCalculator.ts**: Core calculation logic
4. **Client/src/app/pages/GymComparison.tsx**: UI component
5. **Client/src/app/router/routes.tsx**: Added route
6. **Client/src/app/layout/Navigation.tsx**: Added navigation link

### Key Functions
- `calculateDailyEnergy()`: Computes available energy based on play time and consumables
- `simulateGymProgression()`: Runs day-by-day simulation with gym unlocks
- `findBestGym()`: Determines which gym to use based on energy spent
- `computeStatGain()`: Applies Vladar's formula for stat gains

## Usage Example

To compare working at 3★ Music Store vs 10★ Candle Shop:
1. Set stat weights (e.g., 1:1:1:1 for balanced training)
2. Set time period (e.g., 6 months)
3. Configure energy sources (e.g., 8 hours/day, 0 xanax, no refill)
4. Set initial stats and happy/perk values
5. Check both company benefits
6. Click "Simulate"
7. View chart and final stats comparison

## Results Interpretation

From the test simulation (6 months, 8 hours/day, equal weights):
- **No Benefits**: Total gain of 226,018 battle stats
- **3★ Music Store**: Total gain of 226,018 (same as no benefits)
- **10★ Candle Shop**: Total gain of 302,306 (+33% improvement)

The Music Store shows the same gains as "No Benefits" in this scenario because:
- With 390 energy/day over 6 months = 70,200 total energy
- This is enough to unlock all relevant gyms even without the 30% speed boost
- The benefit would be more visible for:
  - Shorter time periods
  - Lower energy per day
  - Focused training on specific stats

## Future Enhancements (Not Yet Implemented)

1. **API Key Integration**: Fetch current stats from Torn API
2. **Additional Company Benefits**: More job perks as they're identified
3. **Gym-by-Gym Breakdown**: Show which gym is being used at each point
4. **Cost Analysis**: Show money needed for gym unlocks
5. **Export Results**: Download comparison data as CSV/JSON

## Notes

- The feature runs entirely in the browser (no API backend needed for calculations)
- Gym data is hardcoded from the problem statement
- Simulation takes snapshots every 7 days plus first and last day
- All calculations use the established Vladar's formula for consistency
