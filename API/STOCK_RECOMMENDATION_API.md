# Stock Recommendation API Documentation

## Endpoints

### 1. Get All Stock Recommendations

**Endpoint:** `GET /api/stocks/recommendations`

**Description:** Returns a list of all stocks with buy/sell recommendations, including benefit preservation information.

**Response:**
```json
[
  {
    "stock_id": 30,
    "ticker": "WLT",
    "name": "Wind Lines Travel",
    "price": 775.38,
    "change_7d_pct": 0.70,
    "volatility_7d_pct": 2.15,
    "score": -0.33,
    "sell_score": 0.33,
    "recommendation": "SELL",
    "owned_shares": 9100000,
    "avg_buy_price": 750.00,
    "unrealized_profit_value": 230950000,
    "unrealized_profit_pct": 3.38,
    "can_sell": true,
    "max_shares_to_sell": 100000
  },
  {
    "stock_id": 5,
    "ticker": "TSB",
    "name": "Torn & Shanghai Banking",
    "price": 10500.00,
    "change_7d_pct": -2.50,
    "volatility_7d_pct": 1.80,
    "score": 1.39,
    "sell_score": -1.39,
    "recommendation": "BUY",
    "owned_shares": 500000,
    "avg_buy_price": 10000.00,
    "unrealized_profit_value": 250000000,
    "unrealized_profit_pct": 5.00,
    "can_sell": true,
    "max_shares_to_sell": 500000
  }
]
```

**New Fields:**
- `can_sell`: Boolean indicating if you can sell this stock without losing benefits
- `max_shares_to_sell`: Maximum number of shares you can sell while preserving benefits

**Sorting:** Results are sorted by `score` descending (best buys first)

---

### 2. Get Top Stock to Sell

**Endpoint:** `GET /api/stocks/recommendations/top-sell`

**Description:** Returns the single best stock to sell based on sell_score, with benefit preservation applied.

**Response:**
```json
{
  "stock_id": 30,
  "ticker": "WLT",
  "name": "Wind Lines Travel",
  "price": 775.38,
  "change_7d_pct": 0.70,
  "volatility_7d_pct": 2.15,
  "score": -0.33,
  "sell_score": 0.33,
  "recommendation": "SELL",
  "owned_shares": 9100000,
  "avg_buy_price": 750.00,
  "unrealized_profit_value": 230950000,
  "unrealized_profit_pct": 3.38,
  "can_sell": true,
  "max_shares_to_sell": 100000
}
```

**Selection Logic:**
1. Only considers stocks you own
2. Filters out stocks where `can_sell` is false (would lose benefits)
3. Selects stock with highest `sell_score` (best to sell)

**Error Responses:**
- `404` - No stocks owned or all stocks are unsellable
- `503` - Stock price data not available

---

## Benefit Preservation Logic

The API now automatically protects stock benefits by calculating how many shares can be sold safely.

### How It Works

**If a stock has a benefit requirement:**
- WLT (Wind Lines Travel) requires 9,000,000 shares for "Private jet access"

**Scenarios:**

1. **You own more than the requirement** (e.g., 9,100,000 shares)
   - `can_sell`: `true`
   - `max_shares_to_sell`: `100,000` (amount above requirement)
   - You can sell up to 100k shares and keep your benefit

2. **You own exactly the requirement** (e.g., 9,000,000 shares)
   - `can_sell`: `false`
   - `max_shares_to_sell`: `0`
   - Cannot sell any shares without losing benefit

3. **You own less than the requirement** (e.g., 5,000,000 shares)
   - `can_sell`: `true`
   - `max_shares_to_sell`: `5,000,000` (all shares)
   - You don't have the benefit yet, so can sell freely

4. **Stock has no benefit requirement**
   - `can_sell`: `true` (if you own shares)
   - `max_shares_to_sell`: equals `owned_shares`
   - Can sell all shares

---

## Usage Examples

### Example 1: Finding Best Stock to Buy
```javascript
// Get all recommendations
const response = await fetch('/api/stocks/recommendations');
const stocks = await response.json();

// Filter to buy recommendations
const buyStocks = stocks.filter(s => 
  s.recommendation === 'STRONG_BUY' || s.recommendation === 'BUY'
);

// Top buy is first in the list (already sorted by score)
const topBuy = buyStocks[0];
console.log(`Best stock to buy: ${topBuy.ticker} at $${topBuy.price}`);
```

### Example 2: Finding Best Stock to Sell
```javascript
// Get top stock to sell
const response = await fetch('/api/stocks/recommendations/top-sell');
const topSell = await response.json();

console.log(`Sell ${topSell.ticker}:`);
console.log(`  You own: ${topSell.owned_shares.toLocaleString()} shares`);
console.log(`  Can sell: ${topSell.max_shares_to_sell.toLocaleString()} shares`);
console.log(`  Current price: $${topSell.price}`);
```

### Example 3: Checking Which Stocks Can Be Sold
```javascript
// Get all recommendations
const response = await fetch('/api/stocks/recommendations');
const stocks = await response.json();

// Filter to owned stocks that can be sold
const sellableStocks = stocks.filter(s => s.can_sell && s.owned_shares > 0);

console.log('Stocks you can sell:');
sellableStocks.forEach(stock => {
  console.log(`  ${stock.ticker}: ${stock.max_shares_to_sell.toLocaleString()} shares`);
  if (stock.max_shares_to_sell < stock.owned_shares) {
    console.log(`    (Keeping ${stock.owned_shares - stock.max_shares_to_sell} for benefit)`);
  }
});
```

### Example 4: Warning When Benefit Would Be Lost
```javascript
// Get all recommendations
const response = await fetch('/api/stocks/recommendations');
const stocks = await response.json();

// Find stocks where you have benefits locked
const lockedStocks = stocks.filter(s => 
  s.owned_shares > 0 && !s.can_sell
);

if (lockedStocks.length > 0) {
  console.log('⚠️ Warning: These stocks cannot be sold without losing benefits:');
  lockedStocks.forEach(stock => {
    console.log(`  ${stock.ticker}: ${stock.owned_shares.toLocaleString()} shares (at threshold)`);
  });
}
```

---

## Field Definitions

| Field | Type | Description |
|-------|------|-------------|
| `stock_id` | number | Torn.com stock ID |
| `ticker` | string | Stock ticker symbol (e.g., "WLT") |
| `name` | string | Full stock name |
| `price` | number | Current stock price |
| `change_7d_pct` | number\|null | 7-day price change percentage |
| `volatility_7d_pct` | number | 7-day volatility percentage |
| `score` | number\|null | Buy recommendation score (higher = better buy) |
| `sell_score` | number\|null | Sell recommendation score (higher = better sell) |
| `recommendation` | string | `STRONG_BUY`, `BUY`, `HOLD`, `SELL`, or `STRONG_SELL` |
| `owned_shares` | number | Number of shares you own |
| `avg_buy_price` | number\|null | Your average purchase price |
| `unrealized_profit_value` | number\|null | Total unrealized profit/loss in dollars |
| `unrealized_profit_pct` | number\|null | Unrealized profit/loss percentage |
| `can_sell` | boolean | Whether you can sell without losing benefits |
| `max_shares_to_sell` | number | Maximum shares you can sell safely |

---

## Notes

- The benefit preservation logic matches the Discord bot implementation
- Stock prices are updated every 30 minutes by the background fetcher
- Recommendations are based on 7-day price trends and volatility
- All monetary values are in Torn.com currency
