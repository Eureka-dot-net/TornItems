# Migration Guide: Job Control Feature

This guide will help you migrate from the current system to the new job control feature.

## What Changed

### Before
- Jobs could only be disabled globally via `ENABLE_BACKGROUND_JOBS=false` environment variable
- No way to disable individual jobs
- No visibility into which jobs were running

### After
- Jobs stored in MongoDB with individual enable/disable status
- Discord commands to control each job independently
- View job status, schedules, and last run times
- Fine-grained control over API usage

## Migration Steps

### Step 1: Backup (Optional but Recommended)

```bash
# Backup your MongoDB database
mongodump --uri="mongodb://localhost:27017/wasteland_rpg" --out=backup_before_job_control
```

### Step 2: Pull Latest Code

```bash
git pull origin main
```

### Step 3: Install Dependencies (if needed)

```bash
cd API
npm install
```

### Step 4: Build the Application

```bash
npm run build
```

**Expected Output:**
```
> api@1.0.0 build
> tsc

[build completes with no errors]
```

### Step 5: Initialize Jobs in Database

**This is the critical step!**

```bash
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

### Step 6: Register New Discord Commands

```bash
npm run register-commands
```

**Expected Output:**
```
Registering Discord commands...
✅ Successfully registered [number] commands
```

**Note:** 
- If using `DISCORD_GUILD_ID` (recommended for testing), commands appear instantly
- Without `DISCORD_GUILD_ID` (global commands), allow up to 1 hour for Discord to propagate

### Step 7: Restart the Application

```bash
# If running in development
npm run dev

# If running in production
npm start
```

### Step 8: Verify in Discord

In your Discord server, type:
```
/listjobs
```

You should see an embed showing all 8 jobs with their status.

## Rollback Plan (If Needed)

If you encounter issues and need to rollback:

### Option 1: Keep the Code, Disable the Feature

The system is backward compatible. If jobs aren't initialized, it works as before.

### Option 2: Remove Job Records

```javascript
// In MongoDB shell
mongosh "mongodb://localhost:27017/wasteland_rpg"
db.jobs.drop()
```

This will remove the jobs collection. The system will fall back to the old behavior.

### Option 3: Git Revert

```bash
git revert [commit-hash]
npm install
npm run build
npm run register-commands
```

## Verification Checklist

After migration, verify:

- [ ] Application starts without errors
- [ ] `/listjobs` command works in Discord
- [ ] All 8 jobs show as ENABLED
- [ ] Jobs are actually running (check logs)
- [ ] `/disablejob` command works
- [ ] `/enablejob` command works
- [ ] Disabled jobs don't run (check logs)
- [ ] Re-enabled jobs resume running

## Environment Variables

### Still Supported

All existing environment variables continue to work:

```bash
# Master switch - still works
ENABLE_BACKGROUND_JOBS=false

# Rate limiting - still works
TORN_RATE_LIMIT=60

# Curiosity rate - still works
CURIOSITY_RATE=0.05

