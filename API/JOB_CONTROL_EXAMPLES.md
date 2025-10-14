# Job Control Discord Commands - Examples

This document shows example interactions with the new job control Discord commands.

## Example 1: Listing All Jobs

**User types:** `/listjobs`

**Bot responds with an embed:**

```
📋 Background Jobs
Current status of all background jobs

✅ adaptive_market_snapshots
Status: ENABLED
Schedule: self-scheduled
Last run: 2 minutes ago
Adaptively fetches market snapshots based on item activity

✅ aggregate_market_history
Status: ENABLED
Schedule: */30 * * * *
Last run: 15 minutes ago
Aggregates market snapshot data into daily summaries

✅ fetch_city_shop_stock
Status: ENABLED
Schedule: * * * * *
Last run: 1 minute ago
Fetches city shop stock levels

✅ fetch_foreign_stock
Status: ENABLED
Schedule: * * * * *
Last run: 1 minute ago
Fetches foreign stock levels from travel destinations

✅ fetch_stock_prices
Status: ENABLED
Schedule: * * * * *
Last run: 30 seconds ago
Fetches current stock market prices and user holdings

✅ fetch_torn_items
Status: ENABLED
Schedule: 0 3 * * *
Last run: 5 hours ago
Fetches the complete Torn items catalog

✅ monitor_market_prices
Status: ENABLED
Schedule: */30 * * * * *
Last run: 10 seconds ago
Monitors market prices for user watchlist items and sends alerts

✅ update_monitored_items
Status: ENABLED
Schedule: */1 * * * *
Last run: 45 seconds ago
Updates the list of items to monitor based on sales velocity

Use /enablejob or /disablejob to manage jobs
```

---

## Example 2: Disabling a Job

**User types:** `/disablejob jobname:`

**Bot shows autocomplete with enabled jobs:**
```
- adaptive_market_snapshots - Adaptively fetches market snapshots...
- aggregate_market_history - Aggregates market snapshot data...
- fetch_city_shop_stock - Fetches city shop stock levels
- fetch_foreign_stock - Fetches foreign stock levels...
- fetch_stock_prices - Fetches current stock market prices...
- fetch_torn_items - Fetches the complete Torn items catalog
- monitor_market_prices - Monitors market prices for user...
- update_monitored_items - Updates the list of items to monitor...
```

**User selects:** `fetch_city_shop_stock`

**Bot responds:**
```
✅ Disabled job: fetch_city_shop_stock

The job will stop running. Use /enablejob to re-enable it.
```

---

## Example 3: Trying to Disable an Already Disabled Job

**User types:** `/disablejob jobname:fetch_city_shop_stock`

**Bot responds:**
```
ℹ️ Job "fetch_city_shop_stock" is already disabled.
```

---

## Example 4: Enabling a Job

**User types:** `/enablejob jobname:`

**Bot shows autocomplete with disabled jobs:**
```
- fetch_city_shop_stock - Fetches city shop stock levels
```

**User selects:** `fetch_city_shop_stock`

**Bot responds:**
```
✅ Enabled job: fetch_city_shop_stock

The job will start running according to its schedule.
```

---

## Example 5: Listing Jobs After Changes

**User types:** `/listjobs`

**Bot responds with updated status:**

```
📋 Background Jobs
Current status of all background jobs

✅ adaptive_market_snapshots
Status: ENABLED
Schedule: self-scheduled
Last run: 5 minutes ago
Adaptively fetches market snapshots based on item activity

❌ fetch_city_shop_stock
Status: DISABLED
Schedule: * * * * *
Last run: 10 minutes ago
Fetches city shop stock levels

[... other jobs ...]
```

Notice the ❌ icon and "DISABLED" status for the disabled job.

---

## Example 6: Invalid Job Name

**User types:** `/disablejob jobname:nonexistent_job`

**Bot responds:**
```
❌ Job "nonexistent_job" not found. Use /listjobs to see available jobs.
```

---

## Real-World Scenario: Reducing API Usage

### Step 1: Check Current Status
```
/listjobs
```
*Bot shows all 8 jobs are enabled*

### Step 2: Disable Non-Critical Jobs
```
/disablejob jobname:fetch_city_shop_stock
```
✅ Disabled job: fetch_city_shop_stock

```
/disablejob jobname:fetch_foreign_stock
```
✅ Disabled job: fetch_foreign_stock

```
/disablejob jobname:aggregate_market_history
```
✅ Disabled job: aggregate_market_history

### Step 3: Verify Changes
```
/listjobs
```
*Bot shows 3 jobs disabled, 5 enabled*

### Step 4: Monitor API Usage
*Check Torn API key page to see reduced requests per minute*

### Step 5: Re-enable When Ready
```
/enablejob jobname:fetch_city_shop_stock
```
✅ Enabled job: fetch_city_shop_stock

---

## Command Comparison

| Command | Purpose | Autocomplete |
|---------|---------|--------------|
| `/listjobs` | View all jobs and their status | N/A |
| `/disablejob` | Disable a running job | Shows enabled jobs only |
| `/enablejob` | Enable a disabled job | Shows disabled jobs only |

---

## Visual Key

- ✅ = Job is enabled and running
- ❌ = Job is disabled and not running
- "Last run: X minutes ago" = Relative timestamp
- "Never run" = Job hasn't executed yet

---

## Tips

1. **Use autocomplete** - Start typing the job name to filter options
2. **Check status first** - Use `/listjobs` before making changes
3. **One at a time** - Disable jobs gradually to see the impact
4. **Monitor logs** - Check application logs to verify jobs are skipped
5. **Check last run** - Verify jobs are actually running by checking timestamps

---

## Error Messages

### Job Not Found
```
❌ Job "job_name" not found. Use /listjobs to see available jobs.
```

### Already Disabled
```
ℹ️ Job "job_name" is already disabled.
```

### Already Enabled
```
ℹ️ Job "job_name" is already enabled.
```

### Generic Error
```
❌ Failed to disable job. Please try again later.
```
*Check application logs for details*

---

## Notes

- Commands are **ephemeral** (only visible to you)
- Changes take effect at the **next scheduled run**
- Currently running jobs will **complete** before being disabled
- All jobs start **enabled** after initialization
- Changes persist across application restarts
