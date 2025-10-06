#!/usr/bin/env node

/**
 * Script to populate the MarketWatchlistItem collection with sample items
 * 
 * Usage:
 *   node populate-watchlist.js
 * 
 * This will add Xanax and Erotic DVD to the watchlist with the configured thresholds.
 */

require('dotenv').config();
const mongoose = require('mongoose');

const watchlistSchema = new mongoose.Schema({
  itemId: { type: Number, required: true, unique: true, index: true },
  name: { type: String, required: true },
  alert_below: { type: Number, required: true },
  lastAlertPrice: { type: Number, default: null },
  lastAlertTimestamp: { type: Date, default: null },
});

const MarketWatchlistItem = mongoose.model('MarketWatchlistItem', watchlistSchema);

const watchlistItems = [
  { itemId: 18, name: 'Xanax', alert_below: 830000 },
  { itemId: 23, name: 'Erotic DVD', alert_below: 4600000 },
];

async function populateWatchlist() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/wasteland_rpg';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Insert watchlist items
    console.log('\nPopulating watchlist...');
    for (const item of watchlistItems) {
      try {
        const result = await MarketWatchlistItem.findOneAndUpdate(
          { itemId: item.itemId },
          item,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        console.log(`✅ Added/Updated: ${item.name} (ID: ${item.itemId}) - Alert below $${item.alert_below.toLocaleString()}`);
      } catch (error) {
        console.error(`❌ Error adding ${item.name}:`, error.message);
      }
    }

    // Display current watchlist
    console.log('\nCurrent watchlist:');
    const allItems = await MarketWatchlistItem.find({}).sort({ itemId: 1 });
    allItems.forEach(item => {
      console.log(`  - ${item.name} (ID: ${item.itemId}): Alert below $${item.alert_below.toLocaleString()}`);
    });

    console.log('\n✅ Watchlist population complete!');
    console.log('\nTo add more items, either:');
    console.log('1. Edit this script and add to the watchlistItems array');
    console.log('2. Use MongoDB Compass/Shell to insert documents manually');
    console.log('3. Create an API endpoint to manage watchlist items\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

populateWatchlist();
