# Watch Items Feature Implementation

## Overview
This implementation adds the ability to "watch" up to 3 items from foreign shops when traveling in Torn. When the user is traveling, they can select items and click "Start Watching" to open a Torn URL that monitors those items.

## Changes Made

### 1. API Changes (`API/src/`)

#### `utils/tornApi.ts`
- Added `TravelStatus` interface to represent Torn API v2 travel data
- Added `TornTravelResponse` interface for API response structure
- Added `fetchTravelStatus()` function that:
  - Calls `https://api.torn.com/v2/user/travel?key={key}`
  - Returns travel status if user is traveling
  - Returns `null` if user is not traveling or API call fails
  - Handles errors gracefully without throwing

#### `routes/profit.ts`
- Updated GET `/profit` endpoint to:
  - Accept API key via query parameter (`?key=xxx`) or header (`x-api-key`)
  - Call `fetchTravelStatus()` if API key is provided
  - Include `travelStatus` in response (optional field)
- Added import for `fetchTravelStatus` and `TravelStatus` from `utils/tornApi`

### 2. Client Changes (`Client/src/`)

#### `lib/types/profit.ts`
- Added `TravelStatus` interface matching API structure
- Updated `ProfitData` interface to include optional `travelStatus` field

#### `lib/hooks/useProfit.ts`
- Updated hook to accept optional `apiKey` parameter
- Passes API key as query parameter when provided
- Includes API key in query cache key for proper caching

#### `app/pages/Profit.tsx`

**State Management:**
- Added `apiKey` state (persisted to localStorage)
- Added `watchedItems` state (Set of item IDs, max 3)
- Added `useEffect` to save API key to localStorage

**Helper Functions:**
- `handleToggleWatchItem(itemId)`: Toggle item in watch list (max 3)
- `buildWatchUrl()`: Builds Torn URL with format:
  ```
  https://www.torn.com/index.php?item1={id}&item2={id}&item3={id}&amount=15&arrival={timestamp}
  ```
- `handleStartWatching()`: Opens watch URL in new tab
- Computed `isTraveling` and `canWatch` flags

**UI Components:**
- Added watch items section (blue background) at top of page
  - Shows when viewing foreign countries
  - Displays travel status when traveling
  - Shows API key input when not traveling
  - Shows "Start Watching" button when traveling (disabled if no items selected)
- Added checkbox column to foreign items list
  - Only visible when user is traveling
  - Checkboxes are disabled if 3 items already selected
  - Clicking checkbox doesn't trigger row expansion
- Added "Watch" header column for checkboxes
- Adjusted grid column sizes to accommodate checkbox when traveling

### 3. Tests

#### `API/tests/tornApi.test.ts`
Created comprehensive tests for `fetchTravelStatus()`:
- Returns travel status when user is traveling
- Returns null when user is not traveling
- Returns null when API call fails
- Handles API errors gracefully

## Usage

### For Users

1. **Navigate to a foreign country tab** (e.g., Mexico, Canada, etc.) or the "Foreign" tab
2. **Enter your Torn API key** in the input field at the top
   - The key is saved to localStorage for convenience
3. **If you're currently traveling**, you'll see:
   - Your destination in the header
   - Checkboxes next to each item
   - A count of selected items (e.g., "2/3 selected")
4. **Select up to 3 items** by clicking their checkboxes
5. **Click "Start Watching"** to open the Torn URL
   - This opens a new tab with the selected items to watch
   - The `arrival` parameter is set to your actual arrival time

### For Developers

**API Endpoint:**
```
GET /api/profit?key=YOUR_TORN_API_KEY
```

**Response includes:**
```json
{
  "count": 123,
  "countries": 5,
  "results": { ... },
  "travelStatus": {
    "destination": "Mexico",
    "method": "Airstrip",
    "departed_at": 1759912083,
    "arrival_at": 1759913103,
    "time_left": 916
  }
}
```

**Watch URL Format:**
```
https://www.torn.com/index.php?item1=1429&item2=132&item3=159&amount=15&arrival=1738941300
```

Where:
- `item1`, `item2`, `item3`: Item IDs to watch (up to 3)
- `amount`: Fixed at 15 (max items per trip)
- `arrival`: Unix timestamp from travel status

## Error Handling

- If API key is invalid/missing: Travel status is not fetched, user sees input to add key
- If user is not traveling: Returns null, UI shows message to start traveling
- If Torn API fails: Gracefully returns null, doesn't break the profit endpoint
- If no items selected: "Start Watching" button is disabled

## Security Considerations

- API key is stored in browser localStorage (client-side only)
- API key is sent as query parameter (consider using header for production)
- Travel API call is made server-side to avoid CORS issues
- Failed API calls are logged but don't expose sensitive data

## Future Enhancements

1. Add authentication system instead of raw API keys
2. Store watched items in localStorage/database
3. Add notifications when items restock
4. Support watching items across multiple trips
5. Add item watch history/analytics
