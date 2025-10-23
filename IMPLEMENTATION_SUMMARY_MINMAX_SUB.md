# MinMax Subscription Implementation Summary

## Overview
This PR implements two new Discord commands (`/minmaxsub` and `/minmaxunsub`) that allow users to subscribe to daily reminder notifications about incomplete daily tasks.

## Problem Solved
Users want to receive automated reminders before the server reset (UTC midnight) to complete their daily tasks:
- Buy 100 city items
- Use 1 energy refill
- Optionally: check education enrollment, city bank investment, and virus coding

Note: Xanax is NOT included in subscription checks as it requires planning throughout the day and cannot be rushed if forgotten.

## Solution

### Commands
1. **`/minmaxsub hours-before-reset notifyeducation? notifyinvestment? notifyvirus?`**
   - Subscribes user to daily reminders
   - User specifies how many hours before reset (1-23)
   - Optional flags for education/investment/virus checks
   - Notifications sent to the channel where command was used

2. **`/minmaxunsub`**
   - Unsubscribes user from daily reminders
   - Simple, no parameters required

### Key Features
- **One notification per day**: System tracks last notification date to prevent duplicates
- **Smart notifications**: Only sends if tasks are incomplete
- **Hour precision**: Notifications sent at the top of the hour in UTC
- **Channel-based**: Uses the channel ID from where user subscribed
- **Integrated**: Plugged into existing travel notification service (5-second interval checks)

## Implementation Details

### New Files
1. **Model**: `API/src/models/MinMaxSubscription.ts`
   - Stores subscription preferences per user
   - Tracks notification settings and last sent date

2. **Helper**: `API/src/utils/minmaxHelper.ts`
   - Extracted from existing `/minmax` endpoint
   - Reusable function: `fetchMinMaxStatus()`
   - Handles API calls, caching, and activity checks

3. **Service**: `API/src/services/minmaxNotificationService.ts`
   - `checkMinMaxSubscriptions()` function
   - Checks all enabled subscriptions each hour
   - Sends notifications for incomplete tasks
   - Updates last notification date

4. **Commands**:
   - `API/src/discord/commands/minmaxsub.ts` (API command handler)
   - `API/src/discord/commands/minmaxunsub.ts` (API command handler)
   - `Discord/src/commands/minmaxsub.ts` (Discord bot command)
   - `Discord/src/commands/minmaxunsub.ts` (Discord bot command)

5. **Routes**: Added to `API/src/routes/discord.ts`
   - `POST /api/discord/minmaxsub` - Create/update subscription
   - `POST /api/discord/minmaxunsub` - Delete subscription

6. **Tests**: `API/tests/minmaxSubscription.test.ts`
   - Authentication tests
   - Subscription creation/update tests
   - Unsubscribe tests
   - Error handling tests

### Modified Files
1. **`API/src/routes/discord.ts`**
   - Refactored `/minmax` endpoint to use helper function
   - Added subscription endpoints
   - Reduced code duplication (313 deletions, 176 additions)

2. **`API/src/services/travelNotificationService.ts`**
   - Integrated minmax subscription check
   - Calls `checkMinMaxSubscriptions()` in the 5-second loop

3. **`Discord/src/register-commands.ts`**
   - Added new commands to registration list

## Technical Design

### Notification Flow
```
Every 5 seconds (travel notification service):
  └─> checkMinMaxSubscriptions()
      ├─> Get current UTC hour
      ├─> Find all enabled subscriptions
      └─> For each subscription:
          ├─> Calculate notification hour (24 - hoursBeforeReset)
          ├─> Check if current hour matches notification hour
          ├─> Check if already notified today (lastNotificationSent)
          ├─> Fetch user's minmax status
          ├─> Check for incomplete tasks
          ├─> If incomplete: send notification + update lastNotificationSent
          └─> If complete: only update lastNotificationSent (no notification)
```

### Notification Time Calculation
```typescript
// User sets: hoursBeforeReset = 4
// Notification time: 24 - 4 = 20:00 UTC
// This is 4 hours before 00:00 UTC (midnight reset)
```

### Duplicate Prevention
```typescript
// Store lastNotificationSent as Date
// Compare only the date portion (year, month, day)
// If lastSentDate === currentDate, skip notification
// This ensures exactly ONE notification per UTC day
```

## Testing

### Unit Tests
Created comprehensive tests in `minmaxSubscription.test.ts`:
- ✅ Authentication checks (401 errors)
- ✅ Missing parameters (400 errors)
- ✅ Invalid hour range (1-23)
- ✅ Create subscription
- ✅ Update existing subscription
- ✅ Default values for optional flags
- ✅ Unsubscribe existing subscription
- ✅ Unsubscribe non-existent subscription (404)
- ✅ Require API key for subscription

### Manual Testing Checklist
- [ ] Register commands: `npm run register-commands` in both API and Discord
- [ ] Start API server: `npm run dev` in API
- [ ] Start Discord bot: `npm run dev` in Discord
- [ ] Test `/minmaxsub` with various parameters
- [ ] Test `/minmaxunsub`
- [ ] Verify notifications are sent at correct time
- [ ] Verify only one notification per day
- [ ] Verify no notification when all tasks complete

## Code Quality

### Linting
- All new code passes ESLint checks
- Removed unused imports and variables
- Follows existing code style

### Type Safety
- Full TypeScript support
- No type errors (`npm run typecheck` passes)
- Proper interfaces for all data structures

### Code Reusability
- Extracted common logic into `minmaxHelper.ts`
- Reduced duplication in discord routes (313 lines removed)
- Single source of truth for minmax checking logic

## Documentation

1. **`MINMAX_SUBSCRIPTION_FEATURE.md`**
   - Technical overview
   - API endpoints
   - Testing instructions

2. **`MINMAX_SUBSCRIPTION_VISUAL_GUIDE.md`**
   - Command examples with sample outputs
   - Visual representation of notifications
   - Time calculation examples
   - Important notes for users

## Future Enhancements (Not in Scope)

- [ ] Allow multiple notification times per user
- [ ] Add notification history view
- [ ] Support for custom task thresholds
- [ ] Web dashboard for managing subscriptions
- [ ] Notification preview/test command

## Migration Notes

No database migration required. The `MinMaxSubscription` collection will be created automatically when the first user subscribes.

## Deployment Checklist

1. Deploy API changes
2. Deploy Discord bot changes
3. Register new commands: `npm run register-commands`
4. Verify travel notification service is running
5. Monitor logs for any errors
6. Test with a few users before announcing feature

## Summary

This implementation successfully adds daily task reminder functionality to the Discord bot with minimal changes to existing code. The feature is well-integrated into the existing notification system, properly tested, and fully documented.

**Stats:**
- 12 files changed
- 1,613 insertions(+)
- 313 deletions(-)
- Net: +1,300 lines
