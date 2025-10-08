# Quick Reference: Travel Notification Updates

## What Was Fixed

### 1. Timezone Display ✅
**Before:** Times shown in server timezone (wrong for most users)
**After:** Times shown in YOUR timezone (Discord auto-converts)

### 2. Notification Delivery ✅
**Before:** Only sent as DMs (failed if DMs disabled)
**After:** Falls back to guild channel if DM fails

### 3. Multiple Warnings ✅
**Before:** Only one warning before boarding
**After:** Can set two warnings (e.g., 15s and 5s before)

### 4. Fewer Spam Notifications ✅
**Before:** Always sent boarding time notification
**After:** Skips boarding notification if you have two warnings set

## Setup Required

Add this to your `.env` file:
```bash
DISCORD_TRAVEL_CHANNEL_ID=your_channel_id_here
```

To get your channel ID:
1. Enable Developer Mode in Discord (Settings → Advanced → Developer Mode)
2. Right-click your travel notifications channel
3. Click "Copy ID"
4. Paste into .env file

## Command Examples

### Single Warning (10 seconds before)
```
/notifytravel country:Mexico notifybeforeseconds:10
```
**You'll get:**
- Alert 10 seconds before boarding time
- Alert at boarding time

### Dual Warnings (15s and 5s before)
```
/notifytravel country:Mexico notifybeforeseconds:15 notifybeforeseconds2:5
```
**You'll get:**
- Alert 15 seconds before boarding time
- Alert 5 seconds before boarding time
- ✨ No boarding time alert (less spam!)

### With All Options
```
/notifytravel country:Japan notifybeforeseconds:20 notifybeforeseconds2:10 hasprivateisland:true watchitem1:123 watchitem2:456 itemstobuy:19
```

## Important Notes

⚠️ **Validation:** Second warning time must be LESS than first warning time
- ✅ `notifybeforeseconds:15 notifybeforeseconds2:5` (valid)
- ❌ `notifybeforeseconds:5 notifybeforeseconds2:15` (invalid)

⏰ **Timezone Display:**
- Times now show as `<t:timestamp:t>` format
- Discord automatically converts to your local timezone
- No more confusion about what timezone times are in!

📱 **Fallback Channel:**
- If bot can't DM you, it will message the channel instead
- Channel message includes `@mention` so you still get notified
- Make sure `DISCORD_TRAVEL_CHANNEL_ID` is set!

## Upgrading Existing Notifications

Your existing notifications will continue to work! They'll have:
- `notifyBeforeSeconds2 = null` (no second warning)
- Old notification behavior (warning + boarding notification)

To upgrade to dual warnings, just run the command again:
```
/notifytravel country:YourCountry notifybeforeseconds:15 notifybeforeseconds2:5
```

## Checking Your Notifications

Use `/listtravelnotifications` to see all your configured notifications.

Output now shows:
- Both warning times (if configured)
- Next alert time in YOUR timezone
- Relative time ("in 5 minutes")

Example output:
```
✈️ Your Travel Notifications

Global Settings:
🏝️ Private Island: Yes
📦 Items to Buy: 19

Destinations:
Mexico ✅ Enabled
  🔔 Notify: 15s before and 5s before
  👁️ Watch Items: 123, 456
  ⏰ Next alert: 2:30 PM (in 5 minutes)
```

## Testing

To test the implementation:
1. Set up a notification with short times (e.g., 30s and 15s before)
2. Wait for the notifications
3. Verify you receive both warnings
4. Verify times display in your local timezone
5. If DM fails, check the guild channel

## Troubleshooting

**Not receiving notifications?**
- Check if `DISCORD_TRAVEL_CHANNEL_ID` is set in .env
- Verify the channel ID is correct
- Check bot has permission to send messages in that channel
- Check your DM settings (Settings → Privacy & Safety)

**Times showing wrong timezone?**
- They should automatically show in YOUR timezone
- If not, this is a Discord display issue (check your Discord settings)
- The actual notification will still trigger at the correct time

**Second notification not working?**
- Verify `notifybeforeseconds2` is LESS than `notifybeforeseconds`
- Check the notification was saved: `/listtravelnotifications`
- Check the logs for errors

## Need Help?

If you encounter issues:
1. Check the logs for error messages
2. Verify your .env configuration
3. Try re-running `/notifytravel` to update the notification
4. Use `/listtravelnotifications` to verify the configuration

## Migration Path

1. **No action required** - existing notifications work as-is
2. **Optional:** Set `DISCORD_TRAVEL_CHANNEL_ID` for fallback support
3. **Optional:** Update notifications to use dual warnings for less spam
4. **Benefit:** All times now display in your local timezone automatically!
