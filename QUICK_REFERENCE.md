# Stock Holdings Fix - Quick Reference

## What Was Fixed
Stock holdings not clearing when stocks are sold.

## Root Cause
Torn API doesn't return stocks you don't own → No snapshot created → Old non-zero snapshot remains.

## Solution
Detect previously owned stocks and create 0-share snapshots when they're no longer in the API response.

## Code Changes (90 lines in 1 file)

### Before
```typescript
async function fetchUserStockHoldings(): Promise<void> {
  const response = await api.get('/user?selections=stocks');
  const stocks = response.data?.stocks;
  
  if (!stocks) {
    return; // ❌ Early exit - no snapshots for sold stocks
  }
  
  const bulkOps = [];
  for (const [stockId, stockData] of Object.entries(stocks)) {
    bulkOps.push({ stock_id: stockId, total_shares: stockData.total_shares, ... });
  }
  
  await UserStockHoldingSnapshot.insertMany(bulkOps);
}
```

### After
```typescript
async function fetchUserStockHoldings(): Promise<void> {
  const response = await api.get('/user?selections=stocks');
  const stocks = response.data?.stocks;
  const bulkOps = [];
  const currentStockIds = new Set(); // ✅ Track current stocks
  
  if (stocks) {
    for (const [stockId, stockData] of Object.entries(stocks)) {
      currentStockIds.add(parseInt(stockId));
      bulkOps.push({ stock_id: stockId, total_shares: stockData.total_shares, ... });
    }
  }
  
  // ✅ Find previously owned stocks
  const previouslyOwned = await UserStockHoldingSnapshot.aggregate([
    { $match: { total_shares: { $gt: 0 } } },
    { $sort: { stock_id: 1, timestamp: -1 } },
    { $group: { _id: '$stock_id', total_shares: { $first: '$total_shares' } } }
  ]);
  
  // ✅ Create 0-share snapshots for sold stocks
  for (const prev of previouslyOwned) {
    if (!currentStockIds.has(prev._id)) {
      bulkOps.push({ stock_id: prev._id, total_shares: 0, avg_buy_price: null, ... });
    }
  }
  
  await UserStockHoldingSnapshot.insertMany(bulkOps);
}
```

## Impact

| Scenario | Before | After |
|----------|--------|-------|
| User owns Stock A | Shows 1000 shares ✅ | Shows 1000 shares ✅ |
| User sells Stock A | Shows 1000 shares ❌ | Shows 0 shares ✅ |
| User buys Stock A again | Shows new amount ✅ | Shows new amount ✅ |

## Files Modified
- `API/src/services/backgroundFetcher.ts` - Core fix
- `API/tests/userStockHoldings.test.ts` - New tests
- `API/tests/stocks.test.ts` - Integration test

## Verification
```bash
# 1. Check logs every 30 minutes
grep "no longer owned" logs/app.log

# 2. Query database
db.userstockholdingsnapshots.find({ total_shares: 0 })

# 3. Test API
curl http://localhost:3000/api/stocks/recommendations | jq '.[] | {ticker, owned_shares}'
```

## Performance
- One extra aggregation query per 30 minutes
- Query is indexed and filtered (fast)
- Minimal storage impact (~100 bytes per 0-share snapshot)

## Rollback
```bash
git revert deeb474
git push
# Redeploy
```
