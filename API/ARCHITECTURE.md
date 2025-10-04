# Background Fetcher Architecture

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         External APIs                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Torn API    │  │  Torn API    │  │  YATA API    │          │
│  │  /items      │  │  /cityshops  │  │  /travel     │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼──────────────────┘
          │                  │                  │
          │ Daily (3 AM)     │ Every min        │ Every min
          │                  │                  │
          └──────────────────┴──────────────────┴────────┐
                                                          │
┌─────────────────────────────────────────────────────────▼───────┐
│                    Background Fetcher Service                    │
│  ┌────────────────────────────────────────────────────────┐     │
│  │                  Rate Limiter (Bottleneck)              │     │
│  │          • Max 60 requests/minute                       │     │
│  │          • Min 1 second between requests                │     │
│  │          • Exponential backoff on 429                   │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │ fetchTornItems │  │fetchCityShops  │  │fetchForeignStock│  │
│  │                │  │                │  │                │   │
│  │  • Daily       │  │  • Every min   │  │  • Every min   │   │
│  │  • Cached 24h  │  │  • Bulk writes │  │  • Bulk writes │   │
│  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘   │
└──────────┼─────────────────────┼─────────────────────┼──────────┘
           │                     │                     │
           ▼                     ▼                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                         MongoDB Database                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  TornItem    │  │CityShopStock │  │ForeignStock  │          │
│  │              │  │              │  │              │          │
│  │ • itemId     │  │ • shopId     │  │ • countryCode│          │
│  │ • name       │  │ • itemId     │  │ • itemId     │          │
│  │ • buy_price  │  │ • in_stock   │  │ • quantity   │          │
│  │ • market_price│ │ • price      │  │ • cost       │          │
│  │ • vendor_*   │  │ • shopName   │  │ • countryName│          │
│  │ • lastUpdated│  │ • lastUpdated│  │ • lastUpdated│          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼──────────────────┼──────────────────┼──────────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┴────────┐
                                                          │
                                                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Endpoint: /profit                       │
│                                                                  │
│  const [items, cityShops, foreignStock] = await Promise.all([   │
│    TornItem.find({ buy_price: { $ne: null } }).lean(),         │
│    CityShopStock.find().lean(),                                 │
│    ForeignStock.find().lean()                                   │
│  ]);                                                             │
│                                                                  │
│  • Fast MongoDB queries (no API calls)                          │
│  • Merges stock data by country/shop                            │
│  • Calculates profit margins                                    │
│  • Groups results by country                                    │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Timeline

```
Time      │ Background Fetcher Activity
══════════╪═══════════════════════════════════════════════════════
00:00:00  │ • Fetch city shops
          │ • Fetch foreign stock
          │ • Fetch market prices (tracked items)
──────────┼───────────────────────────────────────────────────────
00:01:00  │ • Fetch city shops
          │ • Fetch foreign stock
          │ • Fetch market prices (tracked items)
──────────┼───────────────────────────────────────────────────────
...       │ (continues every minute)
──────────┼───────────────────────────────────────────────────────
03:00:00  │ • Fetch Torn items catalog (DAILY FETCH)
          │ • Fetch city shops
          │ • Fetch foreign stock
          │ • Fetch market prices (tracked items)
──────────┼───────────────────────────────────────────────────────
03:01:00  │ • Fetch city shops
          │ • Fetch foreign stock
          │ • Fetch market prices (tracked items)
──────────┼───────────────────────────────────────────────────────
```

## Request Flow (User Request to /profit)

```
┌───────────┐
│  Client   │
└─────┬─────┘
      │ GET /profit
      ▼
┌────────────────┐
│  Express App   │
└───────┬────────┘
        │
        ▼
┌────────────────────────────────┐
│  /profit Route Handler          │
│                                 │
│  1. Query MongoDB (parallel):   │
│     • TornItem.find()           │
│     • CityShopStock.find()      │
│     • ForeignStock.find()       │
│                                 │
│  2. Process data:               │
│     • Group by country          │
│     • Merge stock info          │
│     • Calculate profits         │
│     • Sort by profit            │
│                                 │
│  3. Return JSON response        │
└───────┬────────────────────────┘
        │
        ▼
┌────────────────┐
│  Client        │
│  (Response)    │
└────────────────┘

Response Time: ~50-100ms (MongoDB query)
vs. Previous: ~2-5 seconds (external API calls)
```

