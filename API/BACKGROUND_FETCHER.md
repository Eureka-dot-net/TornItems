# Background Fetcher Service

This service automatically fetches and stores Torn API data into MongoDB, ensuring up-to-date information without exceeding API rate limits.

## Features

### Rate Limiting
- Uses Bottleneck to enforce ≤60 requests/minute
- Implements exponential backoff retry logic for HTTP 429 errors
- Minimum 1 second between requests

### Scheduled Data Fetching

#### Daily (3 AM)
- **Torn Items Catalog**: All items with vendor and pricing information
  - Endpoint: `https://api.torn.com/v2/torn/items?cat=All&sort=ASC&key=${API_KEY}`
  - Cached for 24 hours to avoid unnecessary API calls
  - Stored in `TornItem` collection

#### Every Minute
- **City Shop Stock**: Torn city shop inventory and stock levels
  - Endpoint: `https://api.torn.com/v2/torn?selections=cityshops&key=${API_KEY}`
  - Stored in `CityShopStock` collection

- **Foreign Travel Stock**: YATA travel stock data
  - Endpoint: `https://yata.yt/api/v1/travel/export/`
  - Stored in `ForeignStock` collection
  - Maps country codes to readable names

- **Market Prices** (for selected items): Weighted average prices
  - Endpoint: `https://api.torn.com/v2/market/{itemId}/itemmarket?key=${API_KEY}`
  - Computes weighted average of cheapest 50 units
  - Stored in `ItemMarket` collection

## MongoDB Collections

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

### ItemMarket
Stores computed market prices:
- `itemId`
- `weightedAveragePrice`
- `timestamp`

## Configuration

### Environment Variables
```env
TORN_API_KEY=your_torn_api_key_here
MONGO_URI=mongodb://localhost:27017/wasteland_rpg
```

### Tracked Items
To configure which items to track for market prices, edit the `TRACKED_ITEMS` array in `src/services/backgroundFetcher.ts`:

```typescript
const TRACKED_ITEMS = [
  1, 2, 3, 4, 5, // Add profitable item IDs here
];
```

## Usage

The background fetcher starts automatically when the server starts:

```typescript
import { startScheduler } from './services/backgroundFetcher';

// After database connection
startScheduler();
```

## API Integration

The `/profit` endpoint now reads from MongoDB instead of making API calls:

```typescript
GET /api/profit
```

Returns grouped profit data by country with stock information merged from the database.

## Error Handling

- Automatic retry with exponential backoff for rate-limited requests
- Comprehensive error logging using Winston logger
- Graceful handling of missing or empty API responses
- Database operations use bulk writes for better performance

## Development Notes

- The scheduler runs 24/7 in production
- Initial item fetch happens on startup if data is older than 24 hours
- All timestamps use ISO 8601 format
- Bulk operations minimize database round trips
