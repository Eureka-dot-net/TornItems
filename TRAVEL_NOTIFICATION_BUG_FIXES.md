# Travel Notification Bug Fixes

## Issues Fixed

### Issue 1: No Notifications Sent After Previous Fix ❌ → ✅

**Problem**: Users reported receiving NO notifications at all after a previous code review "fixed" the multiple notification issue. This was a critical regression causing users to miss their travel windows.

**Root Cause**: When updating an existing travel notification in `notifyTravel.ts`, the code was resetting `notificationsSent` and `notificationsSent2` flags but was **missing** the reset of `notificationsSent1` flag.

```typescript
// BEFORE (lines 220-227 in notifyTravel.ts)
notification.notificationsSent = false;
notification.notificationsSent2 = false;  // Missing: notificationsSent1 = false
await notification.save();
```

The service in `travelNotificationService.ts` checks for `!notification.notificationsSent1` at line 49 before sending the first warning:

```typescript
if (scheduledNotifyBeforeTime && now >= scheduledNotifyBeforeTime && now < scheduledBoardingTime && !notification.notificationsSent1) {
```

Since `notificationsSent1` was never reset, it remained `true` from a previous notification, preventing any new notifications from being sent.

**Fix**: Reset ALL notification flags when creating or updating a travel notification:

```typescript
// AFTER
notification.notificationsSent = false;
notification.notificationsSent1 = false;  // ✅ Now reset
notification.notificationsSent2 = false;
await notification.save();
```

This fix applies to both:
- Updating existing notifications (line 220-227)
- Creating new notifications (line 288-296)

---

### Issue 2: Notification Times Too Close to Boarding ⏰ → ✅

**Problem**: When a user requests a notification close to the boarding time (e.g., requesting at 10:00:10 when boarding is at 10:00:20), the notification times could be in the past or within a few seconds, making it impossible to send them.

**Example Scenario**:
```
Current time:  10:00:10
Boarding time: 10:00:20 (10 seconds away)
Notify before: 10 seconds
→ Notification time: 10:00:10 (RIGHT NOW, no buffer!)
```

The notification service runs every 5 seconds, so if the notification time is too close to the current time, it might be missed entirely.

**Fix**: Added automatic boarding time adjustment with a 15-second minimum buffer:

```typescript
// Calculate initial notification times
let notifyBeforeTime = new Date(boardingTime.getTime() - actualNotifyBeforeSeconds * 1000);
let notifyBeforeTime2 = actualNotifyBeforeSeconds2 !== null 
  ? new Date(boardingTime.getTime() - actualNotifyBeforeSeconds2 * 1000)
  : null;

// Find the earliest notification time (checking both if second exists)
const earliestNotificationTime = notifyBeforeTime2 && notifyBeforeTime2.getTime() < notifyBeforeTime.getTime()
  ? notifyBeforeTime2
  : notifyBeforeTime;

const minTimeBuffer = 15 * 1000; // 15 seconds minimum buffer

// Check if notification time is too close or in the past
if (earliestNotificationTime.getTime() < now.getTime() + minTimeBuffer) {
  // Move boarding time forward by 15 minutes to the next slot
  finalBoardingTime = new Date(boardingTime.getTime() + 15 * 60 * 1000);
  const nextArrivalSlot = new Date(nextSlot.getTime() + 15 * 60 * 1000);
  
  // Recalculate notification times with new boarding time
  notifyBeforeTime = new Date(finalBoardingTime.getTime() - actualNotifyBeforeSeconds * 1000);
  notifyBeforeTime2 = actualNotifyBeforeSeconds2 !== null 
    ? new Date(finalBoardingTime.getTime() - actualNotifyBeforeSeconds2 * 1000)
    : null;
  
  // Update arrival and boarding times
  nextSlot.setTime(nextArrivalSlot.getTime());
  boardingTime.setTime(finalBoardingTime.getTime());
}
```

**Behavior**:
- If ANY notification time is less than 15 seconds in the future, the system automatically moves the boarding time forward by 15 minutes
- This ensures all notifications have adequate time to be sent
- The arrival time is also adjusted by 15 minutes to maintain the correct travel duration
- Users are notified of the adjusted times in the confirmation message

---

## Files Modified

### 1. `API/src/discord/commands/notifyTravel.ts`

**Changes**:
1. Added `notificationsSent1: false` reset in the update path (line ~250)
2. Added `notificationsSent1: false` initialization in the create path (line ~319)
3. Added boarding time adjustment logic (lines ~198-223):
   - Calculate earliest notification time
   - Check if within 15-second buffer
   - Auto-adjust by 15 minutes if too close
   - Recalculate all notification and arrival times

### 2. `API/tests/travelNotificationFixes.test.ts` (NEW)

**Test Coverage**:
1. **Notification flag reset tests**:
   - Verifies all three flags are reset on update
   - Verifies all three flags are initialized to false on create

2. **Boarding time adjustment tests**:
   - Keeps original time if notifications are sufficiently in the future
   - Adjusts by 15 minutes if notification time is too close (< 15s buffer)
   - Adjusts by 15 minutes if notification time is in the past
   - Correctly handles second notification time when checking for adjustment

---

## Testing

```bash
# Run the new tests
npm test -- tests/travelNotificationFixes.test.ts

# Run linting
npm run lint

# Run type checking
npm run typecheck
```

All tests pass ✅  
Linting passes with 0 warnings ✅  
Type checking passes ✅

---

## Impact

### Bug 1 Impact (Critical)
- **Before**: Users received ZERO notifications, missing their travel windows entirely
- **After**: Users receive all scheduled notifications as expected

### Bug 2 Impact (Important)
- **Before**: Requesting notifications close to boarding time would fail silently
- **After**: System automatically adjusts to the next 15-minute slot, ensuring notifications can be sent

---

## Example Scenarios

### Scenario 1: Normal Operation (No Adjustment Needed)
```
Current time:   10:00:00
Boarding time:  10:05:00 (calculated for next 15-min slot)
Notify before:  10 seconds

First notification time: 10:04:50 (4m 50s in future) ✅
→ No adjustment needed, sufficient buffer
```

### Scenario 2: Too Close, Needs Adjustment
```
Current time:   10:00:00
Boarding time:  10:00:15 (only 15 seconds away)
Notify before:  10 seconds

First notification time: 10:00:05 (5s in future, < 15s buffer) ❌
→ Adjust boarding time: 10:15:15 (moved +15 minutes)
→ New notification time: 10:15:05 ✅
```

### Scenario 3: Notification Time in the Past
```
Current time:   10:00:00
Boarding time:  10:00:05 (5 seconds away)
Notify before:  10 seconds

First notification time: 09:59:55 (5s in the PAST) ❌
→ Adjust boarding time: 10:15:05 (moved +15 minutes)
→ New notification time: 10:14:55 ✅
```

---

## Notes

- The 15-second buffer provides adequate time for the notification service (which runs every 5 seconds) to catch and send notifications
- The automatic adjustment is transparent to users - they see the adjusted times in the confirmation message
- Both notification times are checked when determining if adjustment is needed
- The logic correctly identifies the earliest notification time when two notification times are configured
