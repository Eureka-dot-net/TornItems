# MinMax Subscription Commands

This document describes the new minmax subscription feature that allows users to receive daily reminders about incomplete tasks.

## Commands

### `/minmaxsub`
Subscribe to daily minmax reminder notifications before server reset.

**Parameters:**
- `hours-before-reset` (required): Hours before UTC midnight (server reset) to notify you (1-23)
- `notifyeducation` (optional): Notify if not enrolled in education (default: true)
- `notifyinvestment` (optional): Notify if not invested in city bank (default: true)
- `notifyvirus` (optional): Notify if not coding a virus (default: true)

**Example:**
```
/minmaxsub hours-before-reset:4 notifyeducation:true notifyinvestment:false notifyvirus:true
```

This will notify you at 20:00 UTC (4 hours before midnight reset) if you haven't completed your daily tasks.

### `/minmaxunsub`
Unsubscribe from daily minmax reminder notifications.

**Example:**
```
/minmaxunsub
```

## Features

1. **Daily Notifications**: Receive ONE notification per day at your specified time
2. **Task Checking**: The system checks:
   - City items bought (100/day)
   - Xanax taken (3/day)
   - Energy refills (1/day)
   - Education enrollment (optional)
   - City bank investment (optional)
   - Virus coding (optional)
3. **Channel-based**: Notifications are sent to the channel where you subscribed
4. **Smart Notifications**: Only sends notifications if you have incomplete tasks
5. **No Duplicates**: Uses last notification tracking to ensure you only get one notification per day

## Technical Implementation

### Data Model
- **MinMaxSubscription**: Stores user preferences including notification time and optional activity flags
- **lastNotificationSent**: Tracks the date of the last notification to prevent duplicates

### Service Integration
- Integrated into the existing `travelNotificationService` which runs every 5 seconds
- Checks subscriptions once per hour at the user's specified notification time
- Uses the `fetchMinMaxStatus` helper function to retrieve user's task completion status
- Sends notifications via Discord channel alerts

### API Endpoints
- `POST /api/discord/minmaxsub`: Create or update subscription
- `POST /api/discord/minmaxunsub`: Delete subscription

### Helper Functions
- `fetchMinMaxStatus`: Extracted from the existing `/minmax` command logic
- `checkMinMaxSubscriptions`: Service function that checks all subscriptions and sends notifications

## Testing

Run the minmax subscription tests:
```bash
cd API
npm test -- tests/minmaxSubscription.test.ts
```

## Notes

- Users must have set their API key using `/minmaxsetkey` before subscribing
- The notification time is based on UTC
- Notifications are sent to the channel where the user ran the `/minmaxsub` command
- If all tasks are completed, no notification is sent but the last notification date is still updated
