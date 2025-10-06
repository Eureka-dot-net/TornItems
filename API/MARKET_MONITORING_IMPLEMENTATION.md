# Market Price Monitoring Implementation

## Overview
This implementation adds a market price monitoring system that tracks specific Torn items and sends Discord alerts when their prices fall below configured thresholds.

## What Was Implemented

### 1. New Model: `MarketWatchlistItem`
**File:** `API/src/models/MarketWatchlistItem.ts`

Stores the watchlist configuration for items to monitor:
- `itemId`: Torn item ID to monitor
- `name`: Item name for display in alerts
- `alert_below`: Price threshold - alerts trigger when market price falls below this value
- `lastAlertPrice`: Last price that triggered an alert (for deduplication)
- `lastAlertTimestamp`: When the last alert was sent

**Example documents:**
```javascript
{
  itemId: 18,
  name: "Xanax",
  alert_below: 830000,
  lastAlertPrice: null,
  lastAlertTimestamp: null
}

{
  itemId: 23,
  name: "Erotic DVD",
  alert_below: 4600000,
  lastAlertPrice: null,
  lastAlertTimestamp: null
}
```

### 2. Discord Utility
**File:** `API/src/utils/discord.ts`

Simple utility function to send messages to a Discord webhook:
```typescript
export async function sendDiscordAlert(message: string): Promise<void>
```

- Reads webhook URL from `process.env.DISCORD_WEBHOOK_URL`
- Sends formatted message to Discord channel
- Includes error handling and logging

### 3. Market Price Monitoring Job
**File:** `API/src/jobs/monitorMarketPrices.ts`

Core monitoring logic that:
1. Fetches all watchlist items from database
2. For each item, queries Torn API for current market listings
3. Finds the lowest priced listing
4. Compares against the threshold
5. Sends Discord alert if price is below threshold
6. Implements deduplication to prevent spam

**Key Features:**
- Uses the existing Bottleneck rate limiter to respect API limits
- Includes exponential backoff retry logic for rate limit errors
- Prevents duplicate alerts for the same price
- Resets alert state when price goes back above threshold
- Formats alerts with item name, price, threshold, user mention, and direct market link

**Alert Format:**
```
🚨 Cheap item found!
💊 Xanax listed at $819,000 (below $830,000)
<@1234567890>
https://www.torn.com/imarket.php#/p=shop&step=item&type=Xanax
```

### 4. Scheduler Integration
**File:** `API/src/services/backgroundFetcher.ts` (modified)

Added:
- Import for `monitorMarketPrices` job
- Cron schedule running every 30 seconds: `*/30 * * * * *`
- Immediate execution on startup
- Error handling for failed monitoring runs

**Cron Schedule Pattern:**
```typescript
cron.schedule('*/30 * * * * *', () => {
  monitorMarketPrices().catch((error) => {
    logError('Error in market price monitoring', error);
  });
});
```

Note: This uses 6-field cron syntax where the first field is seconds.

### 5. Environment Variables
**File:** `API/.env.example` (modified)

Added configuration for Discord integration:
```bash
# Discord Webhook Configuration
# Discord webhook URL for market price alerts
DISCORD_WEBHOOK_URL=your_discord_webhook_url_here
# Your Discord user ID for mentions in alerts
MY_DISCORD_USER_ID=1234567890
```

### 6. Tests
**File:** `API/tests/models.test.ts` (modified)

Added comprehensive tests for `MarketWatchlistItem` model:
- ✅ Test model creation with all required fields
- ✅ Test updating lastAlertPrice and lastAlertTimestamp
- ✅ Test unique constraint enforcement on itemId

## How to Use

### 1. Setup Environment Variables

Add to your `.env` file:
```bash
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_URL
MY_DISCORD_USER_ID=your_discord_user_id_here
```

### 2. Populate Watchlist

You need to manually add items to the `MarketWatchlistItem` collection in MongoDB.

**Option A: Using MongoDB Compass or Shell**
```javascript
db.marketwatchlistitems.insertMany([
  {
    itemId: 18,
    name: "Xanax",
    alert_below: 830000,
    lastAlertPrice: null,
    lastAlertTimestamp: null
  },
  {
    itemId: 23,
    name: "Erotic DVD",
    alert_below: 4600000,
    lastAlertPrice: null,
    lastAlertTimestamp: null
  }
]);
```

**Option B: Using Node.js/TypeScript**
```typescript
import { MarketWatchlistItem } from './models/MarketWatchlistItem';

await MarketWatchlistItem.create({
  itemId: 18,
  name: 'Xanax',
  alert_below: 830000
});

await MarketWatchlistItem.create({
  itemId: 23,
  name: 'Erotic DVD',
  alert_below: 4600000
});
```

### 3. Start the Application

The monitoring job will start automatically when the application starts:
```bash
npm run dev   # Development mode
npm start     # Production mode
```

### 4. Monitoring