# History aggregation schedule - still works
HISTORY_AGGREGATION_CRON=*/30 * * * *
```

### New Behavior

When `ENABLE_BACKGROUND_JOBS=false`:
- Individual job settings are ignored
- ALL jobs are disabled (master switch)

When `ENABLE_BACKGROUND_JOBS=true` (or not set):
- Individual job settings in database are checked
- Jobs can be controlled independently

## Common Issues

### Issue: "npm run init-jobs" fails

**Symptoms:**
```
Error: MONGO_URI not found
```

**Solution:**
1. Check `.env` file exists in API directory
2. Verify `MONGO_URI` is set:
   ```bash
   MONGO_URI=mongodb://localhost:27017/wasteland_rpg
   ```
3. Ensure MongoDB is running

---

### Issue: Commands don't appear in Discord

**Symptoms:**
- Typing `/listjobs` shows "No matching commands"

**Solution:**
1. Re-run command registration:
   ```bash
   npm run register-commands
   ```
2. If using guild commands, verify `DISCORD_GUILD_ID` in `.env`
3. Restart Discord client
4. Wait up to 1 hour for global commands

---

### Issue: Jobs still run after disabling

**Symptoms:**
- Job appears disabled in `/listjobs`
- But logs show it's still running

**Possible Causes:**
1. **Job is currently running:** Wait for current cycle to complete
2. **Application not restarted:** Restart the application
3. **Master switch:** Check `ENABLE_BACKGROUND_JOBS` is not set to `false`

---

### Issue: "Job not found" when trying to disable/enable

**Symptoms:**
```
❌ Job "job_name" not found. Use /listjobs to see available jobs.
```

**Solution:**
1. Verify job name spelling (use autocomplete)
2. Check jobs are initialized:
   ```bash
   npm run init-jobs
   ```
3. Verify database connection

## Testing the Migration

### Test 1: List Jobs

```
/listjobs
```

**Expected:** Embed showing 8 jobs, all enabled

### Test 2: Disable a Job

```
/disablejob jobname:fetch_city_shop_stock
```

**Expected:** 
- Success message
- Job stops running (check logs)

### Test 3: Verify Disabled

```
/listjobs
```

**Expected:** `fetch_city_shop_stock` shows ❌ and DISABLED

### Test 4: Re-enable

```
/enablejob jobname:fetch_city_shop_stock
```

**Expected:**
- Success message
- Job resumes running (check logs)

### Test 5: Check Logs

```bash
tail -f logs/app.log
```

**Look for:**
- "Skipping [job_name] - job is disabled" when disabled
- Job execution logs when enabled

## Post-Migration Tasks

1. **Document Your Settings**
   - Note which jobs you keep enabled
   - Document why certain jobs are disabled

2. **Monitor API Usage**
   - Check Torn API key usage page
   - Adjust job settings as needed

3. **Set Up Alerts** (Optional)
   - Consider setting up monitoring for job failures
   - Alert if critical jobs are disabled

4. **Train Team Members**
   - Share [JOB_CONTROL_QUICK_START.md](JOB_CONTROL_QUICK_START.md)
   - Show them how to use Discord commands

## Data Impact

### What Gets Created
- New `jobs` collection in MongoDB
- 8 job records (one per background job)

### What Gets Modified
- Nothing! This is purely additive

### What Gets Deleted
- Nothing! No existing data is removed

## Performance Impact

### Minimal Overhead
- Each job checks status once per execution (single MongoDB query)
- Query is fast (indexed on `name` field)
- Negligible performance impact

### Benefits
- Reduce API usage by disabling unnecessary jobs
- Faster development/testing cycles
- Better control during incidents

## Support

If you run into issues during migration:

1. **Check Logs**
   ```bash
   tail -f logs/app.log
   ```

2. **Verify Database**
   ```javascript
   mongosh "mongodb://localhost:27017/wasteland_rpg"
   db.jobs.find().pretty()
   ```

3. **Test Commands**
   - Try `/listjobs` first (read-only)
   - Then try enable/disable on non-critical jobs

4. **Review Documentation**
   - [JOB_CONTROL_QUICK_START.md](JOB_CONTROL_QUICK_START.md) - User guide
   - [JOB_CONTROL.md](JOB_CONTROL.md) - Technical details
   - [JOB_CONTROL_EXAMPLES.md](JOB_CONTROL_EXAMPLES.md) - Command examples

## Success Criteria

Migration is successful when:

✅ `npm run init-jobs` completes without errors
✅ `/listjobs` shows all 8 jobs in Discord
✅ All jobs show as ENABLED initially
✅ `/disablejob` successfully disables a job
✅ Disabled job stops running (verified in logs)
✅ `/enablejob` successfully re-enables the job
✅ Re-enabled job resumes running (verified in logs)
✅ No errors in application logs

## Timeline

Expected migration time: **5-10 minutes**

1. Pull code: 1 min
2. Build: 1 min
3. Initialize jobs: 1 min
4. Register commands: 1 min
5. Restart app: 1 min
6. Testing: 2-5 min

## Questions?

- Review the [Quick Start Guide](JOB_CONTROL_QUICK_START.md)
- Check the [Examples](JOB_CONTROL_EXAMPLES.md)
- Read the [Technical Documentation](JOB_CONTROL.md)
- Check application logs for detailed error messages

Happy migrating! 🚀
