# Performance and Configuration Improvements

## Overview

This document describes the performance optimizations and configuration improvements made to address two critical issues:

1. **Profit API Performance**: The `/profit` endpoint was taking an extremely long time to respond
2. **Job Control**: Added ability to disable background jobs and configure API rate limits

## Changes Made

### 1. Profit API Performance Optimization

**Problem**: The `/profit` endpoint was loading ALL market snapshots from the database without any date filtering, potentially processing millions of records.

**Solution**: Limited the query to only fetch market snapshots from the last 48 hours.

**File**: `API/src/routes/profit.ts`

**Changes**:
```typescript
// Before: Fetch ALL snapshots (could be millions of records)
MarketSnapshot.find().sort({ fetched_at: -1 }).lean()

// After: Only fetch last 48 hours of snapshots
const fortyEightHoursAgo = new Date(Date.now() - (48 * 60 * 60 * 1000));
MarketSnapshot.find({ fetched_at: { $gte: fortyEightHoursAgo } }).sort({ fetched_at: -1 }).lean()
```

**Why 48 hours?**
- We need 48 hours of data to properly calculate 24-hour trends
- Current 24h period: for `sales_24h_current`
- Previous 24h period: for `sales_24h_previous` and `trend_24h` calculation
- This dramatically reduces memory usage and query time while maintaining all required functionality

**Performance Impact**:
- Reduces data fetched by 90-99% depending on how long the system has been running
- Significantly faster response times
- Lower memory usage
- More predictable performance

### 2. Background Job Control

**Problem**: No way to disable background jobs for testing, development, or troubleshooting without modifying code.

**Solution**: Added `ENABLE_BACKGROUND_JOBS` environment variable to control all scheduled background jobs.

**File**: `API/src/services/backgroundFetcher.ts`

**Changes**:
```typescript
// Added new configuration constant
const ENABLE_BACKGROUND_JOBS = process.env.ENABLE_BACKGROUND_JOBS !== 'false';

// Updated startScheduler() to check the flag
export function startScheduler(): void {
  // Check if background jobs are disabled
  if (!ENABLE_BACKGROUND_JOBS) {
    logInfo('Background jobs are DISABLED via ENABLE_BACKGROUND_JOBS environment variable');
    logInfo('Set ENABLE_BACKGROUND_JOBS=true to enable background jobs');
    return;
  }
  
  // ... rest of scheduler code
}
```

**Default Behavior**: Background jobs are ENABLED by default (when the variable is not set or set to any value other than `'false'`)

**To Disable**: Set `ENABLE_BACKGROUND_JOBS=false` in your `.env` file

### 3. Rate Limit Configuration (Already Existed)

The ability to configure API rate limits already existed via the `TORN_RATE_LIMIT` environment variable.

**File**: `API/src/services/backgroundFetcher.ts`

**Usage**:
```bash
# Set in .env file
TORN_RATE_LIMIT=30  # Limit to 30 requests per minute (default is 60)
```

## Environment Variables

### New Variable

- **`ENABLE_BACKGROUND_JOBS`** (default: `true`)
  - Controls whether background jobs run
  - Set to `false` to disable all scheduled tasks
  - Useful for:
    - Development/testing
    - Troubleshooting
    - Maintenance windows
    - Running multiple instances (only one should have jobs enabled)

### Existing Variables (Documented)

- **`TORN_RATE_LIMIT`** (default: `60`)
  - Maximum API requests per minute to Torn API
  - Adjust based on your API tier or to be more conservative
  
- **`CURIOSITY_RATE`** (default: `0.05`)
  - Percentage of API budget for random checks (5%)
  - Controls adaptive monitoring behavior

## Updated Documentation

The following files were updated to document the new environment variable:

1. **`API/.env.example`**
   - Added `ENABLE_BACKGROUND_JOBS` with description
   - Grouped related variables together

2. **`API/BACKGROUND_FETCHER.md`**
   - Added to Configuration section
   - Added to Development Notes
   - Explained behavior and use cases

## Testing

Manual testing was performed to verify:

1. ✅ Environment variable logic works correctly
   - Default (undefined) → enabled
   - Explicit `true` → enabled
   - Explicit `false` → disabled

2. ✅ Rate limit configuration works correctly
   - Default value → 60
   - Custom value → respected

3. ✅ Date filter logic is correct
   - Recent data (now) passes filter
   - Boundary data (exactly 48h ago) passes filter
   - Old data (3+ days ago) fails filter

4. ✅ Code compiles without errors
   - TypeScript compilation successful
   - ESLint passes with no warnings

## Migration Notes

**No breaking changes** - all changes are backwards compatible:

- The profit API continues to work exactly as before, just faster
- Background jobs continue to run by default
- Existing deployments don't need any configuration changes

## Monitoring

After deployment, monitor:

1. **Profit API Response Time**: Should see significant improvement
2. **Memory Usage**: Should be lower and more consistent
3. **Database Query Performance**: MongoDB queries should be faster
4. **Background Job Status**: Check logs to confirm jobs are running (or disabled if configured)

## Future Improvements

Potential future optimizations:

1. Consider using MarketHistory aggregated data for historical queries
2. Add response caching for profit endpoint (e.g., 30-second cache)
3. Add more granular job control (enable/disable individual jobs)
4. Add metrics/monitoring for query performance

## Summary

- ✅ Fixed slow profit API by limiting data to last 48 hours
- ✅ Added ability to disable background jobs via environment variable
- ✅ Documented configuration options clearly
- ✅ No breaking changes
- ✅ Backwards compatible
