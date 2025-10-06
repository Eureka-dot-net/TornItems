# 🎉 Market Price Monitoring - Implementation Complete!

## ✅ All Requirements Met

This pull request successfully implements a market price monitoring system for Torn items with Discord alerts.

---

## 📋 Requirements Checklist

✅ **New cron job** - Integrated into existing Node backend (not a separate service)  
✅ **Runs every 30 seconds** - Using node-cron with 6-field syntax  
✅ **Rate limiting** - Respects 60 requests/minute using shared Bottleneck limiter  
✅ **Discord webhook** - Utility at `/src/utils/discord.ts`  
✅ **Alert format** - Includes emoji, item name, price, threshold, user mention, and market link  
✅ **Price monitoring** - Only triggers when price crosses below threshold  
✅ **Deduplication** - Prevents spam by tracking last alert price  
✅ **Multiple items** - Supports unlimited watchlist items (within rate limits)  
✅ **Database table** - `MarketWatchlistItem` model stores watchlist configuration  
✅ **Environment variables** - Added to `.env.example`  

---

## 🚀 What Was Implemented

### 1. Database Model
**File:** `API/src/models/MarketWatchlistItem.ts`

Stores watchlist items with price thresholds and deduplication tracking:
```typescript
{
  itemId: 18,
  name: "Xanax",
  alert_below: 830000,
  lastAlertPrice: null,
  lastAlertTimestamp: null
}
```

### 2. Discord Integration
**File:** `API/src/utils/discord.ts`

Simple webhook utility that sends formatted messages to Discord.

### 3. Monitoring Job
**File:** `API/src/jobs/monitorMarketPrices.ts`

Core logic that:
- Fetches watchlist items from database
- Queries Torn API for each item's market listings
- Finds lowest priced listing
- Sends Discord alert if price is below threshold (and different from last alert)
- Prevents duplicate alerts by tracking `lastAlertPrice`

### 4. Cron Scheduler
**File:** `API/src/services/backgroundFetcher.ts` (modified)

Added cron job that runs every 30 seconds:
```typescript
cron.schedule('*/30 * * * * *', () => {
  monitorMarketPrices().catch(...);
});
```

### 5. Helper Script
**File:** `API/populate-watchlist.js`

Convenient script to populate the watchlist with Xanax and Erotic DVD.

### 6. Comprehensive Documentation
- `API/MARKET_MONITORING_SETUP.md` - Quick setup guide
- `API/MARKET_MONITORING_IMPLEMENTATION.md` - Full technical documentation
- `MARKET_MONITORING_SUMMARY.md` - Implementation summary

### 7. Tests
**File:** `API/tests/models.test.ts` (modified)

Added 3 test cases for `MarketWatchlistItem` model.

---

## 📊 Implementation Statistics

| Metric | Value |
|--------|-------|
| Files Created | 7 |
| Files Modified | 4 |
| Lines Added | 1,114 |
| Lines Removed | 2 |
| Dependencies Added | 0 |
| Breaking Changes | 0 |
| Tests Added | 3 |

**Build Status:**
- ✅ TypeScript Compilation
- ✅ ESLint Validation
- ✅ Type Checking

---

## 🎯 How It Works

### Flow Diagram
```
Every 30 seconds
    ↓
Fetch watchlist items from database
    ↓
For each item:
    ↓
Query Torn API for market listings
    ↓
Find lowest priced listing
    ↓
Is price < threshold?
    ├─ NO → Continue to next item
    └─ YES ↓
        Is price == lastAlertPrice?
        ├─ YES → Skip (duplicate)
        └─ NO ↓
            Send Discord alert
            Update lastAlertPrice
            Continue to next item
```

### Alert Example
```
🚨 Cheap item found!
💊 Xanax listed at $819,000 (below $830,000)
<@1234567890>
https://www.torn.com/imarket.php#/p=shop&step=item&type=Xanax
```

---

## 🔧 Setup Instructions

### Step 1: Configure Discord

1. Create a webhook in your Discord server
   - Server Settings → Integrations → Webhooks → New Webhook
   - Copy the webhook URL

2. Get your Discord user ID
   - Settings → Advanced → Enable Developer Mode
   - Right-click your username → Copy ID

### Step 2: Update Environment Variables

Add to your `.env` file:
```bash
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_URL
MY_DISCORD_USER_ID=1234567890
```

### Step 3: Populate Watchlist

Run the helper script to add Xanax and Erotic DVD:
```bash
cd API
node populate-watchlist.js
```

### Step 4: Start the Application

```bash
npm run dev   # Development mode
# or
npm start     # Production mode
```

The monitoring job starts automatically and runs every 30 seconds!

---

## 📈 API Rate Usage

With 2 watchlist items:
- 2 items × 1 API call per item = 2 calls per check
- Runs every 30 seconds = 2 checks per minute
- **Total: 4 API calls per minute**
- Leaves **56/60 rate limit** for other background jobs

