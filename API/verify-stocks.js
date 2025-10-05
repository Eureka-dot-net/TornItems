#!/usr/bin/env node

/**
 * Verification script for the Stock Tracking System
 * 
 * This script creates sample stock data and tests the recommendations endpoint
 * Run with: node verify-stocks.js
 */

const mongoose = require('mongoose');

// Define the schema inline for simplicity
const StockPriceSnapshotSchema = new mongoose.Schema({
  ticker: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  timestamp: { type: Date, required: true, default: Date.now },
});

StockPriceSnapshotSchema.index({ ticker: 1, timestamp: -1 });
StockPriceSnapshotSchema.index({ timestamp: 1 }, { expireAfterSeconds: 14 * 24 * 60 * 60 });

const StockPriceSnapshot = mongoose.model('StockPriceSnapshot', StockPriceSnapshotSchema);

async function createTestData() {
  console.log('Creating test stock data...');
  
  const now = new Date();
  const testData = [];
  
  // Stock 1: Declining price (STRONG BUY)
  for (let i = 0; i < 8; i++) {
    const timestamp = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const price = 1500 + (i * 30); // Price increases as we go back in time (so it's declining now)
    testData.push({
      ticker: 'FHG',
      name: 'Feathery Hotels Group',
      price: price,
      timestamp: timestamp,
    });
  }
  
  // Stock 2: Rising price (SELL)
  for (let i = 0; i < 8; i++) {
    const timestamp = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const price = 2200 - (i * 20); // Price decreases as we go back in time (so it's rising now)
    testData.push({
      ticker: 'SYS',
      name: 'Syscore MFG',
      price: price,
      timestamp: timestamp,
    });
  }
  
  // Stock 3: Stable price (HOLD)
  for (let i = 0; i < 8; i++) {
    const timestamp = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const price = 1000 + (Math.random() * 10 - 5); // Small random fluctuations
    testData.push({
      ticker: 'TSB',
      name: 'Torn & Shanghai Banking',
      price: price,
      timestamp: timestamp,
    });
  }
  
  await StockPriceSnapshot.insertMany(testData);
  console.log(`Created ${testData.length} test records for 3 stocks`);
}

async function testRecommendations() {
  console.log('\nTesting recommendations calculation...');
  
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const stockData = await StockPriceSnapshot.aggregate([
    {
      $match: {
        timestamp: { $gte: sevenDaysAgo }
      }
    },
    {
      $sort: { ticker: 1, timestamp: -1 }
    },
    {
      $group: {
        _id: '$ticker',
        name: { $first: '$name' },
        currentPrice: { $first: '$price' },
        oldestPrice: { $last: '$price' },
        prices: { $push: '$price' }
      }
    }
  ]);
  
  console.log(`\nFound ${stockData.length} stocks with 7-day history:`);
  
  for (const stock of stockData) {
    const change_7d_pct = ((stock.currentPrice / stock.oldestPrice) - 1) * 100;
    
    // Calculate volatility as percentage (standard deviation of daily returns)
    const returns = [];
    for (let i = 1; i < stock.prices.length; i++) {
      const dailyReturn = ((stock.prices[i] / stock.prices[i - 1]) - 1) * 100;
      returns.push(dailyReturn);
    }
    
    let volatility_7d_pct = 0;
    if (returns.length > 0) {
      const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
      volatility_7d_pct = Math.sqrt(variance);
    }
    
    // Guard against zero volatility
    const vol = Math.max(volatility_7d_pct, 0.0001);
    const score = -change_7d_pct / vol;
    
    let recommendation = 'HOLD';
    if (score >= 3) recommendation = 'STRONG_BUY';
    else if (score >= 1) recommendation = 'BUY';
    else if (score > -1) recommendation = 'HOLD';
    else if (score > -3) recommendation = 'SELL';
    else recommendation = 'STRONG_SELL';
    
    console.log(`\n${stock._id} (${stock.name}):`);
    console.log(`  Current: $${stock.currentPrice.toFixed(2)}`);
    console.log(`  7d ago:  $${stock.oldestPrice.toFixed(2)}`);
    console.log(`  Change:  ${change_7d_pct.toFixed(2)}%`);
    console.log(`  Volatility: ${volatility_7d_pct.toFixed(2)}%`);
    console.log(`  Score:   ${score.toFixed(2)}`);
    console.log(`  Recommendation: ${recommendation}`);
  }
}

async function cleanup() {
  console.log('\nCleaning up test data...');
  await StockPriceSnapshot.deleteMany({ ticker: { $in: ['FHG', 'SYS', 'TSB'] } });
  console.log('Test data cleaned up');
}

async function main() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/torn_items';
    console.log(`Connecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');
    
    // Clean up any existing test data
    await cleanup();
    
    // Create test data
    await createTestData();
    
    // Test the calculations
    await testRecommendations();
    
    // Clean up
    await cleanup();
    
    console.log('\n✅ Verification complete!');
    console.log('\nTo test the actual API endpoint, run:');
    console.log('  npm start');
    console.log('  curl http://localhost:3000/api/stocks/recommendations');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

main();
