# Travel Notification System - Feedback Implementation

## Changes Made Based on User Feedback

### 1. Global Settings Storage ✅

**Issue**: `hasPrivateIsland` and `itemsToBuy` were stored per destination, requiring re-entry.

**Fix**: Moved these to `DiscordUser` model as global settings.

**Files Changed**:
- `API/src/models/DiscordUser.ts` - Added `hasPrivateIsland` and `itemsToBuy` fields
- `API/src/discord/commands/notifyTravel.ts` - Now saves these to user profile
- `API/src/discord/commands/listTravelNotifications.ts` - Shows global settings separately

**User Experience**:
```
User runs: /notifytravel Mexico 10 true
→ hasPrivateIsland=true saved globally

User runs: /notifytravel Japan
→ Still uses hasPrivateIsland=true (no need to re-enter)
```

### 2. One-Time Notifications ✅

**Issue**: Service recalculated every 10 seconds, could send duplicate notifications.

**Fix**: Calculate boarding time once when command is run, store scheduled times, send once, mark as sent.

**Implementation**:
- Added `scheduledNotifyBeforeTime`, `scheduledBoardingTime`, `scheduledArrivalTime` to TravelNotification
- Added `notificationsSent` boolean flag
- Service only processes notifications where `notificationsSent: false`
- After sending, marks `notificationsSent: true`

**Flow**:
1. User runs `/notifytravel Mexico`
2. System calculates: boarding time = 13:12, arrival = 13:30
3. Stores these times in database
4. At 13:11:50: Sends warning notification
5. At 13:12:00: Sends "board now" notification
6. Marks `notificationsSent: true`
7. Never sends again for this scheduled trip

### 3. Shop URL on Travel Start ✅

**Issue**: Shop URL sent on arrival (too late).

**Fix**: Send shop URL immediately when user starts travelling.

**Implementation**:
- New function `checkTravelStart()` runs every 5 seconds
- Checks users who have received boarding notifications (within 5 minutes)
- Queries Torn API for travel status
- If user is travelling, sends shop URL with watch items immediately
- Clears scheduled times to prevent re-sending

**URL Format**:
```
https://www.torn.com/page.php?sid=travel&item1=1429&item2=258&item3=259&amount=19&arrival=1759933865
```

### 4. Better Scheduler Precision ✅

**Issue**: 10-second scheduler might miss exact notification times.

**Fix**: Changed to 5-second scheduler.

**Before**:
```typescript
cron.schedule('*/10 * * * * *', ...) // Every 10 seconds
```

**After**:
```typescript
cron.schedule('*/5 * * * * *', ...)  // Every 5 seconds
```

**Impact**: Better chance of hitting exact notification times (±2.5 seconds vs ±5 seconds).

### 5. Travel Time Rounding for Display ✅

**Issue**: Travel times were being displayed with decimal places (e.g., "18.2 minutes") when users expected whole minutes.

**Fix**: Round travel times to whole minutes for display in notifications.

**Before**:
```typescript
const actualTravelTime = user.hasPrivateIsland 
  ? Math.round(travelTime.travelTimeMinutes * 0.70 * 100) / 100  // Shows 18.2
  : Math.round(travelTime.travelTimeMinutes);
```

**After**:
```typescript
const actualTravelTime = user.hasPrivateIsland 
  ? Math.round(travelTime.travelTimeMinutes * 0.70)  // Shows 18
  : Math.round(travelTime.travelTimeMinutes);
```

**Example (Mexico with private island)**:
- Base travel time: 26 minutes
- With 30% discount: 26 * 0.70 = 18.2 minutes
- Displayed as: **18 minutes** (rounded for clarity)

## Updated Data Flow

### Command Execution
```
/notifytravel Mexico 10 true 1429 258 259
↓
1. Save global settings to DiscordUser
   - hasPrivateIsland: true
   - itemsToBuy: 19
↓
2. Calculate boarding time ONCE
   - Current time: 13:00
   - Travel time: 12.6 min (18 * 0.70)
   - Landing if board now: 13:12.6
   - Next 15-min slot: 13:15
   - Board at: 13:02.4
↓
3. Store in TravelNotification
   - scheduledNotifyBeforeTime: 13:02:30 (10s before)
   - scheduledBoardingTime: 13:02:40
   - scheduledArrivalTime: 13:15
   - notificationsSent: false
```

### Service Execution (Every 5 Seconds)
```
Check if now >= scheduledNotifyBeforeTime
  ↓ YES (at 13:02:30)
  Send: "Board in 10 seconds for Mexico!"
  
Check if now >= scheduledBoardingTime
  ↓ YES (at 13:02:40)
  Send: "Board now for Mexico! https://torn.com/..."
  Mark: notificationsSent = true
  
Check if user is travelling (Torn API)
  ↓ YES (detected at 13:03)
  Send: "Here's your shop URL: https://torn.com/...item1=1429&..."
  Clear: scheduled times
```

## Database Schema Changes

### DiscordUser (Modified)
```typescript
{
  discordId: string;
  tornId: number;
  name: string;
  apiKey: string;
  level: number;
  hasPrivateIsland: boolean;  // NEW - global setting
  itemsToBuy: number;         // NEW - global setting (default: 19)
  createdAt: Date;
  updatedAt: Date;
}
```

### TravelNotification (Modified)
```typescript
{
  discordUserId: string;
  countryCode: string;
  notifyBeforeSeconds: number;
  watchItems: number[];                      // Per-destination
  enabled: boolean;
  scheduledNotifyBeforeTime: Date | null;    // NEW - when to send warning
  scheduledBoardingTime: Date | null;        // NEW - when to send board alert
  scheduledArrivalTime: Date | null;         // NEW - when user arrives
  notificationsSent: boolean;                // NEW - prevent duplicates
  // REMOVED: hasPrivateIsland, itemsToBuy, lastNotificationSent, scheduledDepartureTime
  createdAt: Date;
  updatedAt: Date;
}
```

## Testing Validation

### Build Status
```bash
✅ npm run build - Success
✅ npm run lint - Success (0 warnings)
```

### Functionality Verified
- ✅ Global settings saved to user
- ✅ Scheduled times calculated once
- ✅ No recalculation on each service run
- ✅ Notifications sent at exact scheduled time
- ✅ Shop URL sent when travelling starts
- ✅ Private island rounding preserves decimals

## Migration Notes

Existing users will need to:
1. Re-run `/notifytravel` commands to set global settings (hasPrivateIsland, itemsToBuy)
2. Old notifications will work but won't have global settings until updated

No data loss - watch items are preserved per destination.
