# Background Fetcher Service

This service automatically fetches and stores Torn API data into MongoDB, ensuring up-to-date information without exceeding API rate limits. It uses an **adaptive monitoring system** that intelligently adjusts how frequently each item is checked based on market activity.

## Features

### Adaptive Item Monitoring System (NEW)
- **Self-Adjusting Frequencies**: Items with frequent changes are checked more often, quiet items less frequently
- **MonitorFrequency Field**: Each item has a frequency value (1-10) controlling check intervals
- **Movement Detection**: Automatically detects changes in stock, price, or sales
- **Curiosity Checks**: 5% of API budget reserved for randomly checking quiet items (MonitorFrequency ≥ 5)
- **Monitors ALL Profitable Items**: Tracks every item with positive profit (market_price - buy_price > 0)

#### How Adaptive Monitoring Works:
1. **Initialization**: New items start with MonitorFrequency = 1 (check every cycle)
2. **Cycle Counter**: Each item has `cycles_since_last_check` that increments each monitoring cycle
3. **Due Items**: Item is checked when `cycles_since_last_check >= MonitorFrequency`
4. **Movement Detection**: 
   - Compares current stock, price, sales to cached values
   - Price changes > 1% are considered movement
5. **Frequency Adjustment**:
   - **Movement Detected**: Reset MonitorFrequency to 1 (active item)
   - **No Movement**: Increment MonitorFrequency by 1 (max 10, quiet item)
6. **Curiosity Checks**: 5% of rate limit randomly checks quiet items to catch sudden activity

### Rate Limiting
- Uses Bottleneck to enforce ≤60 requests/minute
- Implements exponential backoff retry logic for HTTP 429 errors
- Minimum 1 second between requests
- Curiosity rate configurable via CURIOSITY_RATE environment variable

### Dynamic Item Tracking
- **Monitors ALL items with positive profit** (not just top N)
- No hardcoded item IDs - selections are data-driven
- Based on profitPer1 (market_price - buy_price > 0)
- Updates selections every 10 minutes
- Tracks item availability and stock levels
- Maintains legacy TrackedItem collection for backward compatibility (top 20 for Torn, top 10 for others)

### Scheduled Data Fetching

#### Daily (3 AM)
- **Torn Items Catalog**: All items with vendor and pricing information
  - Endpoint: `https://api.torn.com/v2/torn/items?cat=All&sort=ASC&key=${API_KEY}`
  - Cached for 24 hours to avoid unnecessary API calls
  - Stored in `TornItem` collection

#### Every 10 Minutes
- **Update Monitored Items**: Track ALL items with positive profit
  - Analyzes all items and calculates profit margins
  - Adds items with profit > 0 to MonitoredItem collection
  - New items get MonitorFrequency = 1 (check every cycle)
  - Also updates legacy TrackedItem collection for backward compatibility

#### Adaptive Market Snapshots (Self-Scheduling)
- **Market Snapshots**: Detailed market data with intelligent scheduling
  - Endpoint: `https://api.torn.com/v2/market/{itemId}/itemmarket?limit=20&key=${API_KEY}`
  - **Adaptive Selection**: Only checks items that are due (cycles_since_last_check >= MonitorFrequency)
  - **Curiosity Checks**: Reserves 5% of API budget for random checks of quiet items
  - **Movement Detection**: Compares stock, price, sales to detect changes
  - **Frequency Adjustment**: Increases frequency for quiet items, resets for active items
  - **Self-scheduling**: Runs continuously with intelligent rate limiting
  - Stores complete market data including all listings
  - Historical snapshots preserved for trend analysis
  - Stored in `MarketSnapshot` collection

**How Adaptive Scheduling Works:**
1. Increments `cycles_since_last_check` for all monitored items
2. Selects items where `cycles_since_last_check >= MonitorFrequency`
3. Calculates curiosity budget (5% of 60 req/min = 3 requests)
4. Randomly selects up to 3 quiet items (MonitorFrequency ≥ 5) for curiosity checks
5. Fetches market data for due items + curiosity items
6. Detects movement by comparing current data to cached data
7. Updates MonitorFrequency:
   - Movement detected → reset to 1
   - No movement → increment by 1 (max 10)
8. Calculates wait time to respect rate limit
9. Logs monitoring statistics and frequency adjustments
10. Automatically starts next cycle

Example: If 30 API calls took 20 seconds, minimum time = 30 seconds, so waits 10 more seconds before next cycle.

#### Every Minute
- **City Shop Stock**: Torn city shop inventory and stock levels
  - Endpoint: `https://api.torn.com/v2/torn?selections=cityshops&key=${API_KEY}`
  - Stored in `CityShopStock` collection
  - Historical snapshots stored in `CityShopStockHistory` collection

- **Foreign Travel Stock**: YATA travel stock data
  - Endpoint: `https://yata.yt/api/v1/travel/export/`
  - Stored in `ForeignStock` collection
  - Historical snapshots stored in `ForeignStockHistory` collection
  - Maps country codes to readable names

