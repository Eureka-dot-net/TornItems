# Stock Holdings Tracking - Weighted Average Calculation Example

## Example API Response from Torn

```json
{
  "stocks": {
    "25": {
      "stock_id": 25,
      "total_shares": 1061192,
      "transactions": {
        "22093305": { 
          "shares": 200000, 
          "bought_price": 103.42 
        },
        "22093718": { 
          "shares": 830564, 
          "bought_price": 103.46 
        },
        "22095123": { 
          "shares": 30628, 
          "bought_price": 103.38 
        }
      }
    }
  }
}
```

## Weighted Average Calculation

For stock_id 25 (FHG - Feathery Hotels Group):

**Step 1: Calculate weighted sum**
```
weighted_sum = (200000 × 103.42) + (830564 × 103.46) + (30628 × 103.38)
             = 20,684,000 + 85,922,534.44 + 3,166,718.64
             = 109,773,253.08
```

**Step 2: Divide by total shares**
```
avg_buy_price = 109,773,253.08 / 1,061,192
              = 103.44 (rounded to 2 decimal places)
```

## Unrealized P/L Calculation

Given current price of $119.12:

**Profit Value**
```
unrealized_profit_value = (current_price - avg_buy_price) × total_shares
                        = (119.12 - 103.44) × 1,061,192
                        = 15.68 × 1,061,192
                        = $16,639,491.56
```

**Profit Percentage**
```
unrealized_profit_pct = ((current_price / avg_buy_price) - 1) × 100
                      = ((119.12 / 103.44) - 1) × 100
                      = (1.1516 - 1) × 100
                      = 15.16%
```

## Frontend Display

The Recommendations page will show:

| Ticker | Name | Price | ... | Owned | Profit $ | Profit % |
|--------|------|-------|-----|-------|----------|----------|
| FHG | Feathery Hotels Group | $119.12 | ... | 1,061,192 | **<span style="color:green">$16,639,491.56</span>** | **<span style="color:green">+15.16%</span>** |

*(Values in green because profit is positive)*

## Edge Cases Handled

### Case 1: No Shares Owned
```json
{
  "owned_shares": 0,
  "avg_buy_price": null,
  "unrealized_profit_value": null,
  "unrealized_profit_pct": null
}
```

Display: Shows "-" for P/L fields

### Case 2: Stock in Loss
Current price $95.00, avg buy price $103.44:

```
unrealized_profit_value = (95.00 - 103.44) × 1,061,192 = -$8,956,460.48
unrealized_profit_pct = ((95.00 / 103.44) - 1) × 100 = -8.16%
```

Display: Values shown in red (negative)

### Case 3: Single Transaction
```json
{
  "transactions": {
    "22160770": { "shares": 13468, "bought_price": 1189.90 }
  }
}
```

Weighted average = 1189.90 (same as single transaction price)

## Database Storage

Each run (every 30 minutes) creates a snapshot:

```javascript
UserStockHoldingSnapshot.insertMany([
  {
    stock_id: 25,
    total_shares: 1061192,
    avg_buy_price: 103.44,
    transaction_count: 3,
    timestamp: new Date('2025-01-05T15:00:00Z')
  },
  {
    stock_id: 2,
    total_shares: 13468,
    avg_buy_price: 1189.90,
    transaction_count: 1,
    timestamp: new Date('2025-01-05T15:00:00Z')
  }
  // ... more stocks
]);
```

## Query for Latest Holdings

When serving the recommendations endpoint:

```javascript
// MongoDB Aggregation Pipeline
const holdingsSnapshots = await UserStockHoldingSnapshot.aggregate([
  {
    $sort: { stock_id: 1, timestamp: -1 }  // Latest first
  },
  {
    $group: {
      _id: '$stock_id',
      total_shares: { $first: '$total_shares' },      // Most recent
      avg_buy_price: { $first: '$avg_buy_price' },    // Most recent
      transaction_count: { $first: '$transaction_count' },
      timestamp: { $first: '$timestamp' }
    }
  }
]);
```

This efficiently gets the most recent snapshot for each stock in a single query.
