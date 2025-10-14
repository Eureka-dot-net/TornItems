# Migration Scripts

This directory contains migration and initialization scripts for various system features.

## Available Scripts

### initializeJobs.ts

**Purpose:** Creates job records in MongoDB for job control via Discord commands.

**Description:** Initializes the Jobs collection with all background jobs (fetch_torn_items, monitor_market_prices, etc.). This is required before using the `/listjobs`, `/enablejob`, and `/disablejob` Discord commands.

**How to Run:**
```bash
cd API
npm run init-jobs
```

**When to Run:** Once after pulling the job control feature. Safe to run multiple times (idempotent).

**Documentation:** See [JOB_CONTROL_QUICK_START.md](../JOB_CONTROL_QUICK_START.md) for complete guide.

---

### initializeStockLots.ts

**Purpose:** Creates `StockHoldingLot` records for all stocks you currently own in your Torn portfolio. This is a **one-time migration** script that should be run before the FIFO tracking system starts operating.

### What It Does
1. Fetches your current stock holdings from Torn API
2. Gets stock metadata (ticker, name) from price snapshots
3. Creates one `StockHoldingLot` record per buy transaction in your portfolio
4. Sets `shares_remaining` equal to `shares_total` for all lots
5. Uses the actual `bought_price` from your Torn transaction data
6. Uses the actual `time_bought` timestamp from your Torn transaction data
7. Sets `score_at_buy` and `recommendation_at_buy` to `null` (historical data not available)

### Prerequisites
- Database connection configured (MONGO_URI in .env)
- TORN_API_KEY in .env
- Node.js and dependencies installed

### How to Run

1. **Navigate to API directory:**
   ```bash
   cd API
   ```

2. **Ensure dependencies are installed:**
   ```bash
   npm install
   ```

3. **Compile TypeScript:**
   ```bash
   npm run build
   ```

4. **Run the script:**
   ```bash
   npx tsx scripts/initializeStockLots.ts
   ```

   Or using ts-node:
   ```bash
   npx ts-node scripts/initializeStockLots.ts
   ```

### Expected Output

The script will:
1. Connect to your database
2. Fetch your stock holdings from Torn
3. Display each lot being created with details
4. Show a summary of total lots and shares
5. Insert the lots into the database
6. Confirm completion

**Example Output:**
```
🔌 Connecting to database...
✅ Database connected

📊 Fetching current stock holdings from Torn API...
✅ Found 3 stock(s) in your portfolio

📝 Processing holdings...

  ✓ HRG: 10,000 shares @ $590.00 (bought 12/15/2024)
  ✓ PRN: 5,000 shares @ $601.10 (bought 12/20/2024)
  ✓ TSB: 2,000 shares @ $1139.50 (bought 1/2/2025)

📊 Summary:
  - Total lots to create: 3
  - Total shares: 17,000
  - Unique stocks: 3

💾 Saving lots to database...
✅ Successfully created 3 lot(s)!

📋 Next Steps:
  1. The FIFO tracking system is now initialized with your current holdings
  2. Future buys will create new lots automatically
  3. Future sells will match against these lots using FIFO
  4. Note: score_at_buy and recommendation_at_buy are null for these initial lots

✅ Migration complete!
```

### Safety Features

- **Duplicate Prevention:** The script checks if lots already exist and aborts if found
- **Validation:** Skips stocks with 0 shares or invalid data
- **Error Handling:** Provides clear error messages if something goes wrong

### Limitations

- `score_at_buy` and `recommendation_at_buy` will be `null` for all initial lots (historical recommendation data not available)
- If you sell these stocks later, the SELL transaction will show "null" for the buy recommendation
- This is expected and only affects pre-existing holdings

### When to Run

Run this script **once** after deploying the FIFO tracking system but **before** the background job starts running (or while it's stopped).

### Cleaning Up (If Needed)

If you need to re-run the script for any reason, first delete existing lots from MongoDB:

```javascript
// In MongoDB shell
db.stockholdinglots.deleteMany({});
```

Or using mongosh:
```bash
mongosh "mongodb://localhost:27017/wasteland_rpg"
db.stockholdinglots.deleteMany({});
```

### Troubleshooting

**Error: "TORN_API_KEY not found"**
- Ensure your `.env` file contains `TORN_API_KEY=your_key_here`

**Error: "Database connection failed"**
- Check your `MONGO_URI` in `.env`
- Ensure MongoDB is running

**Warning: "No price snapshot found for stock_id X"**
- The background job hasn't run yet to fetch stock data
- The script will use placeholder data (STOCK_X) and continue
- Ticker/name will be corrected on next background job run

**Warning: "Found X existing open lot(s)"**
- Script has already been run
- Delete existing lots first if you need to re-run

### After Running

Once the script completes successfully:
1. Your current holdings are now tracked as individual lots
2. The FIFO tracking system is ready to operate
3. You can start/resume the background job
4. Future transactions will be tracked automatically

### Support

If you encounter issues, check:
1. `.env` file has correct API key and database connection
2. Database is accessible
3. Stock price snapshots exist (background job has run at least once)
4. No existing lots in the database (if first run)
