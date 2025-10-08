# Profit API Foreign Items & Travel Status Implementation

## Overview
This implementation adds support for:
1. Returning the max foreign items amount (15) from the profit API
2. Fetching and returning current travel status from Torn API
3. "Multiply by 15" checkbox on foreign pages (default: checked)
4. Item selection with checkboxes when travelling to a specific country
5. "Watch" button to generate URL with selected items and arrival time

## Backend Changes

### 1. API Response Updates (`API/src/routes/profit.ts`)

Added two new fields to the profit API response:
```typescript
{
  count: number;
  countries: number;
  max_foreign_items: number;        // NEW - hardcoded to 15
  travel_status: TravelStatus | null; // NEW - from Torn API
  results: GroupedByCountry;
}
```

The route now:
- Fetches travel status using `fetchTravelStatus()` with API key from environment
- Includes `MAX_FOREIGN_ITEMS` (15) in the response
- Returns travel status (or null if not travelling)

### 2. Travel Status Utility (`API/src/utils/tornApi.ts`)

Added new exported interface and function:

```typescript
export interface TravelStatus {
  destination: string;
  method: string;
  departed_at: number;
  arrival_at: number;
  time_left: number;
}

export async function fetchTravelStatus(apiKey: string): Promise<TravelStatus | null>
```

The function:
- Calls `https://api.torn.com/v2/user/travel?key={key}`
- Returns `TravelStatus` if user is travelling (and destination is not "Torn")
- Returns `null` if not travelling or travelling back home
- Returns `null` on error (graceful degradation - travel status is optional)

## Frontend Changes

### 1. Type Updates (`Client/src/lib/types/profit.ts`)

Added interfaces:
```typescript
export interface TravelStatus {
  destination: string;
  method: string;
  departed_at: number;
  arrival_at: number;
  time_left: number;
}

export interface ProfitData {
  count: number;
  countries: number;
  max_foreign_items: number;        // NEW
  travel_status: TravelStatus | null; // NEW
  results: GroupedByCountry;
}
```

### 2. Profit Page Updates (`Client/src/app/pages/Profit.tsx`)

#### New State Variables:
- `multiplyByAmount: boolean` - Controls multiplication (default: true)
- `selectedItems: Map<number, number>` - Maps itemId to position (1, 2, or 3)

#### New Helper Functions:

**`applyMultiplier(value)`**
- Multiplies value by `max_foreign_items` when checkbox is checked
- Used for: buy_price, profitPer1, sold_profit, estimated_market_value_profit, lowest_50_profit, profit_per_minute

**`isTravellingToCountry(country)`**
- Returns true if user is travelling to the specified country
- Returns false if travelling home (destination === 'Torn') or not travelling

**`handleItemSelection(itemId, checked)`**
- Manages item selection for watch list
- Automatically assigns positions 1, 2, 3 in order of selection
- Limits selection to 3 items maximum

**`buildWatchUrl()`**
- Builds URL: `https://www.torn.com/index.php?item1=X&item2=Y&item3=Z&amount=15&arrival=TIMESTAMP`
- Uses selected items in their assigned order
- Includes `max_foreign_items` as amount
- Includes `arrival_at` from travel status

#### UI Changes:

**Top Controls (Foreign & Individual Country Pages):**
```tsx
<FormControlLabel
  control={<Checkbox checked={multiplyByAmount} />}
  label="Multiply by 15"
/>
```
- Shown on "Foreign" tab and all individual country tabs
- Default: checked
- When unchecked, shows base values (per 1 item)

**Watch Button (Individual Country Pages Only, When Travelling):**
```tsx
<Button
  variant="contained"
  disabled={selectedItems.size === 0}
  href={buildWatchUrl()}
>
  Watch ({selectedItems.size}/3)
</Button>
```
- Only shown when `isTravellingToCountry(selectedCountry)` returns true
- Disabled when no items selected
- Opens Torn watch URL in new tab

**Item Checkboxes (Individual Country Pages Only, When Travelling):**
- Added new column in header: "Select"
- Each item row has checkbox with position number (e.g., "#1", "#2", "#3")
- User can select up to 3 items
- Selection order determines item1, item2, item3 in watch URL
- Checkbox prevents row expansion on click

