# Job Control Feature Implementation Summary

## Overview

I've successfully implemented a comprehensive job control system that allows you to enable/disable background jobs via Discord commands. This gives you fine-grained control over API usage and system behavior.

## What Was Implemented

### 1. Database Schema (Job Model)

**File:** `API/src/models/Job.ts`

A new MongoDB collection to track all background jobs:
- `name` - Unique identifier for the job
- `description` - Human-readable description
- `enabled` - Boolean flag to enable/disable
- `cronSchedule` - The schedule (cron format or "self-scheduled")
- `lastRun` - Timestamp of last successful execution

### 2. Initialization Script

**File:** `API/scripts/initializeJobs.ts`

A migration script that creates job records in the database. It initializes 8 background jobs:

1. **fetch_torn_items** - Fetches item catalog (daily at 3 AM)
2. **fetch_city_shop_stock** - Fetches city shops (every minute)
3. **fetch_foreign_stock** - Fetches foreign stocks (every minute)
4. **update_monitored_items** - Updates monitoring list (every minute)
5. **aggregate_market_history** - Creates daily summaries (every 30 min)
6. **fetch_stock_prices** - Fetches stock prices (every minute)
7. **monitor_market_prices** - Monitors watchlist for alerts (every 30 sec)
8. **adaptive_market_snapshots** - Smart market monitoring (self-scheduled)

**Run with:** `npm run init-jobs`

### 3. Background Fetcher Updates

**File:** `API/src/services/backgroundFetcher.ts`

Modified the scheduler to:
- Check job enabled status before each execution
- Update `lastRun` timestamp when jobs complete
- Log when jobs are skipped because they're disabled
- Fail-safe: defaults to enabled if job not found (backward compatible)

Added helper functions:
- `isJobEnabled(jobName)` - Checks if a job is enabled
- `updateJobLastRun(jobName)` - Updates the last run timestamp

### 4. Discord Commands

#### `/listjobs`
**File:** `API/src/discord/commands/listjobs.ts`

Lists all background jobs with:
- ✅/❌ Status indicator
- Job name and description
- Current enabled/disabled state
- Cron schedule
- Last run time (relative, e.g., "2 minutes ago")
- Beautiful embed formatting

#### `/enablejob`
**File:** `API/src/discord/commands/enablejob.ts`

Enables a disabled job:
- Autocomplete shows only disabled jobs
- Prevents enabling already-enabled jobs
- Updates database and provides immediate feedback
- User-friendly error messages

#### `/disablejob`
**File:** `API/src/discord/commands/disablejob.ts`

Disables a job to limit API usage:
- Autocomplete shows only enabled jobs
- Prevents disabling already-disabled jobs
- Updates database and provides immediate feedback
- Explains how to re-enable

### 5. Discord Bot Enhancements

**File:** `API/src/services/discordBot.ts`

Added autocomplete support for Discord commands:
- Handles `isAutocomplete()` interactions
- Calls command's `autocomplete()` method if available
- Enables smart job name selection in `/enablejob` and `/disablejob`

### 6. Tests

**File:** `API/tests/job.test.ts`

Comprehensive tests for the Job model:
- Create job records
- Update enabled status
- Update lastRun timestamp
- Enforce unique job names

All tests pass and integrate with existing test infrastructure.

### 7. Documentation

#### JOB_CONTROL.md
Comprehensive technical documentation covering:
- Available jobs and their schedules
- Setup instructions
- How the system works
- Use cases and examples
- Environment variables
- Database schema
- Troubleshooting guide
- Future enhancements

#### JOB_CONTROL_QUICK_START.md
User-friendly quick start guide with:
- Step-by-step setup instructions
- Common use cases with examples
- Troubleshooting tips
- Best practices
- Advanced configuration options

### 8. Package.json Update

Added npm script for easy initialization:
```bash
npm run init-jobs
```

## How to Use

### Setup (One-Time)

1. **Initialize jobs in database:**
   ```bash
   cd API
   npm run init-jobs
   ```

2. **Register Discord commands:**
   ```bash
   npm run register-commands
   ```

3. **Restart the application** (if running)

### Using Discord Commands

