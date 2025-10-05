# Stock Holdings Tracking and P/L Implementation Summary

## Overview
This implementation enhances the stock-market system to track user stock holdings and display unrealized profit/loss on the recommendations page.

## Changes Made

### Part 1: Backend - Data Model and Storage

#### 1. New Model: `UserStockHoldingSnapshot`
**File:** `API/src/models/UserStockHoldingSnapshot.ts`

New model to store timestamped snapshots of user stock holdings:
```typescript
{
  stock_id: number;           // Torn stock ID
  total_shares: number;       // Total shares owned
  avg_buy_price: number | null; // Weighted average buy price
  transaction_count: number;  // Number of transactions
  timestamp: Date;            // When the snapshot was taken
}
```

**Indexes:**
- Compound index: `{ stock_id: 1, timestamp: -1 }` for efficient querying
- TTL index: `{ timestamp: 1 }` with 14-day expiration (same as stock prices)

#### 2. Holdings Fetch Function
**File:** `API/src/services/backgroundFetcher.ts`

Added `fetchUserStockHoldings()` function that:
- Fetches user stocks from Torn v2 API: `GET https://api.torn.com/v2/user?selections=stocks&key=API_KEY`
- Calculates weighted average buy price for each stock:
  ```
  avg_buy_price = sum(shares_i * bought_price_i) / total_shares
  ```
- Inserts snapshot records into `UserStockHoldingSnapshot` collection
- Handles errors gracefully (logs warning, continues execution)

**Integration:**
- Called automatically after `fetchStockPrices()` completes
- Runs every 30 minutes (same schedule as stock price fetching)
- No new cron job created - uses existing scheduler

### Part 2: Backend - API Enhancements

#### 3. Updated Recommendations Endpoint
**File:** `API/src/routes/stocks.ts`

Enhanced `/api/stocks/recommendations` endpoint to:
1. Fetch most recent holdings snapshot for each stock (using aggregation)
2. Calculate unrealized P/L for owned stocks:
   ```typescript
   profit_value = (current_price - avg_buy_price) * total_shares
   profit_pct = ((current_price / avg_buy_price) - 1) * 100
   ```
3. Include new fields in response:
   - `avg_buy_price`: Weighted average purchase price
   - `unrealized_profit_value`: Dollar amount of profit/loss
   - `unrealized_profit_pct`: Percentage profit/loss
4. Set P/L fields to `null` for stocks not currently owned

**Example API Response:**
```json
{
  "stock_id": 25,
  "ticker": "FHG",
  "name": "Feathery Hotels Group",
  "price": 119.12,
  "change_7d": -0.09,
  "volatility": 4.04,
  "score": 0.02,
  "recommendation": "HOLD",
  "owned_shares": 1061192,
  "avg_buy_price": 103.44,
  "unrealized_profit_value": 16696000.00,
  "unrealized_profit_pct": 15.10,
  "can_sell": true
}
```

### Part 3: Frontend - UI Updates

#### 4. Updated TypeScript Types
**File:** `Client/src/lib/types/stockRecommendations.ts`

Added new optional fields to `StockRecommendation` interface:
```typescript
avg_buy_price: number | null;
unrealized_profit_value: number | null;
unrealized_profit_pct: number | null;
```

#### 5. Enhanced Recommendations Page
**File:** `Client/src/app/pages/Recommendations.tsx`

Updates to display P/L information:
1. Added two new sortable columns:
   - **Profit $**: Unrealized profit/loss in dollars
   - **Profit %**: Unrealized profit/loss as percentage
2. Color-coded P/L values:
   - Green (#4caf50) for positive P/L
   - Red (#f44336) for negative P/L
3. Bold formatting for non-null P/L values
4. Shows "-" for stocks not owned
5. Adjusted column widths to accommodate new fields

### Part 4: Testing

#### 6. Model Tests
**File:** `API/tests/models.test.ts`

Added comprehensive tests for `UserStockHoldingSnapshot`:
- Model creation with valid data
- Null `avg_buy_price` handling
- Compound index verification

## Key Features

✅ **No New Scheduler**: Holdings fetch integrated into existing 30-minute stock job
✅ **Graceful Error Handling**: Torn API failures logged but don't break the job
✅ **Backward Compatible**: New fields are optional (null for non-owned stocks)
✅ **Efficient Queries**: Uses MongoDB aggregation for optimal performance
✅ **TTL Management**: Holdings automatically deleted after 14 days (matches stock prices)
✅ **Weighted Average**: Accurately calculates buy price across multiple transactions

## Data Flow

```
Every 30 minutes:
1. fetchStockPrices() runs
   ├─> Fetches market prices from Torn API
   ├─> Saves to StockPriceSnapshot collection
   └─> Calls fetchUserStockHoldings()
       ├─> Fetches user's stock holdings from Torn API
       ├─> Calculates weighted avg buy price for each stock
       └─> Saves to UserStockHoldingSnapshot collection

When user visits /stocks/recommendations:
1. API queries most recent holdings snapshots
2. Joins with stock price data
3. Calculates unrealized P/L for each owned stock
4. Returns enriched recommendations
5. Frontend displays P/L columns with color coding
```

## Database Footprint

- New collection: `UserStockHoldingSnapshot`
- Average document size: ~100 bytes
- Documents per run: ~32 (one per stock the user owns)
- TTL: 14 days (matches `StockPriceSnapshot`)
- Total storage: ~32 stocks × 48 runs/day × 14 days × 100 bytes ≈ 2.1 MB

## Logging

The implementation provides detailed logging:
- `Fetching user stock holdings...` - Start of holdings fetch
- `Successfully saved N user stock holding snapshots to database` - Success message
- `No stocks data returned from Torn API - user may not own any stocks` - No holdings
- `Error fetching user stock holdings` - Error occurred (with details)

## Notes

1. **Holdings vs. Real-Time**: Holdings are updated every 30 minutes, not real-time
2. **Multiple Transactions**: Weighted average correctly handles stocks bought at different prices
3. **Zero Shares**: Stocks with 0 shares still create snapshots (for historical tracking)
4. **API Rate Limiting**: Uses existing Bottleneck rate limiter (60 req/min)
5. **Frontend Responsiveness**: Grid layout adjusts for different screen sizes
