# Pull Request Summary: Profit API Foreign Items & Travel Status

## Changes Overview

This PR implements the following features as requested:

1. ✅ Profit API returns hardcoded `max_foreign_items` (15)
2. ✅ Profit API returns current `travel_status` from Torn API
3. ✅ "Multiply by 15" checkbox on all foreign pages (default: checked)
4. ✅ Item selection checkboxes (only when travelling to that destination)
5. ✅ "Watch" button with proper URL generation (only when travelling to that destination)

## Files Changed (6 files, +658 lines)

### Backend (2 files)

#### `API/src/utils/tornApi.ts` (+50 lines)
- Added `TravelStatus` interface (exported)
- Added `fetchTravelStatus()` function to call Torn API v2 `/user/travel` endpoint
- Returns travel status or null (graceful error handling)
- Uses same patterns as existing `fetchAndStoreBattleStats()` function

#### `API/src/routes/profit.ts` (+10 lines)
- Import `fetchTravelStatus` and `TravelStatus`
- Fetch travel status using API key from environment
- Add `max_foreign_items: 15` to response
- Add `travel_status` to response

### Frontend (2 files)

#### `Client/src/lib/types/profit.ts` (+10 lines)
- Added `TravelStatus` interface
- Updated `ProfitData` to include `max_foreign_items` and `travel_status`

#### `Client/src/app/pages/Profit.tsx` (+140 lines)
- Added state: `multiplyByAmount` (default: true), `selectedItems` (Map)
- Added helper: `applyMultiplier()` - multiplies values when checkbox checked
- Added helper: `isTravellingToCountry()` - checks if travelling to specific destination
- Added helper: `handleItemSelection()` - manages item selection (max 3)
- Added helper: `buildWatchUrl()` - generates Torn watch URL
- Added UI: "Multiply by X" checkbox (shown on Foreign and all country tabs)
- Added UI: "Watch" button (shown only on country tabs when travelling there)
- Added UI: Item checkboxes with position numbers (shown only on country tabs when travelling there)
- Updated: All profit values use `applyMultiplier()` in display
- Updated: Headers include "Select" column when checkboxes visible

### Documentation (2 files)

#### `PROFIT_FOREIGN_ITEMS_IMPLEMENTATION.md` (+248 lines)
- Complete technical documentation
- Backend API changes explained
- Frontend UI changes explained
- Helper functions documented
- Example scenarios provided
- Testing steps outlined

#### `PROFIT_UI_FLOW.md` (+211 lines)
- Visual layout examples for different scenarios
- State-based behavior matrix
- Watch URL format explained
- Multiplication logic detailed
- Item selection logic walkthrough
- Travel status states documented

## Testing Performed

### Build & Lint Status
```bash
✅ API build (tsc)
✅ API lint (eslint)
✅ API typecheck (tsc --noEmit)
✅ Client build (vite)
✅ Client lint (eslint)
```

### Code Quality
- No new lint warnings
- No TypeScript errors
- Follows existing code patterns
- Minimal, surgical changes
- Proper error handling

## Key Implementation Decisions

### 1. Graceful Degradation
If the Torn API key is missing or the travel API fails, the system gracefully returns `travel_status: null` instead of throwing an error. The UI simply doesn't show the Watch button or item checkboxes.

### 2. Travel Home Detection
When `travel_status.destination === "Torn"`, this is treated as "not travelling" (no Watch button/checkboxes shown). This prevents confusion when returning home.

### 3. Multiply by Default
The "Multiply by X" checkbox is checked by default, showing total costs immediately. This makes it easier for users to understand the total investment needed.