## MongoDB Collections

### MonitoredItem (NEW - Adaptive Monitoring)
Stores ALL items with positive profit and their adaptive monitoring state:
- `country`: Country where item is sold
- `itemId`, `name`: Item identification
- `MonitorFrequency`: How many cycles to wait between checks (1-10)
- `cycles_since_last_check`: Increments each cycle, reset when checked
- `lastCheckedData`: Cached data from last check
  - `stock`: Last known stock level
  - `price`: Last known market price
  - `sales`: Last known sales count
- `lastCheckTimestamp`: When item was last checked
- `lastUpdated`: Last metadata update

**Purpose**: Enables adaptive monitoring - active items checked frequently, quiet items less often

### MarketSnapshot
Stores complete market data snapshots:
- `country`: Country where item is sold
- `itemId`, `name`, `type`: Item identification
- `shopName`: Vendor name
- `buy_price`, `market_price`, `profitPer1`: Pricing and profit
- `in_stock`: Current stock level
- `listings`: Array of market listings with `{ price, amount }`
- `cache_timestamp`: API cache timestamp
- `fetched_at`: When snapshot was taken
- `items_sold`, `total_revenue_sold`: Sales since last snapshot
- `sales_24h_current`, `sales_24h_previous`: 24-hour sales metrics
- `trend_24h`, `hour_velocity_24`: Sales trends and velocity

**Purpose**: Historical market data for analyzing which profitable items actually sell

### TrackedItem (Legacy - Backward Compatibility)
Stores top N profitable items per country:
- `country`: Country name
- `itemIds`: Array of top item IDs (20 for Torn, 10 for others)
- `lastUpdated`: Last selection update timestamp

**Purpose**: Maintains backward compatibility with existing APIs

### TornItem
Stores basic item information and vendor details:
- `itemId`: Unique item identifier
- `name`, `description`, `type`
- `vendor_country`, `vendor_name`
- `buy_price`, `sell_price`, `market_price`
- `lastUpdated`: Timestamp of last update

### CityShopStock
Stores Torn city shop inventory:
- `shopId`, `shopName`
- `itemId`, `itemName`
- `price`, `in_stock`
- `lastUpdated`

### CityShopStockHistory (NEW)
Stores historical snapshots of Torn city shop inventory:
- `shopId`, `shopName`
- `itemId`, `itemName`
- `price`, `in_stock`
- `fetched_at`: When snapshot was taken

**Purpose**: Historical data for analyzing how quickly items sell out in city shops

### ForeignStock
Stores foreign travel shop stock:
- `countryCode`, `countryName`
- `itemId`, `itemName`
- `quantity`, `cost`
- `lastUpdated`

### ForeignStockHistory (NEW)
Stores historical snapshots of foreign travel shop stock:
- `countryCode`, `countryName`
- `itemId`, `itemName`
- `quantity`, `cost`
- `fetched_at`: When snapshot was taken

**Purpose**: Historical data for analyzing how quickly items sell out in foreign travel shops

### ItemMarket (DEPRECATED)
Legacy collection - use MarketSnapshot instead for detailed market data.

## Configuration

### Environment Variables
```env
TORN_API_KEY=your_torn_api_key_here
MONGO_URI=mongodb://localhost:27017/wasteland_rpg

# Optional: Configure rate limit (default: 60 requests per minute)
TORN_RATE_LIMIT=60

# Optional: Configure curiosity check rate (default: 0.05 = 5%)
CURIOSITY_RATE=0.05
```

The `TORN_RATE_LIMIT` variable allows you to decrease the rate limit if needed to avoid hitting Torn's API limits. The system will automatically adjust its request timing based on this value.

The `CURIOSITY_RATE` variable controls what percentage of the API budget is reserved for random checks of quiet items. Default is 0.05 (5%), meaning 3 out of 60 requests per minute are used for curiosity checks.

## Usage

The background fetcher starts automatically when the server starts:

```typescript
import { startScheduler } from './services/backgroundFetcher';

// After database connection
startScheduler();
```

## Key Functions

### `updateMonitoredItems()`
Tracks ALL items with positive profit and manages adaptive monitoring:
1. Fetches all items from database
2. Calculates profitPer1 for each item
3. Adds items with profit > 0 to MonitoredItem collection
4. New items get MonitorFrequency = 1 (check every cycle)
5. Preserves existing MonitorFrequency for known items
6. Also updates legacy TrackedItem collection for backward compatibility
7. Logs: "Successfully updated {n} monitored items with positive profit"

### `fetchMarketSnapshots()`
Adaptive monitoring with intelligent scheduling and curiosity checks:
1. Increments cycles_since_last_check for all monitored items
2. Selects due items (cycles_since_last_check >= MonitorFrequency)
3. Calculates curiosity budget (5% of rate limit)
4. Randomly selects quiet items (MonitorFrequency ≥ 5) for curiosity checks
5. Fetches market data for due items + curiosity items
6. Stores complete response including listings array
7. Detects movement by comparing to lastCheckedData
8. Updates MonitorFrequency based on movement
9. Preserves historical snapshots
10. **Calculates intelligent delay based on API calls made**
11. **Self-schedules next cycle after appropriate wait time**

