# Quick Setup Guide - Market Price Monitoring

This guide will help you set up the market price monitoring system in 5 minutes.

## Prerequisites

- Discord webhook URL
- Your Discord user ID
- MongoDB connection (already configured)

## Step 1: Get Discord Webhook URL

1. Open Discord and go to your server
2. Click on Server Settings (gear icon) → Integrations
3. Click "Create Webhook" or "New Webhook"
4. Choose a name (e.g., "Torn Market Alerts")
5. Select the channel where alerts should appear
6. Click "Copy Webhook URL"

## Step 2: Get Your Discord User ID

1. In Discord, go to Settings → Advanced
2. Enable "Developer Mode"
3. Right-click on your username anywhere in Discord
4. Click "Copy ID"

## Step 3: Configure Environment Variables

Add these two lines to your `.env` file:

```bash
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_URL_HERE
MY_DISCORD_USER_ID=1234567890
```

Replace with your actual webhook URL and user ID.

## Step 4: Populate the Watchlist

Run the helper script to add Xanax and Erotic DVD to your watchlist:

```bash
cd API
node populate-watchlist.js
```

Expected output:
```
Connecting to MongoDB...
✅ Connected to MongoDB

Populating watchlist...
✅ Added/Updated: Xanax (ID: 18) - Alert below $830,000
✅ Added/Updated: Erotic DVD (ID: 23) - Alert below $4,600,000

Current watchlist:
  - Xanax (ID: 18): Alert below $830,000
  - Erotic DVD (ID: 23): Alert below $4,600,000

✅ Watchlist population complete!
```

## Step 5: Start the Application

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

The monitoring job will start automatically and run every 30 seconds.

## What to Expect

### In Application Logs

You'll see messages like:
```
Monitoring 2 watchlist items for price alerts...
Alert sent for Xanax at $819,000
Discord alert sent successfully
```

### In Discord

When a price drops below the threshold, you'll receive a message:
```
🚨 Cheap item found!
💊 Xanax listed at $819,000 (below $830,000)
@YourUsername
https://www.torn.com/imarket.php#/p=shop&step=item&type=Xanax
```

## Adding More Items to Watch

### Option 1: Edit the populate-watchlist.js Script

1. Open `API/populate-watchlist.js`
2. Add items to the `watchlistItems` array:
```javascript
const watchlistItems = [
  { itemId: 18, name: 'Xanax', alert_below: 830000 },
  { itemId: 23, name: 'Erotic DVD', alert_below: 4600000 },
  { itemId: 206, name: 'Feathery Hotel Coupon', alert_below: 5000000 },
  // Add more items here...
];
```
3. Run the script again: `node populate-watchlist.js`

### Option 2: Use MongoDB Directly

Using MongoDB Compass or shell:
```javascript
db.marketwatchlistitems.insertOne({
  itemId: 206,
  name: "Feathery Hotel Coupon",
  alert_below: 5000000,
  lastAlertPrice: null,
  lastAlertTimestamp: null
});
```

## How to Find Item IDs

You can find Torn item IDs in several ways:

1. **From the Torn API:**
   ```
   https://api.torn.com/v2/torn/items?cat=All&key=YOUR_API_KEY
   ```

2. **From the TornItem collection in your database:**
   ```javascript
   db.tornitems.find({ name: "Xanax" })
   ```

3. **From market URLs:**
   The item ID appears in the URL when viewing an item:
   `https://www.torn.com/imarket.php#/p=shop&step=item&itemID=18`

## Customizing Alert Thresholds

To change when you get alerted for an item:

### Using MongoDB
```javascript
db.marketwatchlistitems.updateOne(
  { itemId: 18 },
  { $set: { alert_below: 800000 } }
)
```

### Using the populate script
Edit the `alert_below` value and run the script again.

## Troubleshooting

### No alerts appearing

1. Check logs: `Monitoring X watchlist items...` should appear every 30 seconds
2. Verify Discord webhook URL is correct
3. Test the webhook manually:
   ```bash
   curl -X POST "YOUR_WEBHOOK_URL" \
     -H "Content-Type: application/json" \
     -d '{"content": "Test message"}'
   ```

### Getting duplicate alerts

This shouldn't happen! The system prevents duplicates by:
- Recording the price that triggered each alert
- Only alerting again if the price changes

If you see duplicates, check the logs and report it as a bug.

### Rate limit errors

If you're monitoring many items (30+), you might hit API rate limits:

1. Reduce the number of watchlist items
2. Or increase the monitoring interval in `backgroundFetcher.ts`:
   ```typescript
   // Change from */30 to */60 (every minute instead of every 30 seconds)
   cron.schedule('*/60 * * * * *', () => { ... });
   ```

## Database Schema

The watchlist items are stored in the `marketwatchlistitems` collection:

```javascript
{
  _id: ObjectId("..."),
  itemId: 18,
  name: "Xanax",
  alert_below: 830000,
  lastAlertPrice: null,        // Set when alert is sent
  lastAlertTimestamp: null,    // Set when alert is sent
  __v: 0
}
```

## API Rate Limiting

The monitoring system respects Torn API limits:
- 60 requests per minute maximum
- Each watchlist item = 1 request per check
- Monitoring runs every 30 seconds = 2 checks per minute
- With 2 items = 4 API calls per minute
- Plenty of room for other background jobs

You can monitor up to ~30 items before hitting rate limits with current settings.

## Next Steps

For more advanced configuration and troubleshooting, see:
- `API/MARKET_MONITORING_IMPLEMENTATION.md` - Full implementation documentation
- `API/src/jobs/README.md` - Background jobs overview

## Support

If you run into issues:
1. Check the application logs
2. Verify your `.env` configuration
3. Test Discord webhook manually
4. Check MongoDB for watchlist entries: `db.marketwatchlistitems.find()`
