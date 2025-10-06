# Stock Profit/Loss Tracking Implementation

## Overview
This document describes the implementation of realized profit/loss tracking for stocks in the Torn portfolio. The system automatically detects when users buy or sell stocks and records detailed transaction history including profit/loss calculations and bot recommendations.

## Backend Implementation

### 1. New Model: `StockTransactionHistory`
**File:** `API/src/models/StockTransactionHistory.ts`

A new Mongoose model that stores detailed transaction records with the following fields:
- `stock_id`: Numeric identifier for the stock
- `ticker`: Stock ticker symbol (e.g., "HRG", "PRN")
- `name`: Full stock name
- `time`: Timestamp when the transaction was detected
- `action`: Either "BUY" or "SELL"
- `shares`: Number of shares involved in the transaction
- `price`: Current market price at time of transaction
- `previous_shares`: Share count before transaction
- `new_shares`: Share count after transaction
- `bought_price`: Average buy price from user's holdings
- `profit_per_share`: Calculated profit per share (for SELL only)
- `total_profit`: Total profit/loss from the transaction (for SELL only)
- `score_at_buy`: Bot's buy score at time of purchase
- `score_at_sale`: Bot's buy score at time of sale
- `recommendation_at_buy`: Bot's recommendation at purchase (e.g., "STRONG_BUY")
- `recommendation_at_sale`: Bot's recommendation at sale
- `trend_7d_pct`: 7-day price trend percentage at transaction time
- `volatility_7d_pct`: 7-day volatility percentage at transaction time

**Indexes:**
- Compound index on `{ stock_id: 1, time: -1 }` for efficient stock-specific queries
- Index on `{ time: -1 }` for sorting by most recent transactions

### 2. Updated Stock Monitoring Job
**File:** `API/src/services/backgroundFetcher.ts`

#### Schedule Change
Changed from every 10 minutes to **every 1 minute** for real-time transaction tracking:
```typescript
cron.schedule('* * * * *', () => {
  logInfo('Running scheduled stock price fetch...');
  fetchStockPrices();
});
```

#### Transaction Detection Logic
The `fetchUserStockHoldings()` function now:

1. **Fetches current holdings** from Torn API
2. **Retrieves previous holdings** from database to detect changes
3. **Compares share counts** for each stock
4. **Detects BUY transactions** when share count increases
5. **Detects SELL transactions** when share count decreases
6. **Calculates profit/loss** for SELL transactions:
   ```typescript
   profit_per_share = current_price - avg_buy_price
   total_profit = profit_per_share * shares_sold
   ```
7. **Fetches current stock info** including price, score, and recommendation
8. **Creates transaction records** with all relevant data
9. **Saves new holdings snapshot** for next comparison

#### Helper Function: `getStockInfoAndScores()`
Retrieves comprehensive stock information including:
- Current market price
- 7-day price trend
- Volatility calculation
- Buy/sell scores
- Bot recommendation

### 3. New API Endpoint
**Route:** `GET /api/stocks/profit`  
**File:** `API/src/routes/stocks.ts`

Returns all transaction records sorted by time (newest first).