Check application logs for monitoring activity:
```
Monitoring 2 watchlist items for price alerts...
Alert sent for Xanax at $819,000
Skipping duplicate alert for Xanax at $819,000
Discord alert sent successfully
```

## Rate Limiting

The market monitoring system respects Torn API rate limits:
- Uses the shared Bottleneck rate limiter (60 requests per minute by default)
- Each watchlist item requires 1 API call per monitoring cycle
- Running every 30 seconds = 2 cycles per minute
- With 2 watchlist items = 4 API calls per minute maximum
- This leaves plenty of headroom for other background jobs

**Important:** The monitoring job is prioritized but still shares the rate limit pool. With the default configuration, you can monitor up to ~30 items before hitting rate limits.

## Deduplication Logic

To prevent spam, the system:
1. Records the price that triggered an alert in `lastAlertPrice`
2. Skips sending a new alert if the lowest price is the same
3. Resets `lastAlertPrice` when price goes back above threshold
4. This allows alerts to trigger again if price drops further or rises then drops again

**Example flow:**
1. Price drops to $819,000 → Alert sent, `lastAlertPrice = 819000`
2. 30 seconds later, still $819,000 → Skipped (duplicate)
3. Price rises to $835,000 → No alert, `lastAlertPrice = null` (reset)
4. Price drops to $825,000 → Alert sent, `lastAlertPrice = 825000`

## Error Handling

The system includes comprehensive error handling:
- Individual item errors don't stop monitoring of other items
- API rate limit errors trigger exponential backoff retry
- Discord webhook failures are logged but don't crash the application
- Missing environment variables are logged with clear error messages

## Files Created

1. `API/src/models/MarketWatchlistItem.ts` - New model
2. `API/src/utils/discord.ts` - Discord webhook utility
3. `API/src/jobs/monitorMarketPrices.ts` - Monitoring job
4. `API/MARKET_MONITORING_IMPLEMENTATION.md` - This documentation

## Files Modified

1. `API/src/services/backgroundFetcher.ts` - Added scheduler integration
2. `API/.env.example` - Added Discord environment variables
3. `API/tests/models.test.ts` - Added MarketWatchlistItem tests

## Database Schema

**Collection:** `marketwatchlistitems`

```typescript
{
  _id: ObjectId,
  itemId: Number (required, unique, indexed),
  name: String (required),
  alert_below: Number (required),
  lastAlertPrice: Number | null,
  lastAlertTimestamp: Date | null,
  __v: Number
}
```

## Discord Webhook Setup

1. Go to your Discord server settings
2. Navigate to Integrations → Webhooks
3. Click "New Webhook"
4. Set a name and channel
5. Copy the webhook URL
6. Add to `.env` as `DISCORD_WEBHOOK_URL`

To get your Discord user ID:
1. Enable Developer Mode in Discord settings
2. Right-click your username
3. Click "Copy ID"
4. Add to `.env` as `MY_DISCORD_USER_ID`

## Customization

### Change Monitoring Frequency

Edit the cron schedule in `backgroundFetcher.ts`:
```typescript
// Every 30 seconds (default)
cron.schedule('*/30 * * * * *', () => { ... });

// Every minute
cron.schedule('0 * * * * *', () => { ... });

// Every 10 seconds
cron.schedule('*/10 * * * * *', () => { ... });
```

### Add More Items

Simply insert more documents into the `MarketWatchlistItem` collection. The monitoring job automatically processes all items in the watchlist.

### Change Alert Format

Edit the message formatting in `monitorMarketPrices.ts`:
```typescript
const message = [
  '🚨 Cheap item found!',
  `💊 ${watchlistItem.name} listed at $${lowestPrice.toLocaleString()} (below $${watchlistItem.alert_below.toLocaleString()})`,
  userMention,
  `https://www.torn.com/imarket.php#/p=shop&step=item&type=${encodeURIComponent(watchlistItem.name)}`
].filter(Boolean).join('\n');
```

## Troubleshooting

### No alerts being sent
1. Check logs for "Monitoring X watchlist items..."
2. Verify `DISCORD_WEBHOOK_URL` is set correctly
3. Verify items exist in `MarketWatchlistItem` collection
4. Check if prices are actually below thresholds

### Duplicate alerts
1. This should not happen due to deduplication logic
2. Check `lastAlertPrice` field in database
3. Verify the monitoring job isn't running multiple times

### Rate limit errors
1. Check TORN_RATE_LIMIT environment variable
2. Reduce number of watchlist items
3. Increase monitoring interval (from 30 seconds to 60 seconds)

## Future Enhancements

Potential improvements:
- Web UI to manage watchlist items
- API endpoints to add/remove/update watchlist items
- Support for price increase alerts (above threshold)
- Alert history tracking
- Multiple Discord webhooks/channels
- Configurable alert cooldown periods
- Batch alerts (one message for multiple items)
