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
