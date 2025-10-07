# Foreign Stock Travel Time Implementation

## Overview
This feature adds travel time calculations for foreign stock items in the Profit Analysis page. It helps players understand the profitability of buying items from foreign countries by factoring in travel time.

## Features
1. **TravelTime MongoDB Collection**: Stores travel times for each foreign country
2. **Profit Per Minute Calculation**: Calculates profit efficiency for foreign stock
3. **Foreign Tab**: Groups all foreign countries in a dedicated tab
4. **Tab Reordering**: Torn tab appears first and opens by default
5. **Private Island Support**: Accounts for 25% travel time reduction

## Database Schema

### TravelTime Collection
```typescript
{
  countryCode: string;      // e.g., "arg", "mex", "can"
  countryName: string;      // e.g., "Argentina", "Mexico", "Canada"
  travelTimeMinutes: number; // One-way travel time in minutes
  lastUpdated: Date;        // When this record was last updated
}
```

## Setup Instructions

### 1. Initialize Travel Times
Run the initialization script to populate travel times in the database:

```bash
cd API
npx ts-node scripts/initializeTravelTimes.ts
```

This script will populate the database with the following travel times:
- Argentina: 210 minutes
- Mexico: 135 minutes
- Cayman Islands: 120 minutes
- Canada: 60 minutes
- Hawaii: 180 minutes
- Switzerland: 180 minutes
- Japan: 240 minutes
- China: 240 minutes
- United Kingdom: 150 minutes
- South Africa: 270 minutes
- UAE: 240 minutes

### 2. Hardcoded Configuration
The following values are currently hardcoded in the API:
- **MAX_FOREIGN_ITEMS**: 15 (maximum items you can buy at a foreign shop)
- **PRIVATE_ISLAND_REDUCTION**: 0.25 (25% travel time reduction)
- **HAS_PRIVATE_ISLAND**: true (whether the player has a private island)

These can be found in `API/src/routes/profit.ts` and will be moved to a user configuration table in the future.

## Calculation Details

### Profit Per Minute
```
profit_per_minute = (sold_profit × MAX_FOREIGN_ITEMS) / (travel_time × 2)
```

Where:
- `sold_profit`: Average profit per item when sold
- `MAX_FOREIGN_ITEMS`: 15 (hardcoded)
- `travel_time`: One-way travel time (adjusted for private island)
- `× 2`: Accounts for round-trip travel

### Travel Time Adjustment
```
actual_travel_time = base_travel_time × (1 - PRIVATE_ISLAND_REDUCTION)
```

If `HAS_PRIVATE_ISLAND` is true:
```
actual_travel_time = base_travel_time × 0.75
```

## API Changes

### CountryItem Interface
Added two new fields:
```typescript
{
  // ... existing fields
  travel_time_minutes?: number | null;
  profit_per_minute?: number | null;
}
```

### Profit Endpoint
The `/api/profit` endpoint now:
1. Fetches travel times from the database
2. Calculates adjusted travel times (with private island reduction)
3. Calculates profit per minute for foreign items
4. Returns these values in the CountryItem objects

## UI Changes

### Profit Page (`Client/src/app/pages/Profit.tsx`)

1. **Tab Reordering**:
   - Torn tab appears first
   - Foreign tab appears second (grouping all foreign countries)
   - Individual country tabs follow alphabetically

2. **Foreign Tab Columns**:
   - Name
   - Country
   - Buy Price
   - Avg Sold
   - Sold Profit
   - Travel Time (formatted as hours/minutes)
   - Profit/Min (color-coded green for positive values)
   - 24h Sales

3. **Torn Tab Columns** (unchanged):
   - Name (with shop links)
   - Shop
   - Buy Price
   - Avg Sold
   - Sold Profit
   - 24h Sales
   - Sellout Duration
   - Next Restock

## Future Enhancements

1. **User Configuration Table**: Store per-user settings like:
   - Has private island (currently hardcoded)
   - Max items they can carry (currently hardcoded to 15)
   - Custom travel time modifiers

2. **Dynamic Travel Times**: API endpoint to update travel times without code changes

3. **Travel Route Optimization**: Suggest optimal travel routes for multiple countries

## Files Modified/Created

### Backend
- ✅ `API/src/models/TravelTime.ts` (NEW)
- ✅ `API/scripts/initializeTravelTimes.ts` (NEW)
- ✅ `API/src/routes/profit.ts` (MODIFIED)

### Frontend
- ✅ `Client/src/lib/types/profit.ts` (MODIFIED)
- ✅ `Client/src/app/pages/Profit.tsx` (MODIFIED)

## Testing

After running the initialization script and starting the server:

1. Navigate to the Profit Analysis page
2. Verify the Torn tab opens by default
3. Click on the "Foreign" tab
4. Verify all foreign items are displayed
5. Verify travel time and profit/min columns are shown
6. Click on individual country tabs to see country-specific items

## Notes

- Travel times are one-way and automatically doubled for round-trip calculations
- Profit per minute is only calculated for foreign items (not Torn items)
- The Foreign tab combines items from all foreign countries for easy comparison
