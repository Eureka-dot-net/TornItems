/**
 * Migration Script: Initialize StockHoldingLot records from current holdings
 * 
 * This script creates StockHoldingLot records for all stocks you currently own.
 * Since we don't have historical buy recommendations, those fields will be null.
 * 
 * Run this ONCE before the FIFO tracking system starts operating.
 */

import dotenv from 'dotenv';
import axios from 'axios';
import { connectDB, closeDB } from '../src/config/db';
import { StockHoldingLot } from '../src/models/StockHoldingLot';
import { StockPriceSnapshot } from '../src/models/StockPriceSnapshot';

// Load environment variables
dotenv.config();

const API_KEY = process.env.TORN_API_KEY;

if (!API_KEY) {
  console.error('❌ TORN_API_KEY not found in environment variables');
  process.exit(1);
}

interface StockData {
  total_shares: number;
  transactions: {
    [key: string]: {
      shares: number;
      bought_price: number;
      time_bought: number;
    };
  };
}

interface StocksResponse {
  stocks: {
    [stockId: string]: StockData;
  };
}

async function initializeStockHoldingLots() {
  try {
    console.log('🔌 Connecting to database...');
    await connectDB();
    console.log('✅ Database connected\n');

    console.log('📊 Fetching current stock holdings from Torn API...');
    const response = await axios.get<StocksResponse>(
      `https://api.torn.com/v2/user?selections=stocks&key=${API_KEY}`
    );

    const stocks = response.data?.stocks;
    if (!stocks) {
      console.log('ℹ️  No stocks found in your portfolio');
      await closeDB();
      return;
    }

    console.log(`✅ Found ${Object.keys(stocks).length} stock(s) in your portfolio\n`);

    // Fetch stock metadata (ticker, name) from price snapshots
    const stockMetadata: { [stockId: number]: { ticker: string; name: string } } = {};
    const uniqueStockIds = Object.keys(stocks).map(id => parseInt(id, 10));

    for (const stockId of uniqueStockIds) {
      const latestSnapshot = await StockPriceSnapshot.findOne({ stock_id: stockId })
        .sort({ timestamp: -1 })
        .limit(1);
      
      if (latestSnapshot) {
        stockMetadata[stockId] = {
          ticker: latestSnapshot.ticker,
          name: latestSnapshot.name
        };
      } else {
        console.log(`⚠️  Warning: No price snapshot found for stock_id ${stockId}, using placeholder data`);
        stockMetadata[stockId] = {
          ticker: `STOCK_${stockId}`,
          name: `Unknown Stock ${stockId}`
        };
      }
    }

    const lotsToCreate = [];
    let totalShares = 0;

    console.log('📝 Processing holdings...\n');

    for (const [stockIdStr, stockData] of Object.entries(stocks)) {
      const stockId = parseInt(stockIdStr, 10);
      const totalStockShares = stockData.total_shares || 0;

      if (totalStockShares === 0) {
        console.log(`  ⏭️  Skipping stock_id ${stockId} (0 shares)`);
        continue;
      }

      const metadata = stockMetadata[stockId];
      const transactions = stockData.transactions || {};

      // Create one lot per transaction (each buy is tracked separately)
      for (const [txId, tx] of Object.entries(transactions)) {
        const shares = tx.shares || 0;
        const boughtPrice = tx.bought_price || 0;
        const timeBought = tx.time_bought ? new Date(tx.time_bought * 1000) : new Date();

        if (shares > 0 && boughtPrice > 0) {
          lotsToCreate.push({
            stock_id: stockId,
            ticker: metadata.ticker,
            name: metadata.name,
            shares_total: shares,
            shares_remaining: shares,
            bought_price: boughtPrice,
            score_at_buy: null,  // Unknown - not available historically
            recommendation_at_buy: null,  // Unknown - not available historically
            timestamp: timeBought,
            fully_sold: false
          });

          totalShares += shares;
          
          console.log(`  ✓ ${metadata.ticker}: ${shares.toLocaleString()} shares @ $${boughtPrice.toFixed(2)} (bought ${timeBought.toLocaleDateString()})`);
        }
      }
    }

    if (lotsToCreate.length === 0) {
      console.log('\nℹ️  No lots to create (portfolio is empty or has no transaction history)');
      await closeDB();
      return;
    }

    console.log(`\n📊 Summary:`);
    console.log(`  - Total lots to create: ${lotsToCreate.length}`);
    console.log(`  - Total shares: ${totalShares.toLocaleString()}`);
    console.log(`  - Unique stocks: ${uniqueStockIds.length}\n`);

    // Check if lots already exist
    const existingLotsCount = await StockHoldingLot.countDocuments({ fully_sold: false });
    if (existingLotsCount > 0) {
      console.log(`⚠️  WARNING: Found ${existingLotsCount} existing open lot(s) in the database.`);
      console.log('   This script should only be run once on a fresh database.');
      console.log('   Running it again will create duplicate lots.\n');
      console.log('❌ Aborting. If you want to re-run, first delete existing lots:');
      console.log('   db.stockholdinglots.deleteMany({})\n');
      await closeDB();
      return;
    }

    console.log('💾 Saving lots to database...');
    const result = await StockHoldingLot.insertMany(lotsToCreate);
    console.log(`✅ Successfully created ${result.length} lot(s)!\n`);

    console.log('📋 Next Steps:');
    console.log('  1. The FIFO tracking system is now initialized with your current holdings');
    console.log('  2. Future buys will create new lots automatically');
    console.log('  3. Future sells will match against these lots using FIFO');
    console.log('  4. Note: score_at_buy and recommendation_at_buy are null for these initial lots\n');

    await closeDB();
    console.log('✅ Migration complete!');

  } catch (error) {
    console.error('❌ Error during migration:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      if (axios.isAxiosError(error)) {
        console.error('   Response:', error.response?.data);
      }
    }
    await closeDB();
    process.exit(1);
  }
}

// Run the migration
initializeStockHoldingLots();
