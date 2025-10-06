# Stock Holdings Clearing Fix - Visual Flow Diagram

## Before Fix (Broken Behavior)

```
┌─────────────────────────────────────────────────────────────┐
│ User State: Owns Stock 1 (1000 shares) and Stock 2 (500 sh)│
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ fetchUserStockHoldings() runs                               │
│ - Fetches from Torn API                                     │
│ - Gets Stock 1 and Stock 2                                  │
│ - Creates snapshots for both                                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Database after run 1 (10:00 AM):                            │
│ - Stock 1: 1000 shares                                      │
│ - Stock 2: 500 shares                                       │
└─────────────────────────────────────────────────────────────┘

                     ⏰ User sells Stock 1

┌─────────────────────────────────────────────────────────────┐
│ User State: Owns only Stock 2 (500 shares)                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ fetchUserStockHoldings() runs again                         │
│ - Fetches from Torn API                                     │
│ - Gets ONLY Stock 2 (Stock 1 not returned)                  │
│ - Creates snapshot for Stock 2 only                         │
│ ❌ NO SNAPSHOT CREATED FOR STOCK 1!                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Database after run 2 (10:30 AM):                            │
│ - Stock 1: 1000 shares (old snapshot from 10:00 AM) ❌      │
│ - Stock 2: 500 shares (new snapshot from 10:30 AM) ✅       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ GET /api/stocks/recommendations                             │
│ - Queries most recent snapshot per stock                    │
│ - Stock 1: shows 1000 shares ❌ WRONG!                      │
│ - Stock 2: shows 500 shares ✅                              │
└─────────────────────────────────────────────────────────────┘
```

## After Fix (Correct Behavior)

```
┌─────────────────────────────────────────────────────────────┐
│ User State: Owns Stock 1 (1000 shares) and Stock 2 (500 sh)│
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ fetchUserStockHoldings() runs                               │
│ - Fetches from Torn API                                     │
│ - Gets Stock 1 and Stock 2                                  │
│ - Tracks currentStockIds = {1, 2}                           │
│ - Creates snapshots for both                                │
│ - Queries previous owned stocks (none)                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Database after run 1 (10:00 AM):                            │
│ - Stock 1: 1000 shares                                      │
│ - Stock 2: 500 shares                                       │
└─────────────────────────────────────────────────────────────┘

                     ⏰ User sells Stock 1

┌─────────────────────────────────────────────────────────────┐
│ User State: Owns only Stock 2 (500 shares)                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ fetchUserStockHoldings() runs again                         │
│ - Fetches from Torn API                                     │
│ - Gets ONLY Stock 2                                         │
│ - Tracks currentStockIds = {2}                              │
│ - Creates snapshot for Stock 2                              │
│                                                              │
│ - Queries previous owned stocks:                            │
│   └─> Finds Stock 1 (1000 shares) from 10:00 AM            │
│   └─> Finds Stock 2 (500 shares) from 10:00 AM             │
│                                                              │
│ - Checks which are missing from currentStockIds:            │
│   └─> Stock 1 NOT in currentStockIds ✓                     │
│   └─> Creates 0-share snapshot for Stock 1 ✅               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ Database after run 2 (10:30 AM):                            │
│ - Stock 1: 0 shares (new snapshot from 10:30 AM) ✅         │
│ - Stock 2: 500 shares (new snapshot from 10:30 AM) ✅       │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ GET /api/stocks/recommendations                             │
│ - Queries most recent snapshot per stock                    │
│ - Stock 1: shows 0 shares ✅ CORRECT!                       │
│ - Stock 2: shows 500 shares ✅                              │
└─────────────────────────────────────────────────────────────┘
```

## Key Algorithm Changes

### Before (Broken)
```typescript
1. Fetch stocks from API
2. if (!stocks) return;  // Early exit
3. for each stock in API response:
4.   Create snapshot
5. Insert snapshots
```

### After (Fixed)
```typescript
1. Fetch stocks from API
2. Track currentStockIds = new Set()
3. if (stocks):
4.   for each stock in API response:
5.     Add to currentStockIds
6.     Create snapshot
7. Query previous owned stocks (total_shares > 0)
8. for each previous stock:
9.   if NOT in currentStockIds:
10.    Create 0-share snapshot
11. Insert all snapshots
```

## Database Query Used

```javascript
// Find most recent snapshot per stock where total_shares > 0
UserStockHoldingSnapshot.aggregate([
  {
    $match: {
      total_shares: { $gt: 0 }  // Only owned stocks
    }
  },
  {
    $sort: { stock_id: 1, timestamp: -1 }  // Latest first per stock
  },
  {
    $group: {
      _id: '$stock_id',
      total_shares: { $first: '$total_shares' },
      timestamp: { $first: '$timestamp' }
    }
  }
]);
```

This efficiently gets the most recent non-zero holding for each stock,
which can then be compared against the current API response.
