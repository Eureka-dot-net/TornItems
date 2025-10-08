# Profit Page Travel Notification Feature

## Summary
This feature adds comprehensive travel notifications and boarding time visibility to the Profit page, helping users stay informed about optimal boarding times for foreign shop runs.

## Changes Implemented

### 1. Travel Status Banner (Task 4)
**Location:** Top of the Profit page

**Implementation:**
- Added an Alert banner that displays when the user is currently travelling to a foreign destination
- Shows:
  - Current destination name
  - Time remaining until arrival (formatted countdown)
  - Arrival time (formatted as local time)
- Only displays when `travel_status` exists and destination is not 'Torn'

**Code:**
```tsx
{profitData?.travel_status && profitData.travel_status.destination !== 'Torn' && (
    <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body1">
            <strong>Currently Travelling to: {profitData.travel_status.destination}</strong>
        </Typography>
        <Typography variant="body2">
            Arrival in: {formatBoardingTimeLeft(profitData.travel_status.time_left)} | 
            Arrival Time: {new Date(profitData.travel_status.arrival_at * 1000).toLocaleString()}
        </Typography>
    </Alert>
)}
```

### 2. Boarding Times Section on All Pages (Task 1)
**Location:** Bottom of the Profit page

**Changes:**
- Previously only showed on Foreign and individual country pages
- Now shows on **ALL** tabs, including the Torn tab
- Provides quick visibility of all foreign destinations and their boarding times

**Implementation:**
```tsx
// OLD: Only showed on foreign pages
{(selectedCountry === 'Foreign' || (selectedCountry !== 'Torn' && selectedCountry !== 'Unknown')) && ...}

// NEW: Shows on all pages
{foreignCountriesWithTravelTimes.length > 0 && ...}
```

### 3. Country Notification Checkboxes (Task 2)
**Location:** Each country card in the Boarding Times section

**Features:**
- "Notify Me" checkbox for each country
- Sends Windows notification 10 seconds before boarding time
- Uses browser Notification API with permission request
- Follows pattern from `Extension/injector-travel.js`

**Notification Format:**
- **Title:** `✈️ {Country Name} Boarding Soon`
- **Body:** "Board now to land on the next restock!"
- **Icon:** Torn favicon

**Implementation:**
```tsx
<FormControlLabel
    control={
        <Checkbox
            checked={countryNotifications.get(country.code) || false}
            onChange={(e) => {
                const newMap = new Map(countryNotifications);
                if (e.target.checked) {
                    newMap.set(country.code, true);
                } else {
                    newMap.delete(country.code);
                }
                setCountryNotifications(newMap);
            }}
        />
    }
    label="Notify Me"
/>
```

### 4. Item Notification Checkboxes (Task 3)
**Location:** Expanded item details in foreign shop items (when travel time is available)

**Features:**
- "Notify Me" checkbox for individual items
- Sends Windows notification 10 seconds before item's specific boarding time
- Only shows when item has travel time data
- Accounts for item's specific restock schedule

**Notification Format:**
- **Title:** `✈️ {Item Name} Boarding Soon`
- **Body:** `Board to {Country} now to land on the next restock!`
- **Icon:** Torn favicon

**Implementation:**
```tsx
{item.travel_time_minutes && item.travel_time_minutes > 0 && (
    <Grid size={{ xs: 12, sm: 4 }}>
        <FormControlLabel
            control={
                <Checkbox
                    checked={itemNotifications.get(item.id) || false}
                    onChange={(e) => {
                        const newMap = new Map(itemNotifications);
                        if (e.target.checked) {
                            newMap.set(item.id, true);
                        } else {
                            newMap.delete(item.id);
                        }
                        setItemNotifications(newMap);
                    }}
                />
            }
            label="Notify Me"
        />
    </Grid>
)}
```

## Notification System

### Architecture
- Uses browser's native Notification API
- Requests permission on first notification attempt
- Schedules notifications using `setTimeout`
- Cleans up timeouts when component unmounts or dependencies change

### Timing
- Notifications fire **10 seconds before** boarding time
- Calculated as: `(boardingTime - currentTime) - 10000ms`
- Only schedules if notification time is in the future

### Permission Handling
```tsx
const sendNotification = (title: string, body: string) => {
    try {
        if (Notification.permission === "granted") {
            new Notification(title, { body, icon: "https://www.torn.com/favicon.ico" });
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then((permission) => {
                if (permission === "granted") {
                    new Notification(title, { body, icon: "https://www.torn.com/favicon.ico" });
                }
            });
        }
    } catch (error) {
        console.error("Notification error:", error);
    }
};
```

## State Management

### New State Variables
```tsx
// Track notification preferences for countries
const [countryNotifications, setCountryNotifications] = useState<Map<string, boolean>>(new Map());

// Track notification preferences for items
const [itemNotifications, setItemNotifications] = useState<Map<number, boolean>>(new Map());
```

### Effects
- **Country Notifications Effect:** Monitors `countryNotifications` and `foreignCountriesWithTravelTimes`
- **Item Notifications Effect:** Monitors `itemNotifications` and `sortedData`
- Both effects clean up scheduled timeouts on unmount/dependency change

## User Experience

### Visual Indicators
1. **Travel Banner:** Blue info alert with bold destination name
2. **Notify Checkboxes:** Clear checkboxes with "Notify Me" label
3. **Countdown Timers:** Live-updating time remaining displays

### Workflow
1. User views boarding times on any tab (Torn, Foreign, or specific country)
2. User checks "Notify Me" on desired countries or items
3. Browser requests notification permission if needed
4. User grants permission
5. Notification fires 10 seconds before boarding time
6. User boards at optimal time to land on restock

## Technical Details

### Files Modified
- `Client/src/app/pages/Profit.tsx` (+202 lines)

### Dependencies
- No new dependencies added
- Uses existing Material-UI components
- Uses browser's native Notification API

### Browser Compatibility
- Requires browser with Notification API support
- Graceful degradation if notifications are blocked or unsupported

## Testing Checklist
- [x] TypeScript compilation successful
- [x] Build completes without errors
- [x] No console errors on load
- [ ] Manual testing: Travel banner displays when travelling
- [ ] Manual testing: Boarding times show on all tabs
- [ ] Manual testing: Country notifications work
- [ ] Manual testing: Item notifications work
- [ ] Manual testing: Notification permission request works

## Future Enhancements (Optional)
- Persist notification preferences in localStorage
- Add sound to notifications
- Add notification for when user lands at destination
- Add "Snooze" functionality for notifications
- Add notification history/log
