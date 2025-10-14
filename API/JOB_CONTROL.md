# Job Control Feature

This feature allows you to enable/disable background jobs via Discord commands to limit API usage and control system behavior.

## Overview

The system now uses a MongoDB collection to track all background jobs and their enabled/disabled status. This provides fine-grained control over which jobs run and allows you to limit Torn API usage.

## Available Jobs

| Job Name | Description | Default Schedule |
|----------|-------------|------------------|
| `fetch_torn_items` | Fetches the complete Torn items catalog | Daily at 3 AM |
| `fetch_city_shop_stock` | Fetches city shop stock levels | Every minute |
| `fetch_foreign_stock` | Fetches foreign stock levels from travel destinations | Every minute |
| `update_monitored_items` | Updates the list of items to monitor based on sales velocity | Every minute |
| `aggregate_market_history` | Aggregates market snapshot data into daily summaries | Every 30 minutes (configurable) |
| `fetch_stock_prices` | Fetches current stock market prices and user holdings | Every minute |
| `monitor_market_prices` | Monitors market prices for user watchlist items and sends alerts | Every 30 seconds |
| `adaptive_market_snapshots` | Adaptively fetches market snapshots based on item activity | Self-scheduled |

## Setup

### 1. Initialize Jobs in Database

Before using the job control commands, you need to initialize the jobs collection in MongoDB:

```bash
cd API
npm run init-jobs
```

This script will:
- Connect to your MongoDB database
- Create job records for all background jobs
- Set all jobs to enabled by default
- Display the current status of all jobs

**Note:** This script is idempotent - it's safe to run multiple times. It will only create jobs that don't already exist.

### 2. Register Discord Commands

After initializing the jobs, register the new Discord commands:

```bash
cd API
npm run register-commands
```

This will register the following new commands:
- `/listjobs` - List all jobs and their status
- `/enablejob` - Enable a disabled job
- `/disablejob` - Disable a job

## Discord Commands

### `/listjobs`

Lists all background jobs with their current status, schedule, and last run time.

**Usage:**
```
/listjobs
```

**Output:**
Shows an embed with all jobs, including:
- Status (enabled/disabled)
- Schedule (cron expression)
- Last run time (relative)
- Description

### `/enablejob`

Enables a disabled background job.

**Usage:**
```
/enablejob jobname:<job_name>
```

**Features:**
- Autocomplete shows only disabled jobs
- Prevents enabling already-enabled jobs
- Provides immediate feedback

**Example:**
```
/enablejob jobname:monitor_market_prices
```

### `/disablejob`

Disables a background job to reduce API usage.

**Usage:**
```
/disablejob jobname:<job_name>
```

**Features:**
- Autocomplete shows only enabled jobs
- Prevents disabling already-disabled jobs
- Provides immediate feedback

**Example:**
```
/disablejob jobname:fetch_city_shop_stock
```

## How It Works

### Job Status Checking

Each scheduled job checks its enabled status before running:

1. Job schedule triggers (e.g., every minute)
2. System queries MongoDB for job's enabled status
3. If enabled: job runs and updates `lastRun` timestamp
4. If disabled: job is skipped (logged)

### Fail-Safe Behavior

- If a job is not found in the database, it defaults to **enabled**
- If there's an error checking job status, the job defaults to **enabled**
- This ensures backward compatibility and prevents accidental disabling

### Self-Scheduling Jobs

The `adaptive_market_snapshots` job is self-scheduling (it manages its own timing). When disabled:
- It checks status before each cycle
- If disabled, it waits 1 minute and checks again
- When re-enabled, it resumes normal operation

## Use Cases

### Limiting API Usage

Disable non-critical jobs to reduce Torn API requests:

```
/disablejob jobname:fetch_city_shop_stock
/disablejob jobname:fetch_foreign_stock
/disablejob jobname:aggregate_market_history
```

### Maintenance Windows

Disable all jobs during maintenance:

```
/disablejob jobname:adaptive_market_snapshots
/disablejob jobname:monitor_market_prices
/disablejob jobname:fetch_stock_prices
... (disable others as needed)
```

### Troubleshooting

Disable specific problematic jobs while investigating issues:

```
/disablejob jobname:monitor_market_prices
```

### Selective Monitoring

Keep only essential jobs running:

```
# Keep these enabled:
- monitor_market_prices (for alerts)
- fetch_stock_prices (for portfolio tracking)

# Disable these:
/disablejob jobname:fetch_city_shop_stock
/disablejob jobname:fetch_foreign_stock
/disablejob jobname:update_monitored_items
```

## Environment Variables

The job control system respects existing environment variables:

- `ENABLE_BACKGROUND_JOBS` - Master switch for all jobs (default: `true`)
  - Set to `false` to disable ALL jobs at once
  - Individual job settings are checked only if this is `true`
- `HISTORY_AGGREGATION_CRON` - Custom schedule for history aggregation (default: `*/30 * * * *`)
- `TORN_RATE_LIMIT` - API requests per minute (default: `60`)
- `CURIOSITY_RATE` - Percentage for random checks (default: `0.05`)

## Database Schema

### Job Collection

```typescript
{
  name: string;           // Unique job identifier (e.g., "monitor_market_prices")
  description: string;    // Human-readable description
  enabled: boolean;       // Whether the job is enabled
  cronSchedule: string;   // Cron expression or "self-scheduled"
  lastRun?: Date;        // Timestamp of last successful run
}
```

**Indexes:**
- `name` (unique, indexed for fast lookups)

## Migration Notes

### For Existing Deployments

1. Pull the latest code
2. Build the application: `npm run build`
3. Run the initialization script: `npm run init-jobs`
4. Register Discord commands: `npm run register-commands`
5. Restart the application

### Backward Compatibility

- If jobs are not initialized, the system behaves as before (all jobs enabled)
- Existing environment variables continue to work
- No breaking changes to existing functionality

## Troubleshooting

### Jobs Not Responding to Enable/Disable

1. Check if jobs are initialized:
   ```bash
   npm run init-jobs
   ```

2. Verify database connection in application logs

3. Check if `ENABLE_BACKGROUND_JOBS` is set to `false` (master switch)

### Commands Not Appearing in Discord

1. Re-register commands:
   ```bash
   npm run register-commands
   ```

2. Wait up to 1 hour for global commands (or use guild commands for instant updates)

### Job Still Running After Disable

- Jobs check status at the start of each cycle
- Currently running job will complete before checking again
- For immediate stop, restart the application

## Future Enhancements

Potential improvements:
- Web UI for job management
- Job execution history and statistics
- Alerting when jobs fail
- Per-user job control permissions
- Job dependency management
- Custom cron schedule editing via Discord

## Support

For issues or questions:
1. Check application logs for errors
2. Verify MongoDB connection
3. Ensure jobs are initialized with `/listjobs`
4. Review this documentation
