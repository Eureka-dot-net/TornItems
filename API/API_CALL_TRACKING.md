# API Call Tracking Feature

## Overview

This feature tracks all API calls made to the Torn API and provides statistics through a Discord command.

## What's Tracked

Every time the bot makes an API call to Torn's API, it logs:
- **Endpoint**: The API endpoint called (e.g., `user/battlestats`, `torn/items`, `market/itemmarket`)
- **Timestamp**: When the call was made
- **Source**: Where the call originated from (e.g., `backgroundFetcher`, `tornApi`, `discord-command`)

## Data Retention

API call records are automatically deleted after 7 days using MongoDB's TTL (Time To Live) index, so your database won't grow indefinitely.

## Discord Command: `/numapicalls`

### Usage

```
/numapicalls minutes:<1-1440>
```

### Parameters

- **minutes** (required): Number of minutes to look back (minimum 1, maximum 1440)
  - Example: `5` = last 5 minutes
  - Example: `60` = last hour
  - Example: `1440` = last 24 hours

### Example Outputs

#### Example 1: Last 5 minutes
```
/numapicalls minutes:5
```

**Response:**
```
📊 Torn API Call Statistics
API calls made in the last 5 minutes

🔢 Total API Calls
**87** calls

📍 By Source
• backgroundFetcher: 85 calls
• tornApi: 2 calls

🎯 Top Endpoints
• market/itemmarket: 85 calls
• user/battlestats: 1 calls
• user/travel: 1 calls

⚡ Average Rate
17.40 calls/minute
```

#### Example 2: Last hour
```
/numapicalls minutes:60
```

**Response:**
```
📊 Torn API Call Statistics
API calls made in the last 60 minutes

🔢 Total API Calls
**1,045** calls

📍 By Source
• backgroundFetcher: 1,020 calls
• tornApi: 15 calls
• discord-command: 10 calls

🎯 Top Endpoints
• market/itemmarket: 980 calls
• torn/cityshops: 20 calls
• torn/items: 10 calls
• user/battlestats: 8 calls
• user/stocks: 15 calls
• user/travel: 7 calls
• user/basic: 5 calls

⚡ Average Rate
17.42 calls/minute
```

## Updated Logging

The background fetcher already logs API call counts at the end of each cycle:

```
Successfully stored 87 market snapshots
Movement detected in 12 items (frequencies reset to 1)
Curiosity checks performed: 2
Cycle completed: 87 API calls in 92.34 seconds
```

This logging is unchanged and continues to work as before.

## Technical Details

### Database Model

```typescript
interface IApiCall {
  endpoint: string;      // e.g., 'user/battlestats'
  timestamp: Date;       // When the call was made
  source: string;        // e.g., 'backgroundFetcher'
}
```

### Indexed Fields

- `timestamp` (ascending) - for time-based queries and TTL
- `source` (ascending) - for filtering by source

### Functions

#### `logApiCall(endpoint: string, source: string)`
Logs an API call to the database. Called automatically whenever an API call is made.

#### `getApiCallCount(minutes: number): Promise<number>`
Returns the total count of API calls made in the last X minutes.

#### `getApiCallStats(minutes: number): Promise<Stats>`
Returns detailed statistics including:
- Total count
- Breakdown by source
- Breakdown by endpoint

## Where API Calls Are Logged

All Torn API calls are now tracked:

1. **tornApi.ts**
   - `user/battlestats` (source: tornApi)
   - `user/travel` (source: tornApi)

2. **backgroundFetcher.ts**
   - `torn/items` (source: backgroundFetcher)
   - `torn/cityshops` (source: backgroundFetcher)
   - `market/itemmarket` (source: backgroundFetcher)
   - `user/stocks` (source: backgroundFetcher)
   - `torn/stocks` (source: backgroundFetcher)

3. **stockSellHelper.ts**
   - `user/stocks` (source: stockSellHelper)

4. **routes/discord.ts**
   - `user/basic` (source: discord-route)

5. **discord/commands/setkey.ts**
   - `user/basic` (source: discord-command)

## Monitoring Rate Limits

The `/numapicalls` command is particularly useful for:

1. **Checking if you're hitting rate limits**: Compare your calls/minute to your configured rate limit (default 60)
2. **Debugging**: See which endpoints are being called most frequently
3. **Optimization**: Identify opportunities to reduce API calls
4. **Troubleshooting**: Verify API calls are being made when expected

## Notes

- The command response is **ephemeral** (only visible to you)
- All timestamps are in UTC
- Statistics are real-time based on database records
- Older records (>7 days) are automatically cleaned up
