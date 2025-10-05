# MarketHistory Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        EXISTING SYSTEM                               │
│                      (NOT MODIFIED)                                  │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  Torn API        │
│  YATA API        │
└────────┬─────────┘
         │
         ├─ Rate Limited (60/min)
         │
         ▼
┌─────────────────────────────────────┐
│  Background Fetcher                 │
│  (backgroundFetcher.ts)             │
│  - Fetches market data              │
│  - Creates snapshots                │
└────────┬────────────────────────────┘
         │
         │ Stores snapshots
         ▼
┌─────────────────────────────────────┐
│  MarketSnapshot Collection          │
│  - Multiple snapshots per item/day  │◄───────┐
│  - Detailed listings data           │        │
│  - Sales metrics                    │        │
└─────────────────────────────────────┘        │
                                                │
                                                │
┌─────────────────────────────────────────────────────────────────────┐
│                         NEW SYSTEM                                   │
│                      (ADDED IN THIS PR)                              │
└─────────────────────────────────────────────────────────────────────┘
                                                │
         ┌──────────────────────────────────────┘
         │
         │ Daily Aggregation
         │ (Midnight UTC)
         │
         ▼
┌─────────────────────────────────────┐
│  Aggregation Job                    │
│  (aggregateMarketHistory.ts)        │
│  - Queries last 24h snapshots   ────┘
│  - Groups by country:itemId         │
│  - Calculates metrics               │
│  - Computes profit fields           │
└────────┬────────────────────────────┘
         │
         │ Upserts daily summaries
         ▼
┌─────────────────────────────────────┐
│  MarketHistory Collection           │
│  - ONE record per item per day      │
│  - Aggregated metrics               │
│  - Profit calculations              │
│  - Unique index: {id, date}         │
└─────────────────────────────────────┘
```

## Data Reduction Example

### Before (MarketSnapshot only)
- Item A: 50 snapshots/day × 365 days = **18,250 documents/year**
- 1000 items: **18.25 million documents/year**

### After (MarketSnapshot + MarketHistory)
- Item A: 50 snapshots/day (kept for real-time) + 1 history/day × 365 days = **50 + 365 documents**
- 1000 items: **50,000 snapshots + 365,000 history = 415,000 documents**
- **Potential for cleanup**: Old snapshots can be archived after aggregation

## Job Schedule

```
Default Schedule: 0 0 * * * (Daily at Midnight UTC)

┌───────────┬───────────┬───────────┬───────────┬───────────┐
│   00:00   │   06:00   │   12:00   │   18:00   │   00:00   │
│   UTC     │   UTC     │   UTC     │   UTC     │   UTC     │
└─────┬─────┴───────────┴───────────┴───────────┴─────┬─────┘
      │                                                 │
      │ Job runs                                        │ Job runs
      │ - Queries snapshots from last 24h               │ again
      │ - Aggregates: 2025-01-05                        │
      │ - Upserts to MarketHistory                      │
      └─────────────────────────────────────────────────┘

Configurable via: HISTORY_AGGREGATION_CRON environment variable
```

## Profit Calculations

All three profit fields use the SAME logic as the profit route:

1. **estimated_market_value_profit**
   ```
   = market_price - buy_price
   ```

2. **lowest_50_profit**
   ```
   = (average of lowest 50 listings) - buy_price
   
   Algorithm:
   - Sort listings by price ascending
   - Take first 50 items (or fewer if less available)
   - Calculate weighted average
   - Subtract buy_price
   ```

3. **sold_profit**
   ```
   = average_price_items_sold - buy_price
   
   where average_price_items_sold = total_revenue / total_items_sold
   ```

## Field Aggregation Strategy

| Field | Strategy | Source |
|-------|----------|--------|
| `id` | Direct copy | TornItem.itemId |
| `name` | Direct copy | TornItem.name |
| `date` | Current UTC date | new Date().toISOString().split('T')[0] |
| `buy_price` | Direct value | TornItem.buy_price |
| `market_price` | Direct value | TornItem.market_price |
| `profitPer1` | Calculated | market_price - buy_price |
| `shop_name` | Direct value | TornItem.vendor_name |
| `in_stock` | Current value | CityShopStock or ForeignStock |
| `sales_24h_current` | From snapshot | Latest MarketSnapshot.sales_24h_current |
| `sales_24h_previous` | From snapshot | Latest MarketSnapshot.sales_24h_previous |
| `trend_24h` | From snapshot | Latest MarketSnapshot.trend_24h |
| `hour_velocity_24` | From snapshot | Latest MarketSnapshot.hour_velocity_24 |
| `average_price_items_sold` | Aggregated | Sum(revenue) / Sum(items) from sales_by_price |
| `estimated_market_value_profit` | Calculated | market_price - buy_price |
| `lowest_50_profit` | Calculated | Avg(lowest 50 listings) - buy_price |
| `sold_profit` | Calculated | average_price_items_sold - buy_price |

## Error Handling

```
Job Start
    │
    ├─ Fetch Data
    │   └─ Error? → Log & throw (job fails)
    │
    ├─ Process Each Item
    │   ├─ Item Error? → Log & continue (skip this item)
    │   └─ Success → Add to aggregation list
    │
    ├─ Bulk Upsert
    │   └─ Error? → Log & throw (job fails)
    │
    └─ Log Summary
        - Items processed
        - Items with errors
        - Records upserted
        - Duration
```

## Monitoring

Look for these log entries to monitor job health:

```
[INFO] === Starting MarketHistory aggregation job ===
[INFO] Fetching data from database...
[INFO] Retrieved 1500 snapshots, 250 items
[INFO] Processing 320 unique country-item combinations
[INFO] Upserting 320 records into MarketHistory...
[INFO] === MarketHistory aggregation job completed ===
{
  duration: "5.23s",
  itemsProcessed: 320,
  itemsWithErrors: 0,
  recordsUpserted: 320,
  date: "2025-01-05"
}
```

Error entries will include:
```
[ERROR] Error processing item from key mex:123
[ERROR] MarketHistory aggregation job failed
```
