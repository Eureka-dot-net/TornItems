# FIFO Stock Lot Tracking - Implementation Guide

## Overview

The stock profit tracking system now implements **FIFO (First In, First Out)** lot tracking to accurately match sell transactions with their corresponding buy transactions. This provides precise profit/loss calculations and bot performance analysis.

## Architecture

### Two-Model System

#### 1. StockHoldingLot (Open Positions)
Tracks each individual buy transaction as a separate lot:

```typescript
{
  stock_id: 22,
  ticker: "HRG",
  name: "Helayne Robertson Group",
  shares_total: 10000,        // Total shares bought in this lot
  shares_remaining: 10000,    // Decreases as we sell
  bought_price: 590.00,       // Price paid for this lot
  score_at_buy: 5.23,         // Bot score when bought
  recommendation_at_buy: "STRONG_BUY",
  timestamp: Date,
  fully_sold: false           // True when shares_remaining = 0
}
```

**Key Points:**
- Each buy creates a NEW lot (never merged)
- Lots persist until fully sold
- Indexed on `{ stock_id, timestamp }` for FIFO ordering

#### 2. StockTransactionHistory (Completed Sells)
Records each sell transaction with link to original buy:

```typescript
{
  stock_id: 22,
  ticker: "HRG", 
  name: "Helayne Robertson Group",
  action: "SELL",             // Always SELL
  shares_sold: 10000,
  sell_price: 604.12,         // Market price at sell time
  bought_price: 590.00,       // From the matched lot
  profit_per_share: 14.12,
  total_profit: 141200,
  timestamp: Date,
  
  // Context from buy lot
  score_at_buy: 5.23,
  recommendation_at_buy: "STRONG_BUY",
  
  // Context at sell time
  score_at_sale: 6.27,
  recommendation_at_sale: "STRONG_BUY",
  
  // Reference to original buy
  linked_buy_id: ObjectId
}
```

**Key Points:**
- Only SELL transactions (no BUY records)
- Each sell links to the buy lot via `linked_buy_id`
- Contains both buy-time and sell-time bot recommendations

## FIFO Matching Algorithm

### Process Flow

Every minute, the background job:

1. **Fetches current holdings** from Torn API
2. **Compares with previous snapshot** to detect changes
3. **Detects BUY or SELL** based on share count delta

### On BUY (shares increase)

```typescript
if (totalShares > previousShares) {
  const sharesBought = totalShares - previousShares;
  
  // Create new lot
  await StockHoldingLot.create({
    shares_total: sharesBought,
    shares_remaining: sharesBought,
    bought_price: avgBuyPrice,
    score_at_buy: currentScore,
    recommendation_at_buy: currentRecommendation,
    ...
  });
}
```

### On SELL (shares decrease)

```typescript
if (totalShares < previousShares) {
  const sharesSold = previousShares - totalShares;
  
  // Load all open lots, oldest first (FIFO)
  const openLots = await StockHoldingLot.find({
    stock_id,
    fully_sold: false,
    shares_remaining: { $gt: 0 }
  }).sort({ timestamp: 1 });  // Oldest first!
  
  let remainingSharesToSell = sharesSold;
  
  for (const lot of openLots) {
    if (remainingSharesToSell <= 0) break;
    
    const sharesToTake = Math.min(lot.shares_remaining, remainingSharesToSell);
    
    // Create transaction record
    await StockTransactionHistory.create({
      shares_sold: sharesToTake,
      sell_price: currentMarketPrice,
      bought_price: lot.bought_price,
      profit_per_share: currentMarketPrice - lot.bought_price,
      total_profit: (currentMarketPrice - lot.bought_price) * sharesToTake,
      score_at_buy: lot.score_at_buy,
      recommendation_at_buy: lot.recommendation_at_buy,
      score_at_sale: currentScore,
      recommendation_at_sale: currentRecommendation,
      linked_buy_id: lot._id,
      ...
    });
    
    // Update lot
    lot.shares_remaining -= sharesToTake;
    if (lot.shares_remaining === 0) {
      lot.fully_sold = true;
    }
    await lot.save();
    
    remainingSharesToSell -= sharesToTake;
  }
}
```

## Example Scenarios

### Scenario 1: Simple Buy and Sell

**Step 1: User buys 10,000 shares at $590**
```
StockHoldingLot:
  shares_total: 10000
  shares_remaining: 10000
  bought_price: 590
  score_at_buy: 5.23
  recommendation_at_buy: "STRONG_BUY"
```

**Step 2: User sells all 10,000 shares at $604.12**
```
StockTransactionHistory:
  shares_sold: 10000
  sell_price: 604.12
  bought_price: 590         ← from lot
  profit_per_share: 14.12
  total_profit: 141200
  score_at_buy: 5.23        ← from lot
  recommendation_at_buy: "STRONG_BUY"  ← from lot
  score_at_sale: 6.27       ← current
  recommendation_at_sale: "STRONG_BUY" ← current

StockHoldingLot (updated):
  shares_remaining: 0
  fully_sold: true
```

### Scenario 2: Partial Sell

**Step 1: User buys 10,000 shares at $590**
```
Lot #1:
  shares_remaining: 10000
  bought_price: 590
```

**Step 2: User sells 6,000 shares at $604**
```
Transaction #1:
  shares_sold: 6000
  bought_price: 590
  total_profit: (604 - 590) * 6000 = 84000

Lot #1 (updated):
  shares_remaining: 4000  ← was 10000
  fully_sold: false
```

**Step 3: User sells remaining 4,000 shares at $610**
```
Transaction #2:
  shares_sold: 4000
  bought_price: 590  ← still from same lot
  total_profit: (610 - 590) * 4000 = 80000

Lot #1 (updated):
  shares_remaining: 0
  fully_sold: true
```

