# Database Storage Optimization

## Overview
This document describes the database storage optimization implemented to reduce database size by adjusting retention policies for snapshot collections.

## Problem
The database was growing very large due to retaining 14 days of snapshot data for:
1. **StockPriceSnapshot** - Stock price snapshots taken periodically
2. **UserStockHoldingSnapshot** - User stock holding snapshots taken periodically

## Solution
Reduced the TTL (Time To Live) from 14 days to 24 hours for both collections.

### Changes Made

#### 1. StockPriceSnapshot Model
**File**: `API/src/models/StockPriceSnapshot.ts`

**Before**: 
- TTL: 14 days (1,209,600 seconds)
- Retention: 14 days of historical snapshots

**After**:
- TTL: 24 hours (86,400 seconds)
- Retention: Only last 24 hours of snapshots

**Rationale**:
- Historical stock price data is now maintained in the `StockMarketHistory` collection, which stores daily aggregated data (opening, closing, high, low prices)
- The system already supplements missing snapshot data with historical data (see `aggregateStockRecommendations` function lines 557-592)
- Snapshots are only needed for real-time calculations and recent trends
- The cleanup job already deleted records older than 8 days, confirming that longer retention was unnecessary

#### 2. UserStockHoldingSnapshot Model
**File**: `API/src/models/UserStockHoldingSnapshot.ts`

**Before**:
- TTL: 14 days (1,209,600 seconds)
- Retention: 14 days of historical snapshots

**After**:
- TTL: 24 hours (86,400 seconds)
- Retention: Only last 24 hours of snapshots

**Rationale**:
- The aggregation functions only use the most recent snapshot per stock_id (see `aggregateStockRecommendations` lines 492-514)
- No code path requires historical holding snapshots beyond the current state
- Keeping multiple snapshots per stock provides no additional value

#### 3. Cleanup Job
**File**: `API/src/jobs/aggregateMarketHistory.ts`

**Changes**:
- Updated `cleanupOldData()` function to delete StockPriceSnapshot records older than 24 hours (previously 8 days)
- Added cleanup for UserStockHoldingSnapshot records older than 24 hours (previously no cleanup)
- Updated logging to reflect new retention periods

## Impact

### Storage Reduction
- **StockPriceSnapshot**: ~14x reduction in storage (from 14 days to 1 day)
- **UserStockHoldingSnapshot**: ~14x reduction in storage (from 14 days to 1 day)
- Combined: Significant reduction in overall database size

### Performance
- Smaller collections = faster queries
- Reduced index size = faster lookups
- Less data to backup and restore

### Functionality
- **No functionality loss**: All features continue to work as before
- Historical stock data available through `StockMarketHistory` collection
- System already designed to supplement snapshots with historical data when needed
- Real-time calculations and recommendations unaffected

## MongoDB TTL Index
The TTL (Time To Live) index automatically removes documents after a specified number of seconds. MongoDB runs a background task that checks for and removes expired documents approximately once every 60 seconds.

### How It Works
1. TTL index is set on the `timestamp` field
2. MongoDB checks if `timestamp + expireAfterSeconds < current time`
3. Expired documents are automatically deleted
4. No application code changes needed for automatic cleanup

### Benefits
- Automatic cleanup without manual intervention
- No impact on application performance
- Built-in MongoDB feature, battle-tested and reliable

## Testing
Added tests to verify:
1. TTL index exists on both models
2. TTL is set to correct value (86,400 seconds = 24 hours)
3. Compound indexes remain intact

Test file: `API/tests/models.test.ts`

## Rollback Plan
If needed, the TTL can be increased back to 14 days by:
1. Changing `expireAfterSeconds: 24 * 60 * 60` to `expireAfterSeconds: 14 * 24 * 60 * 60` in both model files
2. Updating the cleanup job to match
3. Re-deploying the application

Note: TTL changes require the indexes to be dropped and recreated, which happens automatically when the models are initialized with the new TTL value.

## Monitoring
Monitor the following to ensure optimization is working correctly:
1. Database size reduction over the next 24-48 hours
2. No errors in application logs related to missing snapshot data
3. Stock recommendations and calculations continue to work correctly
4. Cleanup job logs showing deleted records

## Conclusion
This optimization significantly reduces database storage requirements while maintaining all application functionality. The system was already designed to work with limited snapshot history by supplementing with aggregated historical data, making this change safe and effective.
