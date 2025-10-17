# Visual Example: /numapicalls Command

## Command Usage

When you type in Discord:
```
/numapicalls minutes:5
```

## Example Response

The bot will reply with an embed that looks like this:

---

### 📊 Torn API Call Statistics
*API calls made in the last **5** minutes*

#### 🔢 Total API Calls
**87** calls

#### 📍 By Source
• **backgroundFetcher**: 85 calls
• **tornApi**: 2 calls

#### 🎯 Top Endpoints
• **market/itemmarket**: 85 calls
• **user/battlestats**: 1 calls
• **user/travel**: 1 calls

#### ⚡ Average Rate
17.40 calls/minute

---

## Interpreting the Results

### Total API Calls
This shows how many requests were made to the Torn API in the specified time period.

### By Source
This breakdown shows which part of the application made the API calls:
- **backgroundFetcher**: Automated market monitoring system
- **tornApi**: General API utility functions
- **DiscordUserManager**: User stat calculations
- **monitorMarketPrices**: Price alert monitoring
- **discord-command**: User-initiated commands
- **stockSellHelper**: Stock recommendation calculations

### Top Endpoints
Shows which specific API endpoints were called most frequently. Common endpoints:
- **market/itemmarket**: Checking item prices on the market
- **torn/items**: Fetching the item catalog
- **torn/cityshops**: Checking city shop stock
- **user/battlestats**: Fetching user battle statistics
- **user/stocks**: Checking stock holdings
- **torn/stocks**: Fetching stock prices

### Average Rate
Shows the average number of API calls per minute. Important for monitoring rate limits:
- **Default limit**: 60 calls/minute
- **Warning**: If average approaches or exceeds limit, may hit rate limiting

## Additional Examples

### Last Hour
```
/numapicalls minutes:60
```

Shows API usage over the past hour, useful for:
- Identifying patterns in API usage
- Monitoring background job activity
- Debugging API rate limit issues

### Last 24 Hours
```
/numapicalls minutes:1440
```

Shows daily API usage patterns, useful for:
- Long-term trend analysis
- Capacity planning
- Identifying high-traffic periods

## Privacy Note

Responses are **ephemeral** (only visible to you), so your API usage stats remain private.
