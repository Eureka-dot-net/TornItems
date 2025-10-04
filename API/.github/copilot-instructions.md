# TornItems API - AI Coding Guide

## Architecture Overview

This is a **background-data-driven API** for tracking Torn City game profit opportunities. The core pattern is:
1. **Background Fetcher Service** → Collects data from external APIs on scheduled intervals
2. **MongoDB Collections** → Store cached data for fast queries  
3. **Express API** → Serves pre-processed profit calculations without API calls

Key external data sources:
- **Torn API v2** (`/items`, `/cityshops`) - Official game data, rate-limited to 60/min
- **YATA API** (`/travel/export`) - Community foreign stock data

## Critical Development Patterns

### Background Service Architecture
The `backgroundFetcher.ts` uses **Bottleneck** for rate limiting and **node-cron** for scheduling:

```typescript
// Rate limiter enforces Torn API limits
const limiter = new Bottleneck({
  reservoir: 60, reservoirRefreshAmount: 60, 
  reservoirRefreshInterval: 60 * 1000, minTime: 1000
});

// Fetch scheduling: Daily at 3 AM (items catalog), Every minute (stock data)
cron.schedule('0 3 * * *', fetchTornItems);   // Daily items catalog
cron.schedule('* * * * *', fetchCityShopStock);  // Minute-level stock updates
```

**IMPORTANT**: Always use `retryWithBackoff()` wrapper for external API calls to handle HTTP 429 responses.

### Data Models & MongoDB Patterns

Four core collections with **compound indexes** for performance:
- `TornItem` → Basic item catalog (daily updates, 24h cache check)
- `CityShopStock` → Torn city inventory (minute updates)  
- `ForeignStock` → Travel country stock (minute updates)
- `ItemMarket` → Market price tracking (selected profitable items)

**Bulk operations pattern**: Always use `bulkWrite()` for data updates:
```typescript
const bulkOps = items.map(item => ({
  updateOne: { filter: { itemId: item.id }, update: { $set: {...} }, upsert: true }
}));
await TornItem.bulkWrite(bulkOps);
```

### Profit Calculation Logic
The `/profit` endpoint merges three data sources WITHOUT external API calls:
```typescript
const [items, cityShopStock, foreignStock] = await Promise.all([
  TornItem.find({ buy_price: { $ne: null } }).lean(),
  CityShopStock.find().lean(), 
  ForeignStock.find().lean()
]);
```

Country mapping uses `COUNTRY_CODE_MAP` to match foreign stock codes (`mex` → `Mexico`).

## Development Workflow

### Essential Commands
```bash
npm run dev          # Development server with nodemon
npm run test         # Jest with --runInBand for MongoDB
npm run build        # TypeScript compilation  
npm run lint:fix     # ESLint auto-fix
npm run kill         # Force kill node processes (Windows)
```

### Database Setup
The app handles **three database scenarios**:
1. `MONGO_URI` in `.env` → External MongoDB
2. No `MONGO_URI` → Falls back to `MongoMemoryServer` 
3. Test environment → Always uses `MongoMemoryServer`

Check `src/config/db.ts` for connection logic and helpful setup guidance.

### Testing Patterns
- Tests use **mongodb-memory-server** for isolated test databases
- `setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']` handles DB lifecycle
- Run tests with `--runInBand` to prevent MongoDB connection conflicts

### Error Handling & Logging
Use structured logging with **Winston** via `utils/logger.ts`:
```typescript
import { logInfo, logError } from '../utils/logger';
logInfo('Operation completed', { itemCount: 150, duration: 5000 });
logError('API request failed', error, { endpoint: '/items', retryAttempt: 2 });
```

Logs automatically sanitize sensitive fields (`password`, `token`, etc.).

## Key Integration Points

### External API Dependencies
- **Torn API Key**: Required in `.env` as `TORN_API_KEY`
- **Rate Limiting**: Shared `limiter` instance across all fetcher functions
- **Error Recovery**: Exponential backoff on 429 responses, but fail fast on other errors

### Cross-Service Communication
- Background fetcher runs independently via `startScheduler()` in `index.ts`
- No direct coupling between API routes and fetcher service
- Data freshness indicated by `lastUpdated` timestamps in each collection

### Environment Configuration
Development uses `.env`, tests use `.env.test`. The app gracefully handles missing config with fallbacks and helpful error messages pointing to setup documentation.

## Debugging Tips

- Check `ARCHITECTURE.md` for detailed data flow diagrams
- Background fetcher logs show scheduling and API call patterns
- MongoDB queries use `.lean()` for performance in read-heavy profit calculations
- Use `npm run test:debug` for breakpoint debugging with Node inspector