# API Call Tracking - Quick Reference

## Discord Command

```
/numapicalls minutes:<number>
```

**Examples:**
- `/numapicalls minutes:5` - Last 5 minutes
- `/numapicalls minutes:60` - Last hour
- `/numapicalls minutes:1440` - Last 24 hours

## What You'll See

The command shows:
- 🔢 **Total API Calls**: Total count in the time period
- 📍 **By Source**: Breakdown showing which part of the app made the calls
- 🎯 **Top Endpoints**: Which API endpoints were called most
- ⚡ **Average Rate**: Calls per minute

## Common Sources

- **backgroundFetcher**: Automated market monitoring
- **DiscordUserManager**: Stat gain calculations
- **monitorMarketPrices**: Price alerts for watchlist
- **tornApi**: General API utilities
- **discord-command**: User-initiated commands
- **stockSellHelper**: Stock recommendations

## Common Endpoints

- **market/itemmarket**: Market price checks
- **torn/items**: Item catalog updates
- **torn/cityshops**: Shop stock updates
- **user/battlestats**: Battle stats fetching
- **user/stocks**: Stock holdings
- **torn/stocks**: Stock prices
- **user/bars**: Energy, nerve, happy bars
- **user/perks**: User perks
- **user/gym**: Gym information
- **torn/gyms**: Gym details

## Rate Limit Monitoring

Default rate limit: **60 requests/minute**

If your average rate is close to or exceeds 60 calls/minute, you may be hitting rate limits.

## Updated Logging

The background fetcher now logs after each cycle:
```
Cycle completed: 87 API calls in 92.34 seconds
```

This helps you track API usage in real-time through the logs.

## Data Retention

API call records are automatically deleted after **7 days** to keep the database clean.