**List all jobs:**
```
/listjobs
```

**Disable a job to save API usage:**
```
/disablejob jobname:fetch_city_shop_stock
```

**Re-enable a job:**
```
/enablejob jobname:fetch_city_shop_stock
```

## Key Features

✅ **Fine-Grained Control** - Enable/disable individual jobs instead of all-or-nothing

✅ **API Usage Management** - Disable non-critical jobs to stay within rate limits

✅ **User-Friendly** - Discord commands with autocomplete and helpful messages

✅ **Safe** - Backward compatible, fails safe to enabled if job not found

✅ **Informative** - Shows last run times and schedules

✅ **Tested** - Comprehensive test coverage

✅ **Well-Documented** - Both technical docs and user guides

✅ **Auditable** - Tracks when jobs last ran

## Architecture

```
Discord User
    ↓
/disablejob command
    ↓
Updates Job.enabled in MongoDB
    ↓
Background Scheduler (cron)
    ↓
Checks Job.enabled before running
    ↓
Job Executes (if enabled) OR Skipped (if disabled)
    ↓
Updates Job.lastRun timestamp
```

## Backward Compatibility

- Works with existing `ENABLE_BACKGROUND_JOBS` environment variable
- If jobs collection doesn't exist, system behaves as before (all enabled)
- If job record not found, defaults to enabled
- No breaking changes to existing functionality

## Use Cases

### 1. Limit API Usage
Disable non-essential jobs during peak times:
```
/disablejob jobname:fetch_city_shop_stock
/disablejob jobname:fetch_foreign_stock
```

### 2. Maintenance Mode
Disable all monitoring during maintenance:
```
/disablejob jobname:adaptive_market_snapshots
/disablejob jobname:monitor_market_prices
```

### 3. Development/Testing
Disable jobs you don't need while developing:
```
/disablejob jobname:aggregate_market_history
```

### 4. Troubleshooting
Disable specific problematic jobs while investigating:
```
/disablejob jobname:update_monitored_items
```

## Files Changed

### Created (8 files)
- `API/src/models/Job.ts` - Job model
- `API/scripts/initializeJobs.ts` - Initialization script
- `API/src/discord/commands/listjobs.ts` - List jobs command
- `API/src/discord/commands/enablejob.ts` - Enable job command
- `API/src/discord/commands/disablejob.ts` - Disable job command
- `API/tests/job.test.ts` - Job model tests
- `API/JOB_CONTROL.md` - Technical documentation
- `API/JOB_CONTROL_QUICK_START.md` - User guide

### Modified (3 files)
- `API/src/services/backgroundFetcher.ts` - Added job checking logic
- `API/src/services/discordBot.ts` - Added autocomplete support
- `API/package.json` - Added init-jobs script

## Testing

All changes have been:
- ✅ Type-checked with TypeScript
- ✅ Compiled successfully
- ✅ Tested with unit tests
- ✅ Linted (no new warnings in our code)

## What You Need to Do

1. **Pull the changes** from this PR

2. **Run the initialization script:**
   ```bash
   cd API
   npm run init-jobs
   ```
   
   ⚠️ **Important:** You MUST run this script to create the jobs collection in MongoDB. Without it, the Discord commands won't work.

3. **Register the new Discord commands:**
   ```bash
   npm run register-commands
   ```

4. **Restart your application**

5. **Try it out in Discord:**
   ```
   /listjobs
   ```

## Notes

- The initialization script is **idempotent** - safe to run multiple times
- All jobs start **enabled** by default
- Jobs check their status at the **start of each cycle**
- The system **fails safe** - if there's an error checking status, the job runs
- **Self-scheduling jobs** (like adaptive_market_snapshots) check status before each cycle

## Future Enhancements

Potential improvements for later:
- Web UI for job management
- Job execution history and statistics
- Per-user permissions for job control
- Email/Discord alerts when jobs fail
- Custom cron schedule editing
- Job dependency management

## Questions?

Refer to:
- `API/JOB_CONTROL_QUICK_START.md` for user guide
- `API/JOB_CONTROL.md` for technical details
- Check application logs for job execution info

Enjoy your new job control capabilities! 🎉
