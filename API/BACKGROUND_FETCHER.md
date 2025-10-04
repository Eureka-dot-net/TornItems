# Background Fetcher Service

This service automatically fetches and stores Torn API data into MongoDB, ensuring up-to-date information without exceeding API rate limits. It dynamically tracks the top 10 most profitable items per country and stores detailed market snapshots.

## Features

### Rate Limiting
- Uses Bottleneck to enforce ≤60 requests/minute
- Implements exponential backoff retry logic for HTTP 429 errors
- Minimum 1 second between requests

### Dynamic Item Tracking
- **Automatically determines** top 10 most profitable items per country
- No hardcoded item IDs - selections are data-driven
- Based on profitPer1 (market_price - buy_price)
- Updates selections every 10 minutes
- Tracks item availability and stock levels

### Scheduled Data Fetching

#### Daily (3 AM)
- **Torn Items Catalog**: All items with vendor and pricing information
  - Endpoint: `https://api.torn.com/v2/torn/items?cat=All&sort=ASC&key=${API_KEY}`
  - Cached for 24 hours to avoid unnecessary API calls
  - Stored in `TornItem` collection

#### Every 10 Minutes
- **Update Tracked Items**: Dynamically determine top 10 profitable items per country
  - Analyzes all items and calculates profit margins
  - Updates `TrackedItem` collection with current selections
  - Logs tracked item names per country

#### Self-Scheduling Market Snapshots
- **Market Snapshots**: Detailed market data for tracked items
  - Endpoint: `https://api.torn.com/v2/market/{itemId}/itemmarket?limit=20&key=${API_KEY}`
  - **Self-scheduling**: Runs continuously with intelligent rate limiting
  - After each complete cycle, calculates wait time to respect 60 requests/minute limit
  - Starts next cycle immediately if no wait needed, or after calculated delay
  - Stores complete market data including all listings
  - Historical snapshots preserved for trend analysis
  - Stored in `MarketSnapshot` collection

**How Self-Scheduling Works:**
1. Fetches market data for all tracked items across all countries
2. Tracks total API calls made during cycle
3. Calculates minimum time needed: `(totalApiCalls / 60) * 60 seconds`
4. Compares with actual elapsed time
5. Waits additional time if needed to respect rate limit
6. Automatically starts next cycle

Example: If 30 API calls took 20 seconds, minimum time = 30 seconds, so waits 10 more seconds before next cycle.

#### Every Minute
- **City Shop Stock**: Torn city shop inventory and stock levels
  - Endpoint: `https://api.torn.com/v2/torn?selections=cityshops&key=${API_KEY}`
  - Stored in `CityShopStock` collection

- **Foreign Travel Stock**: YATA travel stock data
  - Endpoint: `https://yata.yt/api/v1/travel/export/`
  - Stored in `ForeignStock` collection
  - Maps country codes to readable names

## MongoDB Collections

### MarketSnapshot (NEW)
Stores complete market data snapshots:
- `country`: Country where item is sold
- `itemId`, `name`, `type`: Item identification
- `shopName`: Vendor name
- `buy_price`, `market_price`, `profitPer1`: Pricing and profit
- `in_stock`: Current stock level
- `listings`: Array of market listings with `{ price, amount }`
- `cache_timestamp`: API cache timestamp
- `fetched_at`: When snapshot was taken

**Purpose**: Historical market data for analyzing which profitable items actually sell

### TrackedItem (NEW)
Stores dynamically selected items per country:
- `country`: Country name
- `itemIds`: Array of top 10 profitable item IDs
- `lastUpdated`: Last selection update timestamp

**Purpose**: Maintains list of items to monitor for each country

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

### ForeignStock
Stores foreign travel shop stock:
- `countryCode`, `countryName`
- `itemId`, `itemName`
- `quantity`, `cost`
- `lastUpdated`

### ItemMarket (DEPRECATED)
Legacy collection - use MarketSnapshot instead for detailed market data.

## Configuration

### Environment Variables
```env
TORN_API_KEY=your_torn_api_key_here
MONGO_URI=mongodb://localhost:27017/wasteland_rpg
```

## Usage

The background fetcher starts automatically when the server starts:

```typescript
import { startScheduler } from './services/backgroundFetcher';

// After database connection
startScheduler();
```

## Key Functions

### `updateTrackedItems()`
Dynamically determines and stores top 10 profitable items per country:
1. Fetches all items from database
2. Calculates profitPer1 for each item
3. Groups items by country
4. Selects top 10 by profit per country
5. Updates TrackedItem collection
6. Logs: "Tracking top 10 profitable items in {country}: [item names]"

### `fetchMarketSnapshots()`
Collects detailed market data for tracked items with self-scheduling:
1. Reads tracked items from TrackedItem collection
2. Fetches market data from Torn API for each item
3. Stores complete response including listings array
4. Preserves historical snapshots
5. Logs: "Stored {n} listings for {country} in MongoDB"
6. **Calculates intelligent delay based on API calls made**
7. **Self-schedules next cycle after appropriate wait time**

**Self-Scheduling Logic:**
- Tracks total API calls and elapsed time
- Ensures compliance with 60 requests/minute rate limit
- Minimum wait = (totalApiCalls / 60) minutes
- Adjusts for actual time taken
- Logs wait time before next cycle
- On error, retries after 2 minutes

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

```
Starting background fetcher scheduler...
Fetching Torn items catalog...
Successfully saved 1234 items to database
Determining top 10 profitable items per country...
Tracking top 10 profitable items in Mexico: [Item A, Item B, Item C, ...]
Tracking top 10 profitable items in Canada: [Item X, Item Y, Item Z, ...]
Starting self-scheduling market snapshots...
Fetching market snapshots for tracked items...
Fetching market data for 10 items in Mexico...
Stored 10 listings for Mexico in MongoDB
Successfully stored 120 market snapshots across all countries
Cycle completed: 120 API calls in 125.34 seconds
No wait needed, starting next cycle immediately...
```

Or with rate limiting:

```
Cycle completed: 120 API calls in 90.50 seconds
Waiting 29.50 seconds before next cycle to respect rate limit...
```

## Error Handling

- Automatic retry with exponential backoff for rate-limited requests
- Comprehensive error logging using Winston logger
- Graceful handling of missing or empty API responses
- Database operations use bulk writes for better performance

## Development Notes

- The scheduler runs 24/7 in production
- Initial item fetch happens on startup if data is older than 24 hours
- Tracked items update 1 minute after startup, then every 10 minutes
- Market snapshots start ~65 seconds after startup (5 seconds after tracked items initialize), then use self-scheduling with intelligent rate limiting
- All timestamps use ISO 8601 format
- Bulk operations minimize database round trips
- Historical snapshots are never overwritten
