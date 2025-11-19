/**
 * Script to seed stock benefit data
 * Run with: npx ts-node scripts/seedStockBenefits.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { StockPriceSnapshot } from '../src/models/StockPriceSnapshot';

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tornitems';

// Stock benefit data based on the problem statement
const STOCK_BENEFITS = [
  { ticker: 'ASS', shares: 1000000, type: 'Active', frequency: 7, description: '1x Six Pack of Alcohol', item_id: 817 },
  { ticker: 'BAG', shares: 3000000, type: 'Active', frequency: 7, description: '1x Ammunition Pack (Special Ammo)', item_id: null }, // No itemId provided
  { ticker: 'CNC', shares: 7500000, type: 'Active', frequency: 31, description: '$80,000,000', item_id: null },
  { ticker: 'EWM', shares: 1000000, type: 'Active', frequency: 7, description: '1x Box of Grenades', item_id: 364 },
  { ticker: 'ELT', shares: 5000000, type: 'Passive', frequency: null, description: '10% Home Upgrade Discount (Property)', item_id: null },
  { ticker: 'EVL', shares: 100000, type: 'Active', frequency: 7, description: '1000 Happy', item_id: null },
  { ticker: 'FHG', shares: 2000000, type: 'Active', frequency: 7, description: '1x Feathery Hotel Coupon', item_id: 367 },
  { ticker: 'GRN', shares: 500000, type: 'Active', frequency: 31, description: '$4,000,000', item_id: null },
  { ticker: 'CBD', shares: 350000, type: 'Active', frequency: 7, description: '50 Nerve', item_id: null },
  { ticker: 'HRG', shares: 10000000, type: 'Active', frequency: 31, description: '1x Random Property', item_id: null },
  { ticker: 'IIL', shares: 1000000, type: 'Passive', frequency: null, description: '50% Virus Coding Time Reduction', item_id: null },
  { ticker: 'IOU', shares: 3000000, type: 'Active', frequency: 31, description: '$12,000,000', item_id: null },
  { ticker: 'IST', shares: 100000, type: 'Passive', frequency: null, description: 'Free Education Courses', item_id: null },
  { ticker: 'LAG', shares: 750000, type: 'Active', frequency: 7, description: '1x Lawyer Business Card', item_id: null },
  { ticker: 'LOS', shares: 7500000, type: 'Passive', frequency: null, description: '25% Boost to mission credits and money earned', item_id: null },
  { ticker: 'LSC', shares: 500000, type: 'Active', frequency: 7, description: '1x Lottery Voucher', item_id: 369 },
  { ticker: 'MCS', shares: 350000, type: 'Active', frequency: 7, description: '100 Energy', item_id: null },
  { ticker: 'MSG', shares: 300000, type: 'Passive', frequency: null, description: 'Free Classified Advertising (Newspaper)', item_id: null },
  { ticker: 'MUN', shares: 5000000, type: 'Active', frequency: 7, description: '1x Six Pack of Energy Drink', item_id: 818 },
  { ticker: 'PRN', shares: 1000000, type: 'Active', frequency: 7, description: '1x Erotic DVD', item_id: 366 },
  { ticker: 'PTS', shares: 10000000, type: 'Active', frequency: 7, description: '100 Points', item_id: null },
  { ticker: 'SYM', shares: 500000, type: 'Active', frequency: 7, description: '1x Drug Pack', item_id: 370 },
  { ticker: 'SYS', shares: 3000000, type: 'Passive', frequency: null, description: 'Advanced Firewall', item_id: null },
  { ticker: 'TCP', shares: 1000000, type: 'Passive', frequency: null, description: 'Company Sales Boost', item_id: null },
  { ticker: 'TMI', shares: 6000000, type: 'Active', frequency: 31, description: '$25,000,000', item_id: null },
  { ticker: 'TGP', shares: 2500000, type: 'Passive', frequency: null, description: 'Company Advertising Boost', item_id: null },
  { ticker: 'TCT', shares: 100000, type: 'Active', frequency: 31, description: '$1,000,000', item_id: null },
  { ticker: 'TSB', shares: 3000000, type: 'Active', frequency: 31, description: '$50,000,000', item_id: null },
  { ticker: 'TCC', shares: 7500000, type: 'Active', frequency: 31, description: '1x Clothing Cache', item_id: null },
  { ticker: 'THS', shares: 150000, type: 'Active', frequency: 7, description: '1x Box of Medical Supplies', item_id: 365 },
  { ticker: 'TCI', shares: 1500000, type: 'Passive', frequency: null, description: '10% Bank Interest Bonus', item_id: null },
  { ticker: 'TCM', shares: 1000000, type: 'Passive', frequency: null, description: '10% Racing Skill Boost', item_id: null },
  { ticker: 'WSU', shares: 1000000, type: 'Passive', frequency: null, description: '10% Education Course Time Reduction', item_id: null },
  { ticker: 'WLT', shares: 9000000, type: 'Passive', frequency: null, description: 'Private Jet Access (Travel)', item_id: null },
  { ticker: 'YAZ', shares: 1000000, type: 'Passive', frequency: null, description: 'Free Banner Advertising (Newspaper)', item_id: null },
];

async function seedStockBenefits() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('Updating stock benefit data...');

    let updated = 0;
    let notFound = 0;

    for (const benefit of STOCK_BENEFITS) {
      // Find all snapshots for this ticker
      const result = await StockPriceSnapshot.updateMany(
        { ticker: benefit.ticker },
        {
          $set: {
            benefit_requirement: benefit.shares,
            benefit_type: benefit.type,
            benefit_frequency: benefit.frequency,
            benefit_description: benefit.description,
            benefit_item_id: benefit.item_id,
          },
        }
      );

      if (result.matchedCount > 0) {
        updated++;
        console.log(`Updated ${result.matchedCount} snapshots for ${benefit.ticker}`);
      } else {
        notFound++;
        console.log(`Warning: No snapshots found for ${benefit.ticker}`);
      }
    }

    console.log(`\nSummary:`);
    console.log(`  Stocks updated: ${updated}`);
    console.log(`  Stocks not found: ${notFound}`);
    console.log(`  Total stocks processed: ${STOCK_BENEFITS.length}`);

    console.log('\nStock benefit data seeded successfully!');
  } catch (error) {
    console.error('Error seeding stock benefits:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seed function
seedStockBenefits();
