# Travel Notification Fixes - Implementation Summary

## Issues Fixed

### 1. ✅ Timezone Display Issues
**Problem**: Times were displayed in server timezone (en-US format) instead of user's local timezone.

**Solution**: Implemented Discord timestamp format `<t:timestamp:format>` which automatically displays in each user's local timezone.

**Changes**:
- `notifyTravel.ts`: Changed from `toLocaleTimeString('en-US', ...)` to `<t:${timestamp}:t>` format
- `listTravelNotifications.ts`: Updated to use Discord timestamps with relative time `<t:${timestamp}:R>`
- `travelNotificationService.ts`: Updated notification messages to use Discord timestamps

**Example**:
```typescript
// Before
`📍 Arrival: ${nextSlot.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`

// After
`📍 Arrival: <t:${Math.floor(nextSlot.getTime() / 1000)}:t>`
```

### 2. ✅ Notification Delivery Failures
**Problem**: Users not receiving DM alerts (possibly due to DM settings or blocked DMs).

**Solution**: Added fallback to send notifications to a guild channel if DM fails.

**Changes**:
- Added `DISCORD_TRAVEL_CHANNEL_ID` environment variable to `.env.example`
- Created `sendDirectMessageWithFallback()` function in `discord.ts`
- Updated `travelNotificationService.ts` to use the new fallback function
- Messages sent to channel include user mention: `<@userId> {message}`

**Configuration**:
```bash
# In .env file
DISCORD_TRAVEL_CHANNEL_ID=your_travel_channel_id_here
```

### 3. ✅ Second "Before" Notification Time
**Problem**: Users wanted option to receive multiple warnings before boarding (e.g., 15s and 5s before).

**Solution**: Added optional `notifyBeforeSeconds2` parameter for a second notification time.

**Changes**:
- Added `notifyBeforeSeconds2` field to `TravelNotification` model
- Added `scheduledNotifyBeforeTime2` and `notificationsSent2` tracking fields
- Added `notifybeforeseconds2` parameter to `/notifytravel` command
- Validation: Second notification time must be less than first notification time
- Service checks both notification times independently

**Usage**:
```
/notifytravel country:Mexico notifybeforeseconds:15 notifybeforeseconds2:5
```

This will send:
- Alert at 15 seconds before boarding
- Alert at 5 seconds before boarding
- No boarding time alert (skipped since second notification is set)

### 4. ✅ Skip Boarding Notification When Second Alert Is Set
**Problem**: Too many notifications when multiple "before" times are configured.

**Solution**: When `notifyBeforeSeconds2` is set, the boarding time notification is skipped.

**Logic**:
- If `notifyBeforeSeconds2` is `null`: Send warning + boarding notification
- If `notifyBeforeSeconds2` is set: Send both warnings, skip boarding notification

**Implementation**:
```typescript
// In travelNotificationService.ts
if (now >= scheduledBoardingTime && notification.notifyBeforeSeconds2 == null) {
  // Send boarding notification
} else if (now >= scheduledBoardingTime && notification.notifyBeforeSeconds2 != null) {
  // Just mark as sent, skip notification
}
```

## Database Schema Changes

### TravelNotification Model

**New Fields**:
```typescript
interface ITravelNotification {
  // ... existing fields ...
  notifyBeforeSeconds2?: number | null;           // NEW: Second notification time
  scheduledNotifyBeforeTime2?: Date | null;       // NEW: When to send second notification
  notificationsSent2: boolean;                    // NEW: Track second notification sent
}
```

**Migration Notes**:
- Existing notifications will have `notifyBeforeSeconds2 = null` (backward compatible)
- No data migration required
- Users can update their notifications using `/notifytravel` command

## Files Modified

1. **API/src/models/TravelNotification.ts**
   - Added `notifyBeforeSeconds2`, `scheduledNotifyBeforeTime2`, `notificationsSent2` fields

2. **API/src/discord/commands/notifyTravel.ts**
   - Added `notifybeforeseconds2` parameter
   - Validation for second notification time
   - Discord timestamp format for all times
   - Updated confirmation messages

3. **API/src/discord/commands/listTravelNotifications.ts**
   - Display second notification time if set
   - Use Discord timestamp format with relative time

4. **API/src/services/travelNotificationService.ts**
   - Handle second notification time
   - Skip boarding notification when second time is set
   - Use `sendDirectMessageWithFallback()` for all notifications
   - Discord timestamp format in messages

5. **API/src/utils/discord.ts**
   - Added `sendDirectMessageWithFallback()` function
   - Fallback to channel with user mention on DM failure

6. **API/.env.example**
   - Added `DISCORD_TRAVEL_CHANNEL_ID` configuration

## Testing Checklist

- [x] TypeScript compilation successful
- [x] ESLint passes with 0 warnings
- [ ] Test `/notifytravel` with single notification time
- [ ] Test `/notifytravel` with two notification times
- [ ] Test validation (second time must be < first time)
- [ ] Test Discord timestamp display in different timezones
- [ ] Test DM delivery
- [ ] Test fallback to channel when DM fails
- [ ] Test notification service sends at correct times
- [ ] Test second notification is sent
- [ ] Test boarding notification is skipped when second time is set
- [ ] Test `/listtravelnotifications` shows updated format

## User Experience Improvements

### Before
```
✅ Created travel notification for Mexico

Next scheduled landing:
📍 Arrival: 14:30
🛫 Board at: 14:04

You will receive notifications at:
• 14:03:50 (warning)
• 14:04:00 (board now)
```
**Issues**: Times show in server timezone, not user's local time

### After
```
✅ Created travel notification for Mexico

Next scheduled landing:
📍 Arrival: <t:1234567890:t>
🛫 Board at: <t:1234567840:t>

You will receive notifications at:
• <t:1234567825:T> (15s warning)
• <t:1234567835:T> (5s warning)
```
**Improvements**: 
- Times display in user's local timezone automatically
- Can set two warning times
- No redundant boarding notification

## Configuration Example

```bash
# .env file
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_GUILD_ID=your_guild_id
DISCORD_TRAVEL_CHANNEL_ID=your_travel_channel_id  # NEW: Fallback channel
```

## Usage Examples

### Single Warning Time
```
/notifytravel country:Japan notifybeforeseconds:10
```
Result: Get alert 10s before boarding + alert at boarding time

### Dual Warning Times
```
/notifytravel country:Japan notifybeforeseconds:15 notifybeforeseconds2:5
```
Result: Get alert 15s before boarding + alert 5s before boarding (no boarding time alert)

### With All Options
```
/notifytravel country:Mexico notifybeforeseconds:20 notifybeforeseconds2:10 hasprivateisland:true watchitem1:123 watchitem2:456 itemstobuy:19
```

## Notes

- Discord timestamps automatically adjust to user's timezone settings
- Fallback channel requires `DISCORD_TRAVEL_CHANNEL_ID` to be set in environment
- Second notification time is optional and must be less than first notification time
- When second notification time is set, boarding time notification is automatically skipped to avoid spam

---

## Additional Fixes (Latest)

### 5. ✅ Multiple Duplicate Shop URL Messages
**Problem**: The service was sending the same shop URL message multiple times because there was no flag to prevent re-processing notifications that had already received their shop URL.

**Root Cause**: Between the time the shop URL notification was sent and the scheduled times were cleared in the database, the service (running every 5 seconds) could pick up the same notification again and send another message.

**Solution**: 
- Added a new `shopUrlSent` boolean field to the `TravelNotification` model
- Updated the query in `checkTravelStart()` to exclude notifications where `shopUrlSent` is already true
- Set `shopUrlSent = true` immediately after sending the shop URL to prevent future duplicate sends
- Also set `shopUrlSent = true` for notifications with no watch items to prevent rechecking

**Changes**:
```typescript
// Query now excludes notifications where shop URL was already sent
const sentNotifications = await TravelNotification.find({
  enabled: true,
  notificationsSent: true,
  shopUrlSent: false, // Only check notifications where shop URL hasn't been sent
  scheduledBoardingTime: { 
    $ne: null,
    $gte: new Date(now.getTime() - 5 * 60 * 1000),
    $lte: new Date(now.getTime() - 60 * 1000)
  },
}).lean();

// After sending, mark as sent
await TravelNotification.updateOne(
  { _id: notification._id },
  { 
    scheduledNotifyBeforeTime: null,
    scheduledNotifyBeforeTime2: null,
    scheduledBoardingTime: null,
    scheduledArrivalTime: null,
    shopUrlSent: true, // Prevents duplicate sends
  }
);
```

### 6. ✅ Shop URL Sent When Not Travelling to Destination
**Problem**: Users received shop URLs even when not travelling to the expected destination. For example, setting an alert for Mexico but getting the shop URL when travelling back home to "Torn" or when travelling to a different country.

**Example from User**:
```json
{
  "travel": {
    "destination": "Torn",
    "method": "Airstrip",
    "departed_at": 1759936516,
    "arrival_at": 1759937536,
    "time_left": 0
  }
}
```
User had an alert for Mexico but was travelling back to "Torn" (home) and still received the Mexico shop URL.

**Solution**:
- Added destination verification that checks two conditions:
  1. The travel destination matches the expected country name from `COUNTRY_CODE_MAP`
  2. The destination is not "Torn" (which means travelling back home)
- Added logging for cases where the user is travelling but not to the expected destination
- Only send shop URL when both conditions are met

**Changes**:
```typescript
if (travelStatus && travelStatus.destination) {
  const expectedCountryName = COUNTRY_CODE_MAP[notification.countryCode] || notification.countryCode;
  
  // Check if destination matches AND is not "Torn" (travelling back home)
  if (travelStatus.destination === expectedCountryName && travelStatus.destination !== 'Torn') {
    // User is travelling to the correct destination - send shop URL
    // ...
  } else {
    // User is travelling but NOT to the destination we have an alert for
    logInfo('User is travelling but not to the expected destination', {
      discordUserId: notification.discordUserId,
      expectedCountry: expectedCountryName,
      actualDestination: travelStatus.destination,
    });
  }
}
```

**Database Schema Changes**:
```typescript
// Added to TravelNotification model
shopUrlSent: { type: Boolean, default: false, index: true }
```

**Expected Behavior After Fix**:

1. **No Duplicate Messages**: Each notification will only receive the shop URL once, even if the service runs multiple times
2. **Correct Destination Verification**: Shop URLs will only be sent when:
   - The user is actually travelling (not at home)
   - The destination matches the country code from the alert
   - The destination is not "Torn" (home)
3. **Better Logging**: Clear log messages indicate when users are travelling to different destinations than expected

**Example Scenarios**:

✅ **Scenario 1**: User sets alert for Mexico and travels to Mexico
- Shop URL sent with Mexico items

❌ **Scenario 2**: User sets alert for Mexico but travels to Canada
- No shop URL sent
- Log: "User is travelling but not to the expected destination"

❌ **Scenario 3**: User sets alert for Mexico but flies back home to Torn
- No shop URL sent
- The API returns `destination: "Torn"` which doesn't match "Mexico"

✅ **Scenario 4**: User receives shop URL
- `shopUrlSent` flag is set to `true`
- Notification will not be processed again on subsequent service runs
- No duplicate messages

