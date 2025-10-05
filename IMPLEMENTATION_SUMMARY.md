# Background Fetcher Implementation Summary

## Overview
Successfully implemented a background fetcher service that automatically maintains up-to-date Torn API data in MongoDB without exceeding rate limits.

## Key Components

### 1. Mongoose Models (API/src/models/)
- **TornItem.ts**: Stores Torn items catalog with vendor and pricing information
- **CityShopStock.ts**: Stores Torn city shop inventory and stock levels
- **ForeignStock.ts**: Stores YATA foreign travel shop stock data
- **ItemMarket.ts**: Stores computed weighted average market prices

### 2. Background Fetcher Service (API/src/services/backgroundFetcher.ts)
- Rate-limited API fetcher using Bottleneck (≤60 req/min)
- Exponential backoff retry logic for HTTP 429 errors
- Scheduled data fetching:
  - **Daily (3 AM)**: Torn items catalog
  - **Every minute**: City shops, foreign stock, market prices
- Smart caching to avoid redundant API calls

### 3. Updated Profit Route (API/src/routes/profit.ts)
- Migrated from direct API calls to MongoDB queries
- Significantly faster response times
- No API rate limit impact
- Maintains same response format for backward compatibility

### 4. Integration (API/src/index.ts)
- Scheduler automatically starts after database connection
- Runs 24/7 in production
- Graceful error handling and logging

## Architecture Highlights

### Rate Limiting
```typescript
const limiter = new Bottleneck({
  reservoir: 60,
  reservoirRefreshAmount: 60,
  reservoirRefreshInterval: 60 * 1000,
  maxConcurrent: 1,
  minTime: 1000,
});
```

### Smart Caching
```typescript
// Skip if fetched within last 24 hours
const lastItem = await TornItem.findOne().sort({ lastUpdated: -1 });
if (lastItem && Date.now() - lastItem.lastUpdated.getTime() < 24 * 60 * 60 * 1000) {
  return;
}
```

### Bulk Operations
```typescript
// Efficient database updates
const bulkOps = items.map((item) => ({
  updateOne: {
    filter: { itemId: item.id },
    update: { $set: { ...itemData, lastUpdated: new Date() } },
    upsert: true,
  },
}));
await TornItem.bulkWrite(bulkOps);
```

### Retry Logic
```typescript
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.response?.status === 429) {
        await sleep(baseDelay * Math.pow(2, i));
        continue;
      }
      throw error;
    }
  }
}
```

## Configuration

### Environment Variables Required
```env
TORN_API_KEY=your_torn_api_key_here
MONGO_URI=mongodb://localhost:27017/wasteland_rpg
```

### Customizable Settings
- **MonitoredItem system**: Tracks all profitable items with adaptive monitoring
- **Schedule timings**: Can be adjusted in cron expressions
- **Rate limits**: Configurable via Bottleneck settings
- **Curiosity rate**: Configurable via CURIOSITY_RATE environment variable

## Benefits

### Performance
- ✅ Eliminated API calls from user requests
- ✅ Faster response times (MongoDB vs external API)
- ✅ Reduced latency for profit calculations

### Reliability
- ✅ Automatic retry with exponential backoff
- ✅ Comprehensive error logging
- ✅ Graceful handling of missing data

### Scalability
- ✅ Background processing offloaded from request handlers
- ✅ Bulk database operations for efficiency
- ✅ Rate limiting prevents API quota issues

### Maintainability
- ✅ Centralized data fetching logic
- ✅ Clear separation of concerns
- ✅ Well-documented code and configuration

## Data Flow

```
┌─────────────────┐
│  Torn API       │
│  YATA API       │
└────────┬────────┘
         │
         ├─ (Rate Limited)
         │
         ▼
┌─────────────────────┐
│ Background Fetcher  │
│ - Schedules jobs    │
│ - Retries on error  │
│ - Bulk writes       │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  MongoDB            │
│  - TornItem         │
│  - CityShopStock    │
│  - ForeignStock     │
│  - ItemMarket       │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  /profit Route      │
│  (Fast queries)     │
└─────────────────────┘
```

## Testing

Test infrastructure created in `tests/` directory:
- Model validation tests
- Database connection setup
- Ready for integration tests

**Note**: Tests require MongoDB connection. In production, use actual MongoDB instance or MongoDB Atlas.

## Next Steps (Optional Enhancements)

1. **Expand monitoring**: Add more items to MonitoredItem collection
2. **Implement webhooks**: Notify on price changes
3. **Add analytics**: Track fetch success rates
4. **Dashboard**: Real-time status monitoring
5. **Historical data**: Store price history for trends
6. **Alerts**: Notify on exceptional profit opportunities

## Deployment Checklist

- [ ] Set TORN_API_KEY in production environment
- [ ] Configure MONGO_URI for production database
- [ ] Verify MongoDB indexes are created
- [ ] Monitor logs for first 24 hours
- [ ] Validate data freshness in MongoDB
- [ ] Test /profit endpoint response times
- [ ] Set up monitoring/alerting for scheduler failures

## Files Changed

- ✅ Created: `src/models/TornItem.ts`
- ✅ Created: `src/models/CityShopStock.ts`
- ✅ Created: `src/models/ForeignStock.ts`
- ✅ Created: `src/models/ItemMarket.ts`
- ✅ Created: `src/services/backgroundFetcher.ts`
- ✅ Modified: `src/routes/profit.ts`
- ✅ Modified: `src/index.ts`
- ✅ Modified: `.env.example`
- ✅ Updated: `package.json` (added bottleneck, @types/node-cron)
- ✅ Created: `BACKGROUND_FETCHER.md` (documentation)
- ✅ Created: `tests/setup.ts` and `tests/models.test.ts`

## Success Metrics

✅ Code compiles without errors  
✅ Linter passes with 0 warnings  
✅ Type checking passes  
✅ All functions properly exported  
✅ Background fetcher integrates with server startup  
✅ Profit route successfully migrated to MongoDB  
✅ Rate limiting properly configured  
✅ Retry logic with exponential backoff implemented  
✅ Comprehensive error handling in place  
✅ Documentation complete  

## Conclusion

The background fetcher is fully implemented and ready for deployment. It will automatically:
1. Fetch Torn items once daily (or on startup if stale)
2. Update city shop stock every minute
3. Update foreign stock every minute
4. Update monitored items every 10 minutes
5. Use adaptive monitoring to fetch market snapshots efficiently
6. Serve all data from MongoDB via the /profit endpoint

The implementation follows best practices for production systems including rate limiting, error handling, logging, and efficient database operations.
