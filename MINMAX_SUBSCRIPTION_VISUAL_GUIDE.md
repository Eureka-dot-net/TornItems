# MinMax Subscription Commands - Visual Guide

## Command Examples

### Setting up a subscription

```
User: /minmaxsub hours-before-reset:4 notifyeducation:true notifyinvestment:true notifyvirus:true

Bot Response:
✅ **Minmax Subscription Active**

📅 **Notification Time:** 20:00 UTC (4 hours before reset)
📍 **Channel:** #bot-commands

**What we'll check:**
• ✅ City items bought (100/day)
• ✅ Energy refills (1/day)
• ✅ Activities: Education, Investment, Virus Coding

(Note: Xanax is not checked as it requires planning throughout the day)

You'll receive ONE notification per day if you haven't completed these tasks.

To unsubscribe, use `/minmaxunsub`
```

### Receiving a notification (at 20:00 UTC)

```
Bot:
🔔 **Daily Task Reminder** (@Username)

⏰ **4 hours until server reset** (00:00 UTC)

**Incomplete tasks:**
❌ **City Items:** 45/100
❌ **Investment:** No city bank investment

Use `/minmax` to check your progress.
Use `/minmaxunsub` to unsubscribe from these reminders.
```

### All tasks completed (no notification sent, but system records it)

When all tasks are completed at notification time, no message is sent to avoid spam. The system still tracks that it checked today to prevent multiple checks.

### Unsubscribing

```
User: /minmaxunsub

Bot Response:
✅ **Minmax subscription removed successfully.**

You will no longer receive daily minmax reminders.

To subscribe again, use `/minmaxsub`
```

### Trying to unsubscribe when not subscribed

```
User: /minmaxunsub

Bot Response:
❌ You don't have an active minmax subscription.

Use `/minmaxsub` to create one.
```

### Setting up without API key

```
User: /minmaxsub hours-before-reset:4

Bot Response:
❌ You need to set your API key first.
Use `/minmaxsetkey` to store your Torn API key.

**Note:** Please use a limited API key for security purposes.
```

## Notification Time Examples

| Hours Before Reset | Notification Time (UTC) |
|--------------------|------------------------|
| 1                  | 23:00 UTC             |
| 2                  | 22:00 UTC             |
| 4                  | 20:00 UTC             |
| 6                  | 18:00 UTC             |
| 8                  | 16:00 UTC             |
| 12                 | 12:00 UTC             |

## Important Notes

1. **One notification per day**: You will only receive ONE notification per day, even if you have multiple incomplete tasks
2. **Channel-based**: Notifications are sent to the channel where you ran `/minmaxsub`
3. **Hour precision**: Notifications are sent at the top of the hour (e.g., 20:00:00, not 20:45:23)
4. **UTC timezone**: All times are in UTC (Torn's server time)
5. **Smart notifications**: If all tasks are completed, no notification is sent
6. **Activity checks**: Education, investment, and virus coding are optional and only checked if you enabled them