### 4. Position Control
Selected items show their position number (#1, #2, #3) next to the checkbox, giving users clear visibility of which item maps to item1, item2, item3 in the Watch URL.

### 5. Foreign Tab Behavior
The "Foreign" tab (which combines all countries) shows the multiply checkbox but NOT the Watch button or item checkboxes, since it displays multiple countries and you can't travel to "all countries" at once.

### 6. Values Multiplied
Only purchase/profit values are multiplied:
- ✅ Buy Price
- ✅ All profit metrics (sold_profit, profitPer1, etc.)
- ✅ Profit per minute

Market data is NOT multiplied:
- ❌ Avg Sold Price (market price, not purchase price)
- ❌ 24h Sales (count, not value)
- ❌ In Stock (count, not value)

## Watch URL Format

Example when selecting 3 items (IDs: 18, 159, 132) and travelling to Mexico (arrival: 1738941300):

```
https://www.torn.com/index.php?item1=18&item2=159&item3=132&amount=15&arrival=1738941300
```

Parameters:
- `item1`, `item2`, `item3` - Item IDs in user's selected order
- `amount` - Value from `max_foreign_items` (15)
- `arrival` - Unix timestamp from `travel_status.arrival_at`

## Usage Examples

### Scenario 1: Not Travelling
- **Foreign Tab**: Shows "Multiply by 15" checkbox ✅
- **Mexico Tab**: Shows "Multiply by 15" checkbox ✅
- **Watch Features**: None shown ❌

### Scenario 2: Travelling to Mexico  
- **Foreign Tab**: Shows "Multiply by 15" checkbox ✅
- **Mexico Tab**: Shows "Multiply by 15" ✅, Item checkboxes ✅, Watch button ✅
- **Canada Tab**: Shows "Multiply by 15" checkbox ✅
- **Watch Features**: Only on Mexico tab ✅

### Scenario 3: Using Watch Feature
1. Navigate to Mexico tab while travelling to Mexico
2. See "Multiply by 15" checkbox (checked) and disabled "Watch (0/3)" button
3. Click checkbox next to Xanax → Shows "#1", button shows "Watch (1/3)"
4. Click checkbox next to Erotic DVD → Shows "#2", button shows "Watch (2/3)"
5. Click checkbox next to Plushie → Shows "#3", button shows "Watch (3/3)"
6. Click "Watch" button → Opens Torn URL with those 3 items in new tab
7. Uncheck "Multiply by 15" → Prices update to show per-item values
8. Check "Multiply by 15" → Prices update to show total costs (×15)

## API Compatibility

### Request (unchanged)
```
GET /api/profit
```

### Response (new fields added)
```json
{
  "count": 100,
  "countries": 12,
  "max_foreign_items": 15,           // NEW
  "travel_status": {                 // NEW (or null)
    "destination": "Mexico",
    "method": "Airstrip",
    "departed_at": 1759912083,
    "arrival_at": 1759913103,
    "time_left": 916
  },
  "results": {
    "Mexico": [...],
    "Canada": [...]
  }
}
```

**Backwards Compatible**: ✅ Existing fields unchanged, only new fields added

## Environment Variables Required

The implementation uses the existing `TORN_API_KEY` environment variable:

```bash
TORN_API_KEY=your_torn_api_key_here
```

If not set, `travel_status` will be `null` (graceful degradation).

## Next Steps / Future Enhancements

Potential improvements for future PRs:
- [ ] Add ability to manually reorder selected items (drag & drop)
- [ ] Persist selected items in localStorage across page refreshes  
- [ ] Add countdown timer showing time until arrival
- [ ] Allow users to configure max_foreign_items (if they don't have full capacity)
- [ ] Add tooltips explaining the Watch button functionality
- [ ] Add copy-to-clipboard button for Watch URL

## Migration Notes

No database migrations required. No breaking changes. Fully backwards compatible.

Users will see the new features immediately after deployment:
1. "Multiply by X" checkbox will appear (checked by default)
2. If travelling, Watch button and item checkboxes will appear automatically
3. All profit values will show multiplied amounts by default

## Review Checklist

- [x] Code builds successfully (API & Client)
- [x] Code passes linting (API & Client)
- [x] TypeScript types are correct
- [x] Follows existing code patterns
- [x] Error handling is proper
- [x] Documentation is comprehensive
- [x] UI changes are intuitive
- [x] Backwards compatible
- [x] No breaking changes