**Movement Detection:**
- Stock changes (any difference)
- Price changes (>1% difference)
- Sales changes (any difference)

**Frequency Adjustment:**
- Movement detected: MonitorFrequency = 1 (check every cycle)
- No movement: MonitorFrequency += 1 (max 10, check less often)

**Curiosity Checks:**
- 5% of API budget reserved for random checks
- Only checks items with MonitorFrequency ≥ 5 (quiet items)
- Helps catch sudden activity in previously quiet items
- If movement found, resets MonitorFrequency to 1

**Self-Scheduling Logic:**
- Tracks total API calls and elapsed time
- Ensures compliance with rate limit
- Minimum wait = (totalApiCalls / RATE_LIMIT_PER_MINUTE) minutes
- Adjusts for actual time taken
- Logs monitoring statistics and frequency adjustments
- On error, retries after 1 minute

### Helper Functions

#### `selectDueItems()`
Queries MonitoredItem collection for items where cycles_since_last_check >= MonitorFrequency

#### `selectCuriosityItems(maxCount)`
Randomly selects up to maxCount items with MonitorFrequency ≥ 5 for curiosity checks

#### `detectMovement(item, currentData)`
Compares current stock/price/sales to cached lastCheckedData to detect changes

#### `updateMonitorFrequency(itemId, country, hasMovement, currentData)`
- Movement detected: Reset to 1
- No movement: Increment by 1 (max 10)
- Updates lastCheckedData cache

#### `incrementCycleCounters()`
Increments cycles_since_last_check for all monitored items at start of each cycle

## API Integration

The `/profit` endpoint now reads from MongoDB instead of making API calls:

```typescript
GET /api/profit
```

Returns grouped profit data by country with stock information merged from the database.

## Sample Market Snapshot Data

```json
{
  "country": "Mexico",
  "itemId": 180,
  "name": "Bottle of Beer",
  "type": "Alcohol",
  "shopName": "Mexican Store",
  "buy_price": 500,
  "market_price": 600,
  "profitPer1": 100,
  "in_stock": 250,
  "listings": [
    { "price": 600, "amount": 2 },
    { "price": 600, "amount": 31 }
  ],
  "cache_timestamp": 1759566303,
  "fetched_at": "2025-01-01T12:00:00.000Z"
}
```

## Logging Output

**Startup:**
```
Starting background fetcher scheduler...
Rate limit configured: 60 requests per minute
Curiosity rate: 5% (3 requests reserved for random checks)
Fetching Torn items catalog...
Successfully saved 1234 items to database
Updating monitored items (all items with profit > 0)...
Successfully updated 450 monitored items with positive profit
Monitored items initialized, starting adaptive monitoring system...
```

**Adaptive Monitoring Cycle:**
```
=== Starting adaptive monitoring cycle ===
Found 85 items due for monitoring
Selected 2 items for curiosity checks (out of 120 eligible)
Total items to check: 87 (85 due + 2 curiosity)
Successfully stored 87 market snapshots
Movement detected in 12 items (frequencies reset to 1)
Curiosity checks performed: 2
Cycle completed: 87 API calls in 92.34 seconds
Waiting 5.00 seconds before next cycle to respect rate limit...
```

**When No Items Are Due:**
```
=== Starting adaptive monitoring cycle ===
Found 0 items due for monitoring
Selected 3 items for curiosity checks (out of 200 eligible)
Total items to check: 3 (0 due + 3 curiosity)
Successfully stored 3 market snapshots
Movement detected in 0 items (frequencies reset to 1)
Curiosity checks performed: 3
Cycle completed: 3 API calls in 3.45 seconds
No wait needed, starting next cycle immediately...
```

## Error Handling

- Automatic retry with exponential backoff for rate-limited requests
- Comprehensive error logging using Winston logger
- Graceful handling of missing or empty API responses
- Database operations use bulk writes for better performance

## Development Notes

- The scheduler runs 24/7 in production
- Initial item fetch happens on startup if data is older than 24 hours
- Monitored items update immediately on startup, then every 10 minutes
- Adaptive market snapshots start immediately after monitored items initialize
- Rate limit is configurable via TORN_RATE_LIMIT environment variable (default: 60 requests per minute)
- Curiosity rate is configurable via CURIOSITY_RATE environment variable (default: 0.05 = 5%)
- All timestamps use ISO 8601 format
- Bulk operations minimize database round trips
- Historical snapshots are never overwritten
- Failed requests retry after 1 minute
- Adaptive monitoring automatically balances API usage between active and quiet items
- MonitorFrequency ranges from 1 (check every cycle) to 10 (check every 10 cycles)
- Curiosity checks help discover sudden activity in previously quiet items