### Scenario 3: Multiple Buy Lots (FIFO)

**Step 1: User buys 10,000 shares at $590**
```
Lot #1:
  shares_remaining: 10000
  bought_price: 590
  timestamp: 2025-01-01 10:00
```

**Step 2: User buys 5,000 more shares at $600**
```
Lot #1: (unchanged)
  shares_remaining: 10000
  bought_price: 590

Lot #2: (new)
  shares_remaining: 5000
  bought_price: 600
  timestamp: 2025-01-02 14:00
```

**Step 3: User sells 12,000 shares at $610**

FIFO processing:
```
// First lot (oldest) - fully depleted
Transaction #1:
  shares_sold: 10000  ← entire first lot
  bought_price: 590
  total_profit: (610 - 590) * 10000 = 200000
  linked_buy_id: Lot#1._id

Lot #1:
  shares_remaining: 0
  fully_sold: true

// Second lot (newer) - partially depleted  
Transaction #2:
  shares_sold: 2000  ← partial from second lot
  bought_price: 600  ← different price!
  total_profit: (610 - 600) * 2000 = 20000
  linked_buy_id: Lot#2._id

Lot #2:
  shares_remaining: 3000  ← was 5000
  fully_sold: false
```

**Total Realized Profit: $220,000** (from two separate transaction records)

## API Response

### GET /api/stocks/profit

Returns all SELL transaction records, newest first:

```json
[
  {
    "_id": "...",
    "stock_id": 22,
    "ticker": "HRG",
    "name": "Helayne Robertson Group",
    "timestamp": "2025-01-05T14:00:00Z",
    "action": "SELL",
    "shares_sold": 2000,
    "sell_price": 610,
    "bought_price": 600,
    "profit_per_share": 10,
    "total_profit": 20000,
    "score_at_buy": 4.8,
    "recommendation_at_buy": "STRONG_BUY",
    "score_at_sale": 3.2,
    "recommendation_at_sale": "BUY",
    "linked_buy_id": "..."
  },
  {
    "_id": "...",
    "stock_id": 22,
    "ticker": "HRG",
    "timestamp": "2025-01-05T14:00:00Z",
    "action": "SELL",
    "shares_sold": 10000,
    "sell_price": 610,
    "bought_price": 590,
    "profit_per_share": 20,
    "total_profit": 200000,
    "score_at_buy": 5.23,
    "recommendation_at_buy": "STRONG_BUY",
    "score_at_sale": 3.2,
    "recommendation_at_sale": "BUY",
    "linked_buy_id": "..."
  }
]
```

## Frontend Display

The `/stockProfit` page shows:

| Date | Ticker | Shares | Buy $ | Sell $ | Profit | Buy Score (Rec) | Sell Score (Rec) |
|------|--------|--------|-------|--------|--------|-----------------|------------------|
| 01/05 14:00 | HRG | 2,000 | $600.00 | $610.00 | +$20,000 | 4.80 (STRONG_BUY) | 3.20 (BUY) |
| 01/05 14:00 | HRG | 10,000 | $590.00 | $610.00 | +$200,000 | 5.23 (STRONG_BUY) | 3.20 (BUY) |

**Total Realized Profit: +$220,000**

## Bot Performance Analysis

The dual recommendation tracking enables you to evaluate:

1. **Was the buy recommendation correct?**
   - If you bought when bot said "STRONG_BUY" and made profit → Good signal
   - If you bought when bot said "SELL" and made profit → Contrarian success

2. **Was the sell timing good?**
   - If you sold when bot said "SELL" → Following signal
   - If you sold when bot said "STRONG_BUY" → Early exit (might have gained more)

3. **Recommendation consistency**
   - Both buy and sell were "STRONG_BUY" → Stock remained strong
   - Buy was "SELL", Sell was "BUY" → Complete reversal

## Benefits

✅ **Accurate P/L**: Each sell matched to actual buy price(s)
✅ **FIFO Compliance**: Matches accounting standards
✅ **Audit Trail**: Every sell links to original buy lot
✅ **Bot Performance**: Track recommendations at both ends
✅ **Multiple Batches**: Handles partial buys/sells correctly
✅ **Historical Analysis**: Complete transaction history preserved

## Technical Notes

### Performance
- Indexed queries on `{ stock_id, timestamp }` ensure fast FIFO retrieval
- Bulk operations used where possible
- Lots marked `fully_sold` for efficient filtering

### Edge Cases Handled
- Multiple sells from same lot
- Sells spanning multiple lots
- Complete position exit (stock no longer in API response)
- Zero-share snapshots created when position fully closed

### Monitoring
Check logs for FIFO matching:
```
Detected BUY for stock 22 (HRG): 10000 shares at $590
Matched SELL of 6000 shares from lot 507f1f77bcf86cd799439011 (bought at $590, sold at $604, profit: $84000)
```

## Migration from Previous System

The new structure is **incompatible** with the old BUY/SELL combined format.

**Recommendation**: Clear existing `StockTransactionHistory` collection before deploying:
```javascript
db.stocktransactionhistories.deleteMany({});
```

Or write a migration script to:
1. Create `StockHoldingLot` records from old BUY transactions
2. Re-link SELL transactions to created lots
3. Update field names (`time` → `timestamp`, etc.)

## Future Enhancements

Potential additions:
- Average cost basis calculation across all lots
- Tax reporting (realized gains by date)
- Lot selection strategies (FIFO, LIFO, specific identification)
- Performance metrics by recommendation type
- Win rate analysis
