# MarketHistory Aggregation Job

## Overview
The `aggregateMarketHistory` job processes MarketSnapshot data to create daily summary records for each item. This reduces data volume while preserving key metrics over time.

## How It Works

### Schedule
- **Default**: Runs daily at midnight UTC (`0 0 * * *`)
- **Configurable**: Set `HISTORY_AGGREGATION_CRON` environment variable

### Data Processing
1. Queries all MarketSnapshot documents from the last 24 hours
2. Groups snapshots by `country:itemId` combination
3. For each group:
   - Fetches item details from TornItem collection
   - Retrieves current stock information (city shops or foreign travel)
   - Calculates aggregated metrics:
     - Average buy/market prices
     - Profit calculations (estimated_market_value_profit, lowest_50_profit, sold_profit)
     - Sales metrics (sales_24h_current, sales_24h_previous, trend_24h, hour_velocity_24)
     - Average price of items sold
4. Upserts results into MarketHistory collection
   - Uses `{ id, date }` as unique key
   - Updates existing record if one exists for the same item and date

### Fields Aggregated

| Field | Source | Calculation Method |
|-------|--------|-------------------|
| `id` | TornItem.itemId | Direct mapping |
| `name` | TornItem.name | Direct mapping |
| `date` | Current UTC date | YYYY-MM-DD format |
| `buy_price` | TornItem.buy_price | Direct value |
| `market_price` | TornItem.market_price | Direct value |
| `profitPer1` | Calculated | market_price - buy_price |
| `shop_name` | TornItem.vendor_name | Direct value |
| `in_stock` | CityShopStock or ForeignStock | Latest available stock |
| `sales_24h_current` | Latest MarketSnapshot | From snapshot data |
| `sales_24h_previous` | Latest MarketSnapshot | From snapshot data |
| `trend_24h` | Latest MarketSnapshot | Percentage change |
| `hour_velocity_24` | Latest MarketSnapshot | Sales per hour |
| `average_price_items_sold` | Aggregated from sales_by_price | Total revenue / total items sold |
| `estimated_market_value_profit` | Calculated | market_price - buy_price |
| `lowest_50_profit` | Calculated from listings | Avg of lowest 50 listings - buy_price |
| `sold_profit` | Calculated | average_price_items_sold - buy_price |

### Logging
Each job run logs:
- Start time
- Number of snapshots and items processed
- Number of unique country-item combinations
- Items processed successfully
- Items with errors
- Number of records upserted
- Total execution duration
- Target date for the aggregation

### Error Handling
- Individual item errors are logged but don't stop the entire job
- Job fails gracefully if database connection is unavailable
- Errors include context (item ID, error message) for debugging

## Configuration

### Environment Variables
```bash
# Schedule for history aggregation (cron format)
# Default: 0 0 * * * (midnight UTC daily)
HISTORY_AGGREGATION_CRON=0 0 * * *
```

### Example Cron Schedules
- `0 0 * * *` - Daily at midnight UTC (default)
- `0 2 * * *` - Daily at 2 AM UTC
- `0 */6 * * *` - Every 6 hours
- `0 0 * * 0` - Weekly on Sunday at midnight UTC

## Database Schema

### MarketHistory Collection
```typescript
{
  id: Number,              // Item ID (indexed)
  name: String,            // Item name
  date: String,            // YYYY-MM-DD (indexed)
  buy_price: Number,       // Shop buy price
  market_price: Number,    // Market price
  profitPer1: Number,      // Profit per item
  shop_name: String,       // Vendor/shop name
  in_stock: Number,        // Current stock level
  sales_24h_current: Number,
  sales_24h_previous: Number,
  trend_24h: Number,       // Sales trend percentage
  hour_velocity_24: Number, // Sales per hour
  average_price_items_sold: Number,
  estimated_market_value_profit: Number,
  lowest_50_profit: Number,
  sold_profit: Number
}
```

**Indexes:**
- Compound unique index: `{ id: 1, date: 1 }`
- Individual index: `{ id: 1 }`
- Individual index: `{ date: 1 }`

## Usage

### Manual Execution
```typescript
import { aggregateMarketHistory } from './jobs/aggregateMarketHistory';

// Run manually
await aggregateMarketHistory();
```

### Integration
The job is automatically scheduled when the background fetcher starts. See `src/services/backgroundFetcher.ts` for integration details.

## Notes

- ✅ Does NOT modify existing MarketSnapshot schema or data
- ✅ Does NOT alter any current routes or API responses
- ✅ Creates one summary record per item per UTC day
- ✅ Safe to run multiple times on the same day (upserts prevent duplicates)
- ✅ Respects MongoDB connection configuration from environment