**Example Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "stock_id": 22,
    "ticker": "HRG",
    "name": "Helayne Robertson Group",
    "time": "2025-01-06T11:10:00.000Z",
    "action": "SELL",
    "shares": 20000,
    "price": 604.12,
    "previous_shares": 20000,
    "new_shares": 0,
    "bought_price": 590.00,
    "profit_per_share": 14.12,
    "total_profit": 282400,
    "score_at_buy": null,
    "score_at_sale": 6.27,
    "recommendation_at_buy": null,
    "recommendation_at_sale": "STRONG_BUY",
    "trend_7d_pct": -18.3,
    "volatility_7d_pct": 2.9
  },
  {
    "_id": "507f1f77bcf86cd799439012",
    "stock_id": 18,
    "ticker": "PRN",
    "name": "Printing Paperwork News",
    "time": "2025-01-05T14:33:00.000Z",
    "action": "BUY",
    "shares": 15000,
    "price": 601.10,
    "previous_shares": 0,
    "new_shares": 15000,
    "bought_price": 601.10,
    "profit_per_share": null,
    "total_profit": null,
    "score_at_buy": 4.82,
    "score_at_sale": null,
    "recommendation_at_buy": "STRONG_BUY",
    "recommendation_at_sale": null,
    "trend_7d_pct": -12.1,
    "volatility_7d_pct": 2.5
  }
]
```

## Frontend Implementation (React)

### 1. New Type Definition
**File:** `Client/src/lib/types/stockTransactions.ts`

TypeScript interface for stock transactions matching the backend model.

### 2. Custom Hook
**File:** `Client/src/lib/hooks/useStockTransactions.ts`

React Query hook to fetch transaction data:
- Caches data for 1 minute
- Auto-refetches on window focus
- Provides loading and error states

### 3. New Page Component
**Route:** `/stockProfit`  
**File:** `Client/src/app/pages/StockProfit.tsx`

Displays transaction history in a table format with:
- **Date/Time**: When the transaction occurred
- **Ticker**: Stock symbol
- **Action**: BUY (green chip) or SELL (red chip)
- **Shares**: Number of shares traded
- **Price**: Market price at transaction time
- **Profit**: Calculated profit/loss (color-coded: green for profit, red for loss)
- **Buy Score**: Bot's score at purchase
- **Buy Recommendation**: Bot's recommendation at purchase
- **Sale Score**: Bot's score at sale
- **Sale Recommendation**: Bot's recommendation at sale

**Features:**
- Sorted by newest transactions first
- Running total of all realized profits/losses
- Color-coded profit values
- Currency formatting using `formatCurrency()` helper
- Responsive grid layout
- Empty state handling ("No transactions yet")
- Scrollable table for large datasets

### 4. Router Configuration
**File:** `Client/src/app/router/routes.tsx`

Added route: `{ path: "/stockProfit", element: <StockProfit /> }`

## Testing

### Backend Tests
**File:** `API/tests/models.test.ts`
- Model creation tests for BUY and SELL transactions
- Index verification tests
- Null value handling tests

**File:** `API/tests/stockProfit.test.ts`
- Empty state handling
- Transaction sorting by time
- Complete field validation
- Multiple transaction handling

### Integration Testing
The API endpoint can be tested with:
```bash
curl http://localhost:3000/api/stocks/profit
```

## How It Works

### Transaction Flow
1. **Every minute**, the stock monitoring job runs
2. **Fetches** current holdings from Torn API
3. **Compares** with previous snapshot in database
4. **Detects** any changes in share counts
5. **Determines** if action was BUY or SELL
6. **Fetches** current market price and bot scores
7. **Calculates** profit/loss for SELL transactions
8. **Stores** transaction record in database
9. **Updates** holdings snapshot for next comparison

### Profit Calculation
For SELL transactions:
```typescript
// Get the average buy price from user's holdings
bought_price = holding.avg_buy_price

// Calculate per-share profit
profit_per_share = current_market_price - bought_price

// Calculate total profit
total_profit = profit_per_share * shares_sold
```

### Score and Recommendation Tracking
For each transaction:
- BUY: Records `score_at_buy` and `recommendation_at_buy`
- SELL: Records `score_at_sale` and `recommendation_at_sale`

This allows users to evaluate the bot's performance by comparing:
- What the bot recommended when they bought
- What the bot recommends when they sell
- The actual profit/loss achieved

## Environment Variables
No new environment variables required. Uses existing:
- `TORN_API_KEY`: For accessing Torn API

## Performance Considerations

### API Rate Limiting
- Stock price fetching runs every minute (60 times per hour)
- Each run makes 2 API calls maximum:
  1. Torn stocks data (for all stock prices)
  2. User holdings data
- Uses existing rate limiter (60 requests/minute by default)
- Transaction detection is done locally (no additional API calls)

### Database Performance
- Compound indexes optimize queries by stock_id and time
- TTL index on UserStockHoldingSnapshot (14 days) prevents bloat
- Transaction records have no TTL (permanent history)
- Efficient aggregation queries for previous holdings

## Future Enhancements
Potential additions for future phases:
- Filters by date range
- Filter by ticker symbol
- Filter by profit/loss (only show profitable trades)
- Export to CSV
- Summary statistics (total trades, win rate, average profit)
- Per-stock profit summaries
- Performance charts/graphs

## Files Modified/Created

### Backend
- ✅ `API/src/models/StockTransactionHistory.ts` (NEW)
- ✅ `API/src/services/backgroundFetcher.ts` (MODIFIED)
- ✅ `API/src/routes/stocks.ts` (MODIFIED)
- ✅ `API/tests/models.test.ts` (MODIFIED)
- ✅ `API/tests/stockProfit.test.ts` (NEW)

### Frontend
- ✅ `Client/src/lib/types/stockTransactions.ts` (NEW)
- ✅ `Client/src/lib/hooks/useStockTransactions.ts` (NEW)
- ✅ `Client/src/app/pages/StockProfit.tsx` (NEW)
- ✅ `Client/src/app/router/routes.tsx` (MODIFIED)

## Acceptance Criteria
- ✅ Stock holdings are checked every 1 minute
- ✅ Any change in share count creates a historical transaction record
- ✅ Each record includes Torn market price and bot's score/recommendation at that moment
- ✅ API endpoint `/api/stocks/profit` exposes all records
- ✅ New React page `/stockProfit` displays the data in a readable table
- ✅ Profit/loss calculations for SELL transactions
- ✅ Color-coded profit display (green for gains, red for losses)
- ✅ Running total of realized profits
- ✅ Sorts transactions by newest first
- ✅ Graceful empty state handling

## Known Limitations
- Transaction detection only works when the monitoring job is running
- If the server is offline during a trade, that transaction won't be recorded
- Partial sells are detected but historical buy scores are not retroactively stored
- Requires at least 7 days of price history for score/recommendation calculation
