# Stock Market and Shop Item History Implementation

## Overview
This implementation adds comprehensive history tracking for the stock market and shop item stock levels, along with a 5% sales tax applied to all profit calculations.

## Changes Summary

### 1. New Models

#### StockMarketHistory Model
**File:** `API/src/models/StockMarketHistory.ts`

Stores daily aggregated stock market data with the following fields:
- `ticker`: Stock ticker symbol (e.g., 'FHG', 'SYS')
- `name`: Stock name
- `date`: Date in YYYY-MM-DD format
- `opening_price`: First price of the day
- `closing_price`: Last price of the day
- `lowest_price`: Lowest price during the day
- `highest_price`: Highest price during the day
- `daily_volatility`: Percentage difference between high and low

**Indexes:**
- Compound unique index: `{ ticker: 1, date: 1 }`
- Individual index: `{ date: 1 }` for efficient cleanup queries

#### ShopItemStockHistory Model
**File:** `API/src/models/ShopItemStockHistory.ts`

Stores daily aggregated shop item stock metrics:
- `shopId`: Shop identifier
- `shopName`: Shop name
- `itemId`: Item identifier
- `itemName`: Item name
- `date`: Date in YYYY-MM-DD format
- `average_sellout_duration_minutes`: Average time items stay in stock
- `cycles_skipped`: Average number of restock cycles skipped

**Indexes:**
- Compound unique index: `{ shopId: 1, itemId: 1, date: 1 }`
- Individual index: `{ date: 1 }` for efficient cleanup queries

### 2. Updated Batch Job

#### aggregateMarketHistory Job
**File:** `API/src/jobs/aggregateMarketHistory.ts`

Enhanced with three new functions:

##### aggregateStockMarketHistory()
- Processes all unique stock tickers
- Calculates daily metrics for each day where data exists but history doesn't
- Stores opening, closing, lowest, highest prices
- Calculates daily volatility as `((high - low) / low) * 100`
- Prevents duplicate processing by checking existing history
- Bulk upserts data for efficiency

##### aggregateShopItemStockHistory()
- Collects all shop items with tracking data
- Records average sellout duration and cycles skipped
- Creates one record per shop item per day
- Prevents duplicates by checking existing history
- Bulk upserts data for efficiency

##### cleanupOldData()
Removes old transactional data to manage database size:
- **MarketSnapshot**: Deletes records older than 14 days
- **CityShopStockHistory**: Deletes records older than 48 hours
- **ForeignStockHistory**: Deletes records older than 48 hours

The main `aggregateMarketHistory()` function now calls these three new functions after completing the existing market history aggregation.

### 3. Sales Tax Implementation

#### 5% Sales Tax Applied to All Profit Calculations

**Rationale:** Sales tax is deducted from the sold price, reducing profit margins. This is especially impactful for expensive items.

**Formula:** `marketPriceAfterTax = marketPrice * (1 - 0.05)`

#### Updated in profit.ts Route
**File:** `API/src/routes/profit.ts`

Modified profit calculations:
1. `profitPer1 = (market * 0.95) - buy`
2. `estimated_market_value_profit = (market * 0.95) - buy`
3. `lowest_50_profit = (avgLowest50 * 0.95) - buy`
4. `sold_profit = (avgSoldPrice * 0.95) - buy`

#### Updated in aggregateMarketHistory Job
**File:** `API/src/jobs/aggregateMarketHistory.ts`

Same calculations applied to aggregated history data:
1. `avgProfitPer1 = (avgMarketPrice * 0.95) - avgBuyPrice`
2. `estimated_market_value_profit = (avgMarketPrice * 0.95) - avgBuyPrice`
3. `lowest_50_profit = (avgLowest50 * 0.95) - avgBuyPrice`
4. `sold_profit = (avgSoldPrice * 0.95) - avgBuyPrice`

### 4. Tests

#### New Test File
**File:** `API/tests/historyModels.test.ts`

Tests include:
- **StockMarketHistory Model Tests:**
  - Create stock market history record
  - Enforce unique constraint on ticker and date
  
- **ShopItemStockHistory Model Tests:**
  - Create shop item stock history record
  - Enforce unique constraint on shopId, itemId, and date

- **Sales Tax Calculation Tests:**
  - Verify 5% tax on profit calculation
  - Verify 5% tax on lowest_50_profit calculation
  - Verify 5% tax on sold_profit calculation

## Data Retention Policy

### Stock Market Data
- **StockPriceSnapshot** (transactional): Deleted after 14 days
- **StockMarketHistory** (aggregated): Retained indefinitely

### Shop Item Stock Data
- **CityShopStockHistory** (transactional): Deleted after 48 hours
- **ForeignStockHistory** (transactional): Deleted after 48 hours
- **ShopItemStockHistory** (aggregated): Retained indefinitely

### Market Data
- **MarketSnapshot** (transactional): Deleted after 14 days
- **MarketHistory** (aggregated): Retained indefinitely

## Scheduling

The aggregateMarketHistory job runs daily at midnight UTC (configurable via `HISTORY_AGGREGATION_CRON` environment variable).

Each run executes:
1. Market snapshot aggregation (existing)
2. Stock market history aggregation (new)
3. Shop item stock history aggregation (new)
4. Cleanup of old transactional data (new)

## Performance Considerations

### Efficiency Optimizations
1. **Bulk Operations**: All inserts use `bulkWrite()` for efficiency
2. **Duplicate Prevention**: Checks existing history before processing
3. **Indexed Queries**: All lookups use indexed fields
4. **Incremental Processing**: Only processes missing history entries

### Expected Impact
- **Stock Market History**: Processes ~32 stocks daily, creating ~32 records
- **Shop Item Stock History**: Processes items with tracking data, typically <1000 records
- **Cleanup**: Deletes old data to prevent database bloat

### Database Growth
- **Before**: Indefinite growth of transactional data
- **After**: Controlled growth with automatic cleanup and efficient aggregated summaries

## Example Usage

### Querying Stock Market History
```typescript
// Get 30-day price history for a stock
const history = await StockMarketHistory.find({ 
  ticker: 'FHG' 
})
.sort({ date: -1 })
.limit(30);

// Calculate average volatility
const avgVolatility = history.reduce((sum, h) => sum + h.daily_volatility, 0) / history.length;
```

### Querying Shop Item Stock History
```typescript
// Get item stock patterns
const itemHistory = await ShopItemStockHistory.find({
  shopId: 'shop1',
  itemId: '123'
})
.sort({ date: -1 })
.limit(7);

// Calculate trend
const avgSelloutTime = itemHistory.reduce((sum, h) => sum + h.average_sellout_duration_minutes, 0) / itemHistory.length;
```

## Migration Notes

No database migration is required. The new models will be created automatically when first accessed. Existing data is not modified.

The cleanup functions will only delete data on their first run and subsequently maintain the retention policy going forward.

## Monitoring

Check application logs for:
- Stock market history aggregation progress
- Shop item stock history aggregation progress
- Cleanup operation results
- Any errors during processing

Example log output:
```
=== Starting Stock Market History aggregation ===
Found 32 unique stocks to process
Upserting 45 stock market history records
=== Stock Market History aggregation completed ===

=== Starting Shop Item Stock History aggregation ===
Found 856 shop items with tracking data
Upserting 856 shop item stock history records
=== Shop Item Stock History aggregation completed ===

=== Starting cleanup of old transactional data ===
Deleted 1205 old MarketSnapshot records (>14 days)
Deleted 3421 old CityShopStockHistory records (>48 hours)
Deleted 892 old ForeignStockHistory records (>48 hours)
=== Cleanup of old transactional data completed ===
```