## Rate Limiting Strategy

```
┌─────────────────────────────────────────────────────────────┐
│              Bottleneck Rate Limiter                         │
│                                                              │
│  Reservoir: 60 requests                                      │
│  Refresh: Every 60 seconds                                   │
│  Min Time: 1000ms between requests                           │
│  Max Concurrent: 1                                           │
│                                                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Request Queue                                      │     │
│  │  ┌────┐  ┌────┐  ┌────┐  ┌────┐                   │     │
│  │  │ R1 │──│ R2 │──│ R3 │──│ R4 │── ...             │     │
│  │  └────┘  └────┘  └────┘  └────┘                   │     │
│  │    ▲       ▲       ▲       ▲                        │     │
│  │    │       │       │       │                        │     │
│  │    1s      1s      1s      1s                       │     │
│  │                                                      │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  On HTTP 429:                                                │
│  • Retry after: baseDelay * 2^attempt                        │
│  • Max retries: 3                                            │
│  • Base delay: 1000ms                                        │
│    → Attempt 1: 1s                                           │
│    → Attempt 2: 2s                                           │
│    → Attempt 3: 4s                                           │
└─────────────────────────────────────────────────────────────┘
```

## Caching Strategy

```
┌─────────────────────────────────────────────────────────────┐
│  Torn Items Catalog                                          │
│                                                              │
│  Check: Is lastUpdated < 24 hours ago?                       │
│                                                              │
│  YES → Skip fetch (cache hit)                                │
│  NO  → Fetch from API (cache miss)                           │
│                                                              │
│  Benefits:                                                   │
│  • Saves ~1 API call per startup                             │
│  • Items catalog changes infrequently                        │
│  • Reduces unnecessary API load                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  City Shops & Foreign Stock                                  │
│                                                              │
│  Strategy: No caching (always fresh)                         │
│                                                              │
│  Reason:                                                     │
│  • Stock levels change frequently                            │
│  • Critical for profit calculations                          │
│  • Users expect real-time data                               │
└─────────────────────────────────────────────────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│  API Request                                                 │
└───────┬─────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────┐
│  Rate Limiter   │
└───────┬─────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  Try Request                                                 │
└───┬─────────────────────────────────────────────────────┬───┘
    │ Success                                   Error     │
    ▼                                                     ▼
┌─────────────┐                              ┌──────────────────┐
│  Process    │                              │  Is HTTP 429?    │
│  Data       │                              └─────┬────────┬───┘
│             │                                    │ Yes    │ No
│  Bulk Write │                                    ▼        ▼
│  to MongoDB │                            ┌─────────┐  ┌────────┐
└─────────────┘                            │ Retry   │  │  Log   │
                                           │ with    │  │  Error │
                                           │Backoff  │  │  Throw │
                                           └─────────┘  └────────┘
```

## MongoDB Indexes

```sql
-- TornItem
CREATE INDEX ON TornItem (itemId);  -- Unique
CREATE INDEX ON TornItem (lastUpdated);  -- For cache checks

-- CityShopStock
CREATE INDEX ON CityShopStock (shopId, itemId);  -- Unique compound
CREATE INDEX ON CityShopStock (shopId);  -- For queries

-- ForeignStock
CREATE INDEX ON ForeignStock (countryCode, itemId);  -- Unique compound
CREATE INDEX ON ForeignStock (countryCode);  -- For queries

-- ItemMarket
CREATE INDEX ON ItemMarket (itemId);  -- Unique
CREATE INDEX ON ItemMarket (timestamp);  -- For historical queries
```

## Performance Metrics

| Metric                    | Before (Direct API) | After (MongoDB) |
|---------------------------|---------------------|-----------------|
| /profit response time     | 2-5 seconds         | 50-100ms        |
| API calls per request     | 3                   | 0               |
| API calls per minute      | Variable (risky)    | ≤60 (controlled)|
| Data freshness            | Real-time           | ≤1 min old      |
| Server load               | High (blocking)     | Low (async)     |
| Rate limit risk           | High                | None            |

## Scalability Benefits

1. **API Independence**: /profit endpoint doesn't depend on external APIs
2. **Parallel Processing**: Background fetcher runs independently of requests
3. **Database Optimization**: Bulk writes and efficient queries
4. **Rate Control**: Guaranteed compliance with API limits
5. **Reliability**: Continues serving cached data even if APIs are down