You can monitor up to ~30 items before approaching the rate limit.

---

## 🔍 Technical Details

### Rate Limiting
- Uses shared Bottleneck rate limiter (60 req/min)
- Exponential backoff retry for rate limit errors
- Respects Torn API limits

### Deduplication
- Records `lastAlertPrice` when alert is sent
- Skips alerts if price hasn't changed
- Resets when price goes above threshold
- Allows re-alerting when price drops again

### Error Handling
- Individual item errors don't stop monitoring of other items
- Discord webhook failures are logged but don't crash the app
- Missing environment variables are logged with clear messages

### Database Schema
```typescript
MarketWatchlistItem {
  itemId: Number (unique, indexed)
  name: String
  alert_below: Number
  lastAlertPrice: Number | null
  lastAlertTimestamp: Date | null
}
```

---

## 📚 Documentation Files

1. **Quick Setup** - `API/MARKET_MONITORING_SETUP.md`
   - Step-by-step setup instructions
   - Troubleshooting guide
   - How to add more items

2. **Technical Documentation** - `API/MARKET_MONITORING_IMPLEMENTATION.md`
   - Complete implementation details
   - Code explanations
   - Customization options

3. **Summary** - `MARKET_MONITORING_SUMMARY.md`
   - High-level overview
   - Design decisions
   - Performance impact

4. **Jobs Overview** - `API/src/jobs/README.md`
   - All background jobs
   - Schedules and purposes

---

## 🧪 Testing

### Manual Testing Checklist

To verify the implementation works:

1. ✅ Configure Discord webhook and user ID
2. ✅ Populate watchlist with test items
3. ✅ Start the application
4. ✅ Check logs for "Monitoring X watchlist items..."
5. ✅ Verify Discord receives test alerts (if prices are below threshold)
6. ✅ Verify no duplicate alerts for same price
7. ✅ Verify alerts reset when price goes above threshold

### Automated Tests

Run the test suite:
```bash
npm test
```

Tests cover:
- MarketWatchlistItem model creation
- Updating alert fields
- Unique constraint enforcement

---

## 🎓 Adding More Items

### Method 1: Edit populate-watchlist.js

1. Open `API/populate-watchlist.js`
2. Add items to the array:
```javascript
const watchlistItems = [
  { itemId: 18, name: 'Xanax', alert_below: 830000 },
  { itemId: 23, name: 'Erotic DVD', alert_below: 4600000 },
  { itemId: 206, name: 'Feathery Hotel Coupon', alert_below: 5000000 },
];
```
3. Run: `node populate-watchlist.js`

### Method 2: MongoDB Shell

```javascript
db.marketwatchlistitems.insertOne({
  itemId: 206,
  name: "Feathery Hotel Coupon",
  alert_below: 5000000,
  lastAlertPrice: null,
  lastAlertTimestamp: null
});
```

### Method 3: MongoDB Compass

Use the GUI to insert documents into the `marketwatchlistitems` collection.

---

## 🐛 Troubleshooting

### No alerts appearing
1. Check logs for "Monitoring X watchlist items..."
2. Verify `DISCORD_WEBHOOK_URL` is set correctly
3. Verify items exist in database: `db.marketwatchlistitems.find()`
4. Check if prices are actually below thresholds

### Duplicate alerts
This shouldn't happen due to deduplication logic. If it does:
1. Check `lastAlertPrice` field in database
2. Verify monitoring job isn't running multiple times
3. Check logs for errors

### Rate limit errors
1. Check `TORN_RATE_LIMIT` environment variable
2. Reduce number of watchlist items
3. Increase monitoring interval (from 30 to 60 seconds)

---

## 💡 Future Enhancements

Potential improvements for the future:
- Web UI to manage watchlist items
- API endpoints to add/remove/update items
- Support for price increase alerts
- Alert history tracking
- Multiple Discord webhooks/channels
- Configurable alert cooldown periods
- Batch alerts (one message for multiple items)

---

## 🤝 Contributing

To add features or fix bugs:
1. Follow the existing code style (ESLint passes)
2. Add tests for new functionality
3. Update documentation
4. Ensure TypeScript compilation passes

---

## 📞 Support

If you encounter issues:
1. Check the logs for error messages
2. Verify environment variables are set
3. Ensure database connection is working
4. Review documentation in `API/MARKET_MONITORING_SETUP.md`

---

## ✨ Summary

This implementation provides a robust, production-ready market price monitoring system that:
- Integrates seamlessly with existing backend
- Respects API rate limits
- Prevents duplicate alerts
- Is easy to configure and extend
- Includes comprehensive documentation
- Has minimal performance impact

**The implementation is complete and ready for use!** 🚀

---

**Commits:**
1. Initial plan
2. Add market price monitoring system with Discord alerts
3. Add documentation and watchlist population script
4. Add setup guide and implementation summary

**Total Lines Changed:** 1,114 added, 2 removed
