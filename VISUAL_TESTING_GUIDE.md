# Visual Testing Guide for Travel Notification Feature

## Overview
This guide shows what the new features look like and how to test them.

## Feature 1: Travel Status Banner (Top of Page)

### When to See It
- Only when you are currently travelling to a **foreign destination** (not Torn)
- Shows at the very top of the Profit page, right below the title

### What It Looks Like
```
┌─────────────────────────────────────────────────────────────┐
│ ℹ  Currently Travelling to: Mexico                          │
│    Arrival in: 15m 23s | Arrival Time: 10/8/2024, 2:30 PM  │
└─────────────────────────────────────────────────────────────┘
```

### How to Test
1. Start travelling to any foreign country in Torn
2. Refresh the Profit page
3. Should see the blue info alert banner at the top
4. Banner should show destination, time remaining (counting down), and arrival time
5. When you land or travel back to Torn, banner should disappear

---

## Feature 2: Boarding Times on ALL Pages (Bottom of Page)

### When to See It
- **Always** - on every tab (Torn, Foreign, Mexico, Canada, etc.)
- Shows at the bottom of the Profit page

### What It Looks Like
```
┌─────────────────────────────────────────────────────────────┐
│ Boarding Times for Foreign Shops                            │
│ Board at these times to land exactly on a 15-minute        │
│ restock slot                                                │
│                                                             │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│ │ Mexico   │  │ Canada   │  │ Hawaii   │  ...             │
│ │ Travel:  │  │ Travel:  │  │ Travel:  │                  │
│ │ 26m      │  │ 41m      │  │ 134m     │                  │
│ │ Board:   │  │ Board:   │  │ Board:   │                  │
│ │ 14:05    │  │ 14:20    │  │ 16:15    │                  │
│ │ Time:    │  │ Time:    │  │ Time:    │                  │
│ │ 2m 15s   │  │ 17m 30s  │  │ 3h 22m   │                  │
│ │ ☐ Notify │  │ ☐ Notify │  │ ☐ Notify │                  │
│ │   Me     │  │   Me     │  │   Me     │                  │
│ └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

### How to Test
1. Navigate to the Profit page
2. Check the **Torn** tab - should see boarding times section at bottom
3. Switch to **Foreign** tab - should see boarding times section at bottom
4. Switch to **Mexico** tab - should see boarding times section at bottom
5. All tabs should consistently show the boarding times section

### Previous Behavior
- ❌ Torn tab: Did NOT show boarding times
- ✅ Foreign tab: Showed boarding times
- ✅ Individual country tabs: Showed boarding times

### New Behavior
- ✅ Torn tab: NOW shows boarding times
- ✅ Foreign tab: Still shows boarding times
- ✅ Individual country tabs: Still shows boarding times

---

## Feature 3: Country Notification Checkbox

### When to See It
- In each country card in the "Boarding Times for Foreign Shops" section
- On ALL pages (Torn, Foreign, individual countries)

### What It Looks Like
```
┌──────────────────┐
│ Mexico           │
│                  │
│ Travel Time:     │
│ 26m              │
│                  │
│ Boarding Time:   │
│ 14:05            │
│                  │
│ Time Left:       │
│ 2m 15s          │
│                  │
│ ☑ Notify Me     │  ← NEW CHECKBOX
└──────────────────┘
```

### How to Test
1. Scroll to "Boarding Times for Foreign Shops" section
2. Find a country card (e.g., Mexico)
3. Check the "Notify Me" checkbox
4. Browser should request notification permission (if not already granted)
5. Wait for the notification (10 seconds before boarding time)
6. Notification should appear with:
   - Title: "✈️ Mexico Boarding Soon"
   - Body: "Board now to land on the next restock!"
   - Icon: Torn favicon

### Testing Notification Timing
Since you might not want to wait for real boarding times, here's what happens:
- Notification is scheduled for (boarding_time - 10 seconds)
- If boarding time is in the past or less than 10 seconds away, no notification
- Timer is cleaned up if you uncheck the box or navigate away

---

## Feature 4: Item Notification Checkbox

### When to See It
- In the **expanded details** of foreign shop items
- Only when the item has travel time data
- On individual country tabs (Mexico, Canada, etc.) or Foreign tab

### What It Looks Like
```
┌─────────────────────────────────────────────────────────────┐
│ Flowers - Details                                            │
│                                                              │
│ Country: Mexico    Buy Price: $150    Market Price: $500   │
│ ...                                                          │
│                                                              │
│ Travel Time: 26m                                             │
│ Profit/Min: $3,500                                           │
│                                                              │
│ Boarding Time: 14:05                                         │
│ Boarding Time Left: 2m 15s                                   │
│ ☑ Notify Me  ← NEW CHECKBOX                                 │
└─────────────────────────────────────────────────────────────┘
```

### How to Test
1. Go to a foreign country tab (e.g., Mexico) or Foreign tab
2. Click on an item row to expand it
3. Scroll down in the expanded details
4. Find the "Boarding Time" and "Boarding Time Left" fields
5. Next to them, you should see a "Notify Me" checkbox
6. Check the checkbox
7. Wait for notification 10 seconds before the item's boarding time
8. Notification should show:
   - Title: "✈️ [Item Name] Boarding Soon"
   - Body: "Board to [Country] now to land on the next restock!"

### Note
- Item notifications use the item's specific restock time if available
- Falls back to generic 15-minute slots if no restock data
- Each item can have a different boarding time based on its restock schedule

---

## Browser Permissions

### First Time Setup
1. When you check a "Notify Me" checkbox for the first time
2. Browser will show permission prompt:
   ```
   ┌───────────────────────────────────────┐
   │ torn.com wants to:                    │
   │ Show notifications                    │
   │                                       │
   │     [Block]  [Allow]                 │
   └───────────────────────────────────────┘
   ```
3. Click "Allow"
4. Future notifications will work automatically

### If Notifications Don't Work
- Check browser notification permissions
- Make sure notifications aren't muted
- Check if "Do Not Disturb" is enabled on your OS
- Try in a different browser (Chrome, Firefox, Edge all support this)

---

## Testing Checklist

### Visual Tests
- [ ] Travel banner shows when travelling to foreign country
- [ ] Travel banner does NOT show when travelling to Torn
- [ ] Travel banner does NOT show when not travelling
- [ ] Boarding times section shows on Torn tab
- [ ] Boarding times section shows on Foreign tab
- [ ] Boarding times section shows on individual country tabs
- [ ] All country cards have "Notify Me" checkbox
- [ ] Item details have "Notify Me" checkbox (when expanded)

### Functional Tests
- [ ] Checking country notification checkbox requests permission
- [ ] Checking item notification checkbox requests permission
- [ ] Unchecking notification checkbox stops timer
- [ ] Switching tabs preserves checkbox state
- [ ] Notification appears 10s before boarding time
- [ ] Notification shows correct title and body
- [ ] Multiple notifications can be scheduled simultaneously

### Edge Cases
- [ ] Boarding time in the past - no notification
- [ ] Boarding time less than 10s away - no notification
- [ ] Navigating away from page cancels scheduled notifications
- [ ] Refreshing page clears all notification preferences
- [ ] Notifications work with browser permission denied (gracefully fails)

---

## Known Limitations

1. **Notification Preferences Not Persisted**
   - Checkboxes reset on page refresh
   - Consider this a feature (fresh slate each session)
   - Future: Could save to localStorage

2. **Notification Timing**
   - Relies on JavaScript timers (setTimeout)
   - If tab is in background, browser may delay timers
   - If computer goes to sleep, timers may not fire
   - This is a browser limitation, not a bug

3. **Multiple Notifications**
   - If you check multiple items, you'll get multiple notifications
   - Each notification fires independently
   - Consider unchecking after receiving notification

---

## Troubleshooting

### "I don't see the travel banner"
- Are you currently travelling to a foreign country?
- If travelling to Torn, banner won't show (expected)
- Try starting a new trip to Mexico or another country

### "I don't see boarding times on Torn tab"
- Make sure you're on the latest version of the code
- Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Check browser console for errors

### "Notify checkbox doesn't show"
- For items: Make sure item is expanded and has travel time data
- For countries: Should always show in boarding times section
- Try scrolling down in the expanded item details

### "Notifications aren't firing"
- Check browser notification permissions
- Check notification timing (10s before boarding time)
- Try with a closer boarding time for faster testing
- Check browser console for errors
- Make sure browser supports Notification API

### "I got permission denied"
- Go to browser settings
- Find site permissions for your domain
- Reset notification permission
- Refresh page and try again
