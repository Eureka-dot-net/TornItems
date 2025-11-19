# Stock Benefits Database Seed Instructions

This document provides instructions for seeding the database with stock benefit information.

## Prerequisites

- MongoDB connection configured (check your `.env` file for `MONGODB_URI`)
- Node.js and npm installed
- TypeScript installed (`npm install -g ts-node typescript`)

## Running the Seed Script

### On Windows (PowerShell or Command Prompt)

```powershell
# Navigate to the API directory
cd API

# Run the seed script
npx ts-node scripts/seedStockBenefits.ts
```

### On Linux/Mac

```bash
# Navigate to the API directory
cd API

# Run the seed script
npx ts-node scripts/seedStockBenefits.ts
```

## What the Script Does

The `seedStockBenefits.ts` script will:

1. Connect to your MongoDB database
2. Update all existing `StockPriceSnapshot` records with benefit information for 35 stocks
3. Add the following fields to each stock:
   - `benefit_requirement`: Number of shares needed for first benefit block
   - `benefit_type`: 'Active' or 'Passive'
   - `benefit_frequency`: Days between benefits (7, 31, or null for passive)
   - `benefit_description`: Description of the benefit (e.g., "1x Six Pack of Alcohol" or "$80,000,000")
   - `benefit_item_id`: Item ID if the benefit is an item (for market price lookup)

## Expected Output

You should see output similar to:

```
Connecting to MongoDB...
Connected to MongoDB
Updating stock benefit data...
Updated 5 snapshots for ASS
Updated 5 snapshots for BAG
Updated 5 snapshots for CNC
...
Summary:
  Stocks updated: 35
  Stocks not found: 0
  Total stocks processed: 35

Stock benefit data seeded successfully!
Database connection closed
```

## Verification

After running the script, you can verify the data by:

1. Checking the MongoDB database directly
2. Calling the `/api/stocks/recommendations` endpoint and verifying the new fields are present
3. Checking the UI at the Recommendations page to see the new columns populated

## Troubleshooting

### "No snapshots found for [TICKER]"

This means there are no `StockPriceSnapshot` records in the database yet. This is normal if:
- The background fetcher hasn't run yet
- The database is empty/new

**Solution**: Wait for the background fetcher to run (it runs every minute) or manually call the stock price fetch endpoint.

### Connection Error

Make sure your `MONGODB_URI` in the `.env` file is correct and MongoDB is running.

### TypeScript Errors

If you get TypeScript compilation errors, make sure all dependencies are installed:

```bash
npm install
```

## Re-running the Script

The script is safe to run multiple times. It will update existing records with the benefit information without creating duplicates.

## Stock Benefits Data

The script includes benefit data for 35 stocks:

- **Active Benefits** (provide items or money on a schedule):
  - 7-day frequency: ASS, BAG, EWM, EVL, FHG, CBD, LAG, LSC, MCS, MUN, PRN, PTS, SYM, THS
  - 31-day frequency: CNC, GRN, HRG, IOU, TMI, TCT, TSB, TCC

- **Passive Benefits** (permanent effects):
  - ELT, IIL, IST, LOS, MSG, SYS, TCP, TGP, TCI, TCM, WSU, WLT, YAZ

Each stock block requires double the shares of the previous block (1x, 2x, 4x, 8x, etc.)
