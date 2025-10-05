# Torn Stock Market Tracking System - Implementation Summary

## Overview
This document describes the implementation of a stock market tracking system that records Torn stock prices every 30 minutes and provides ranked BUY and SELL recommendations for all Torn stocks.

## What Was Implemented

### 1. Model: `StockPriceSnapshot`
**File:** `API/src/models/StockPriceSnapshot.ts`

A new Mongoose model for storing historical stock price data:

```typescript
{
  ticker: string,      // e.g. "FHG"
  name: string,        // e.g. "Feathery Hotels Group"
  price: number,       // current stock price
  timestamp: Date      // when the snapshot was taken
}
```

**Features:**
- ✅ Compound index on `{ ticker: 1, timestamp: -1 }` for optimal query performance
- ✅ TTL index on `timestamp` to automatically delete records older than 14 days
- ✅ Optimized for efficient time-series queries

### 2. Background Job: Stock Price Fetching
**File:** `API/src/services/backgroundFetcher.ts`

Added `fetchStockPrices()` function that:
- Fetches stock data from Torn API: `https://api.torn.com/v2/torn?selections=stocks&key=API_KEY`
- Extracts stock information (ticker, name, current_price) from all available stocks
- Bulk inserts price snapshots with a single timestamp
- Handles API errors gracefully (logs errors, continues on next cycle)
- Uses existing rate limiter to avoid API throttling

**Schedule:**
- Runs **every 30 minutes** via cron: `*/30 * * * *`
- Executes immediately on application startup
- Integrated into existing `startScheduler()` function

### 3. Controller: Stock Recommendations
**File:** `API/src/routes/stocks.ts`

Created new route: **`GET /api/stocks/recommendations`**

**Algorithm:**
1. Uses MongoDB aggregation to efficiently fetch all stock data from last 7 days
2. Groups data by ticker to get current price, oldest price, and all prices
3. For each stock:
   - Calculates `change_7d = ((current - week_ago) / week_ago) * 100`
   - Calculates `volatility = stddev(last_7d_prices)`
   - Computes `score = -change_7d / volatility` (BUY score)
   - Computes `sell_score = change_7d / volatility` (SELL score)
   - Determines recommendation based on score ranges

**Recommendation Ranges:**
| Score Range | Recommendation |
|-------------|----------------|
| score ≥ 3 | STRONG_BUY |
| 1 ≤ score < 3 | BUY |
| -1 < score < 1 | HOLD |
| -3 < score ≤ -1 | SELL |
| score ≤ -3 | STRONG_SELL |

**Response Format:**
```json
[
  {
    "ticker": "FHG",
    "name": "Feathery Hotels Group",
    "price": 1499.22,
    "change_7d": -12.3,
    "volatility": 3.5,
    "score": 3.51,
    "sell_score": -3.51,
    "recommendation": "STRONG_BUY"
  }
]
```

**Performance Features:**
- ✅ Single aggregation query (no N+1 problem)
- ✅ Efficient in-memory calculations
- ✅ Returns ALL stocks, sorted by score descending (best buys first)
- ✅ Frontend can re-sort by `sell_score` for best sells

### 4. Route Integration
**File:** `API/src/app.ts`

- Added stocks route to Express app
- Available at: `/api/stocks/recommendations`
- Uses existing CORS and middleware configuration

## Testing

### Unit Tests
**File:** `API/tests/stocks.test.ts`

Comprehensive test suite covering:
- ✅ Error handling when no data exists
- ✅ Correct calculation of scores and recommendations
- ✅ Proper sorting by score
- ✅ Handling of insufficient history

**File:** `API/tests/models.test.ts`

Added tests for:
- ✅ StockPriceSnapshot model creation
- ✅ Compound index verification

## How to Use

### Automatic Execution
The stock price fetcher runs automatically once the application starts:
- Initial fetch on startup
- Subsequent fetches every 30 minutes

### API Endpoint
```bash
# Get all stock recommendations
curl http://localhost:3000/api/stocks/recommendations
```

### Monitoring
Check application logs for job execution:
```
Fetching stock prices...
Successfully saved 32 stock price snapshots to database
```

## Data Retention

- Stock price snapshots are **automatically deleted** after 14 days via TTL index
- This keeps the database size manageable
- 14 days of history is sufficient for 7-day volatility calculations with a buffer

## Performance Considerations

### Optimizations Applied
1. **Aggregation Pipeline**: Single query instead of N queries (following pattern from `profit.ts`)
2. **Compound Indexes**: Fast queries on `{ ticker, timestamp }`
3. **TTL Index**: Automatic cleanup without manual intervention
4. **Bulk Inserts**: All stocks inserted in a single operation
5. **Rate Limiting**: Uses existing Bottleneck limiter to avoid API throttling

### Expected Performance
- **API Response Time**: < 100ms for ~32 stocks
- **Database Queries**: 1 aggregation query (not N+1)
- **Memory Usage**: Minimal (in-memory calculations only)

## Scalability

The system is designed to handle:
- Any number of Torn stocks (currently ~32)
- 7+ days of historical data
- Multiple concurrent API requests
- Automatic data cleanup via TTL

## Future Enhancements (Optional)

1. Add pagination for very large result sets
2. Cache responses for 30-60 seconds to reduce load
3. Add filters (by ticker, recommendation type)
4. Add historical trend data (30-day, 90-day)
5. Add stock-specific endpoint: `/api/stocks/recommendations/:ticker`

## Notes

- ✅ Does NOT modify existing routes or controllers
- ✅ Does NOT alter existing database schemas
- ✅ Follows existing patterns from the codebase
- ✅ Uses existing infrastructure (cron, rate limiter, logger)
- ✅ Minimal dependencies (no new packages required)
- ✅ Backward compatible with existing API

## Files Created

1. `API/src/models/StockPriceSnapshot.ts` - New model
2. `API/src/routes/stocks.ts` - New controller
3. `API/tests/stocks.test.ts` - New tests
4. `API/STOCK_TRACKING_IMPLEMENTATION.md` - This documentation

## Files Modified

1. `API/src/services/backgroundFetcher.ts` - Added stock price fetching
2. `API/src/app.ts` - Added stocks route
3. `API/tests/models.test.ts` - Added StockPriceSnapshot tests

## Example Usage

### Get Best Buy Recommendations
```javascript
const response = await fetch('/api/stocks/recommendations');
const stocks = await response.json();

// Already sorted by score descending
const topBuys = stocks.filter(s => s.recommendation === 'STRONG_BUY');
```

### Get Best Sell Recommendations
```javascript
const response = await fetch('/api/stocks/recommendations');
const stocks = await response.json();

// Re-sort by sell_score descending
const topSells = stocks
  .filter(s => s.sell_score !== null)
  .sort((a, b) => b.sell_score - a.sell_score)
  .filter(s => ['STRONG_SELL', 'SELL'].includes(s.recommendation));
```

### Get Specific Stock
```javascript
const response = await fetch('/api/stocks/recommendations');
const stocks = await response.json();
const fhg = stocks.find(s => s.ticker === 'FHG');
```
