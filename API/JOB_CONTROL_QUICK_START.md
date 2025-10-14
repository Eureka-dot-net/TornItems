# Job Control Quick Start Guide

This guide will help you set up and use the job control feature to manage background jobs via Discord.

## Prerequisites

- MongoDB connection configured in `.env`
- Discord bot token and client ID configured
- API running and connected to database

## Step 1: Initialize Jobs in Database

Run the initialization script to create job records in MongoDB:

```bash
cd API
npm run init-jobs
```

**Expected Output:**
```
Connecting to MongoDB...
Connected to MongoDB
Initializing jobs...
Created job: fetch_torn_items
Created job: fetch_city_shop_stock
Created job: fetch_foreign_stock
Created job: update_monitored_items
Created job: aggregate_market_history
Created job: fetch_stock_prices
Created job: monitor_market_prices
Created job: adaptive_market_snapshots
Job initialization completed successfully!
Total jobs in database: 8

All jobs:
  - adaptive_market_snapshots: ✅ ENABLED (self-scheduled)
  - aggregate_market_history: ✅ ENABLED (*/30 * * * *)
  - fetch_city_shop_stock: ✅ ENABLED (* * * * *)
  - fetch_foreign_stock: ✅ ENABLED (* * * * *)
  - fetch_stock_prices: ✅ ENABLED (* * * * *)
  - fetch_torn_items: ✅ ENABLED (0 3 * * *)
  - monitor_market_prices: ✅ ENABLED (*/30 * * * * *)
  - update_monitored_items: ✅ ENABLED (*/1 * * * *)
Disconnected from MongoDB
```

**Note:** This script is safe to run multiple times. It will only create jobs that don't already exist.

## Step 2: Register Discord Commands

Register the new commands with Discord:

```bash
cd API
npm run register-commands
```

**Expected Output:**
```
Registering Discord commands...
✅ Successfully registered 18 commands
```

**Note:** 
- For testing, set `DISCORD_GUILD_ID` in `.env` for instant command registration
- For production, remove `DISCORD_GUILD_ID` for global commands (1-hour delay)

## Step 3: Use Discord Commands

### List All Jobs

In Discord, type:
```
/listjobs
```

This will display an embed showing all jobs with:
- ✅/❌ Status icon
- Job name
- Enabled/Disabled status
- Cron schedule
- Last run time
- Description

### Disable a Job

To disable a job and reduce API usage:

```
/disablejob jobname:monitor_market_prices
```

The `jobname` field has autocomplete showing all enabled jobs.

**Response:**
```
✅ Disabled job: monitor_market_prices

The job will stop running. Use /enablejob to re-enable it.
```

### Enable a Job

To re-enable a disabled job:

```
/enablejob jobname:monitor_market_prices
```

The `jobname` field has autocomplete showing all disabled jobs.

**Response:**
```
✅ Enabled job: monitor_market_prices

The job will start running according to its schedule.
```

## Common Use Cases

### Reduce API Usage During Peak Times

Disable non-essential jobs:

```
/disablejob jobname:fetch_city_shop_stock
/disablejob jobname:fetch_foreign_stock
/disablejob jobname:update_monitored_items
```

Keep only essential jobs running:
- `monitor_market_prices` (for price alerts)
- `fetch_stock_prices` (for portfolio tracking)
- `adaptive_market_snapshots` (for market data)

### Maintenance Mode

Disable all market monitoring while performing maintenance:

```
/disablejob jobname:adaptive_market_snapshots
/disablejob jobname:monitor_market_prices
/disablejob jobname:aggregate_market_history
```

### Re-enable After Maintenance

Check status first:
```
/listjobs
```

Then re-enable each disabled job:
```
/enablejob jobname:adaptive_market_snapshots
/enablejob jobname:monitor_market_prices
/enablejob jobname:aggregate_market_history
```

## Troubleshooting

### Commands Don't Appear in Discord

1. Make sure you ran `npm run register-commands`
2. If using guild commands, verify `DISCORD_GUILD_ID` is set correctly
3. Try restarting Discord client
4. For global commands, wait up to 1 hour

### Jobs Not Responding to Enable/Disable

1. Verify jobs are initialized:
   ```bash
   npm run init-jobs
   ```

2. Check application is running and connected to MongoDB

3. Check logs for errors:
   ```bash
   tail -f logs/app.log
   ```

4. Verify `ENABLE_BACKGROUND_JOBS` environment variable is not set to `false`

### Script Fails to Connect to MongoDB

1. Check `MONGO_URI` in `.env`:
   ```bash
   MONGO_URI=mongodb://localhost:27017/wasteland_rpg
   ```

2. Ensure MongoDB is running:
   ```bash
   # Linux/Mac
   sudo systemctl status mongod
   
   # Or check if port 27017 is listening
   netstat -an | grep 27017
   ```

3. Test connection manually:
   ```bash
   mongosh "mongodb://localhost:27017/wasteland_rpg"
   ```

### Job Still Running After Disable

- Jobs check their status at the beginning of each cycle
- A currently-running job instance will complete before checking status again
- For immediate effect, restart the application

## Advanced Configuration

### Environment Variables

You can still use environment variables for global control:

```bash
# Disable ALL jobs at once (master switch)
ENABLE_BACKGROUND_JOBS=false

# Customize history aggregation schedule
HISTORY_AGGREGATION_CRON=0 */2 * * *  # Every 2 hours

# Adjust API rate limit
TORN_RATE_LIMIT=45  # Reduce to 45 requests per minute

# Adjust curiosity rate
CURIOSITY_RATE=0.1  # Increase to 10%
```

### Database Direct Access

You can also manage jobs directly in MongoDB if needed:

```javascript
// Connect to MongoDB
mongosh "mongodb://localhost:27017/wasteland_rpg"

// List all jobs
db.jobs.find().pretty()

// Disable a specific job
db.jobs.updateOne(
  { name: "monitor_market_prices" },
  { $set: { enabled: false } }
)

// Enable a specific job
db.jobs.updateOne(
  { name: "monitor_market_prices" },
  { $set: { enabled: true } }
)

// Check when a job last ran
db.jobs.find(
  { name: "monitor_market_prices" },
  { name: 1, enabled: 1, lastRun: 1 }
)
```

## Best Practices

1. **Use `/listjobs` Frequently**: Check job status regularly to understand system behavior

2. **Disable During Development**: When testing locally, disable jobs that aren't needed

3. **Document Changes**: Keep track of which jobs you've disabled and why

4. **Monitor API Usage**: Use Torn's API key page to track your usage

5. **Re-enable Gradually**: After disabling multiple jobs, re-enable them one at a time to monitor impact

6. **Check Last Run Times**: Use `/listjobs` to see if jobs are actually running as expected

## Next Steps

- Review [JOB_CONTROL.md](./JOB_CONTROL.md) for detailed technical documentation
- Check application logs to see job execution
- Monitor Torn API usage to optimize job configuration
- Consider setting up alerts for when jobs fail

## Support

If you encounter issues:

1. Check the logs: `tail -f logs/app.log`
2. Verify database connection
3. Ensure jobs are initialized: `npm run init-jobs`
4. Review [JOB_CONTROL.md](./JOB_CONTROL.md) for troubleshooting
5. Check that all commands are registered: `npm run register-commands`