**Value Display:**
All profit-related values are multiplied when checkbox is checked:
- Buy Price (in main view and details)
- Profit Per 1 (in details)
- Sold Profit (in main view and details)
- Estimated Market Value Profit (in details)
- Lowest 50 Profit (in details)
- Profit/Min (in main view and details)

Note: Average Sold Price, 24h Sales, and other metrics are NOT multiplied (they're market data, not purchase/profit calculations)

## Example Scenarios

### Scenario 1: Not Travelling
- Profit API returns `travel_status: null`
- "Multiply by 15" checkbox shown on all foreign pages
- NO checkboxes shown next to items
- NO "Watch" button shown

### Scenario 2: Travelling to Mexico
- Profit API returns:
  ```json
  {
    "travel_status": {
      "destination": "Mexico",
      "method": "Airstrip",
      "departed_at": 1759912083,
      "arrival_at": 1759913103,
      "time_left": 916
    }
  }
  ```
- "Multiply by 15" checkbox shown on all foreign pages
- Mexico tab shows:
  - Checkboxes next to each item (with position numbers)
  - "Watch" button at top (shows count: "Watch (2/3)")
- Other country tabs (Canada, Hawaii, etc.) show NO checkboxes or Watch button

### Scenario 3: Travelling Home (destination: "Torn")
- Profit API returns travel_status with `destination: "Torn"`
- Treated same as "Not Travelling" (no checkboxes or Watch button)

## Testing

### Manual Testing Steps:
1. **Test Multiply Checkbox (Foreign Tab):**
   - Navigate to Foreign tab
   - Verify checkbox is present and checked by default
   - Note the buy price and profit values
   - Uncheck the box - values should divide by 15
   - Re-check the box - values should multiply by 15

2. **Test Multiply Checkbox (Country Tab - Not Travelling):**
   - Navigate to any country tab (e.g., Mexico)
   - Verify checkbox is present and checked by default
   - Verify NO item checkboxes are shown
   - Verify NO "Watch" button is shown
   - Test multiply/divide functionality

3. **Test Watch Feature (When Travelling):**
   - Start travelling to a country (e.g., Mexico)
   - Navigate to Mexico tab
   - Verify "Multiply by 15" checkbox is present
   - Verify checkboxes appear next to each item
   - Verify "Watch" button appears but is disabled
   - Select first item - verify checkbox shows "#1"
   - Verify "Watch" button shows "Watch (1/3)" and is enabled
   - Select second item - verify checkbox shows "#2"
   - Select third item - verify checkbox shows "#3"
   - Try to select fourth item - should be disabled
   - Click "Watch" button - should open Torn URL in new tab
   - Verify URL format: `https://www.torn.com/index.php?item1=X&item2=Y&item3=Z&amount=15&arrival=TIMESTAMP`

4. **Test Multiply with Watch:**
   - With items selected and travelling
   - Toggle multiply checkbox
   - Verify selected items' profits update correctly
   - Verify Watch URL still works (it uses item IDs, not prices)

### Build Verification:
```bash
# API
cd API
npm run build    # ✓ Passed
npm run lint     # ✓ Passed
npm run typecheck # ✓ Passed

# Client
cd Client
npm run build    # ✓ Passed
npm run lint     # ✓ Passed
```

## Files Modified

### Backend:
- `API/src/routes/profit.ts` - Added max_foreign_items and travel_status to response
- `API/src/utils/tornApi.ts` - Added TravelStatus interface and fetchTravelStatus function

### Frontend:
- `Client/src/lib/types/profit.ts` - Added TravelStatus interface, updated ProfitData interface
- `Client/src/app/pages/Profit.tsx` - Added multiply checkbox, item selection, watch button, and all related logic

## Notes

- The `max_foreign_items` value is hardcoded to 15 in the API
- The travel status is fetched using the API key from `process.env.TORN_API_KEY`
- If the API key is missing or the request fails, travel_status will be null (graceful degradation)
- The multiply checkbox is checked by default as specified in requirements
- The watch URL follows the exact format specified in requirements
- Item selection is limited to 3 items as per Torn game mechanics
- The position numbering allows users to control which item is item1, item2, item3 in the watch URL
