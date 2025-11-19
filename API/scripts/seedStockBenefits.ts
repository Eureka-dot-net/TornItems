/**
 * Script to seed stock benefit data
 * Run with: npx ts-node scripts/seedStockBenefits.ts
 */

import { StockBenefit } from '../src/models/StockBenefit';
import { connectDB } from '../src/config/db';

// Stock benefit data based on the problem statement
const STOCK_BENEFITS = [
  { stock_id: 6, ticker: 'ASS', name: 'Asian Appreciation Stocks', shares: 1000000, type: 'Active', frequency: 7, description: '1x Six Pack of Alcohol', item_id: 817 },
  { stock_id: 20, ticker: 'BAG', name: 'Big Al\'s Gun Shop', shares: 3000000, type: 'Active', frequency: 7, description: '1x Ammunition Pack (Special Ammo)', item_id: null },
  { stock_id: 7, ticker: 'CNC', name: 'Crude & Co', shares: 7500000, type: 'Active', frequency: 31, description: '$80,000,000', item_id: null },
  { stock_id: 11, ticker: 'EWM', name: 'Eaglewood Mercenary', shares: 1000000, type: 'Active', frequency: 7, description: '1x Box of Grenades', item_id: 364 },
  { stock_id: 12, ticker: 'ELT', name: 'Elites Ltd', shares: 5000000, type: 'Passive', frequency: null, description: '10% Home Upgrade Discount (Property)', item_id: null },
  { stock_id: 13, ticker: 'EVL', name: 'Evil Ducks Recruiting', shares: 100000, type: 'Active', frequency: 7, description: '1000 Happy', item_id: null },
  { stock_id: 14, ticker: 'FHG', name: 'Feathery Hotels Group', shares: 2000000, type: 'Active', frequency: 7, description: '1x Feathery Hotel Coupon', item_id: 367 },
  { stock_id: 15, ticker: 'GRN', name: 'Grain', shares: 500000, type: 'Active', frequency: 31, description: '$4,000,000', item_id: null },
  { stock_id: 16, ticker: 'CBD', name: 'Herbal and High', shares: 350000, type: 'Active', frequency: 7, description: '50 Nerve', item_id: null },
  { stock_id: 17, ticker: 'HRG', name: 'Human Resources Group', shares: 10000000, type: 'Active', frequency: 31, description: '1x Random Property', item_id: null },
  { stock_id: 18, ticker: 'IIL', name: 'I Industries Ltd', shares: 1000000, type: 'Passive', frequency: null, description: '50% Virus Coding Time Reduction', item_id: null },
  { stock_id: 19, ticker: 'IOU', name: 'Insured On Us', shares: 3000000, type: 'Active', frequency: 31, description: '$12,000,000', item_id: null },
  { stock_id: 26, ticker: 'IST', name: 'International School TC', shares: 100000, type: 'Passive', frequency: null, description: 'Free Education Courses', item_id: null },
  { stock_id: 21, ticker: 'LAG', name: 'Legal Aliens Group', shares: 750000, type: 'Active', frequency: 7, description: '1x Lawyer Business Card', item_id: null },
  { stock_id: 22, ticker: 'LOS', name: 'Logistics', shares: 7500000, type: 'Passive', frequency: null, description: '25% Boost to mission credits and money earned', item_id: null },
  { stock_id: 23, ticker: 'LSC', name: 'Lucky Shots Casino', shares: 500000, type: 'Active', frequency: 7, description: '1x Lottery Voucher', item_id: 369 },
  { stock_id: 27, ticker: 'MCS', name: 'Mc Smoogle Corp', shares: 350000, type: 'Active', frequency: 7, description: '100 Energy', item_id: null },
  { stock_id: 28, ticker: 'MSG', name: 'Messaging Inc', shares: 300000, type: 'Passive', frequency: null, description: 'Free Classified Advertising (Newspaper)', item_id: null },
  { stock_id: 24, ticker: 'MUN', name: 'Munster Beverage Corp.', shares: 5000000, type: 'Active', frequency: 7, description: '1x Six Pack of Energy Drink', item_id: 818 },
  { stock_id: 29, ticker: 'PRN', name: 'Porno Groove Magazine', shares: 1000000, type: 'Active', frequency: 7, description: '1x Erotic DVD', item_id: 366 },
  { stock_id: 30, ticker: 'PTS', name: 'Points Building Society', shares: 10000000, type: 'Active', frequency: 7, description: '100 Points', item_id: null },
  { stock_id: 31, ticker: 'SYM', name: 'Symbiotic Ltd', shares: 500000, type: 'Active', frequency: 7, description: '1x Drug Pack', item_id: 370 },
  { stock_id: 1, ticker: 'SYS', name: 'Syscore MFG', shares: 3000000, type: 'Passive', frequency: null, description: 'Advanced Firewall', item_id: null },
  { stock_id: 2, ticker: 'TCP', name: 'TC Media Productions', shares: 1000000, type: 'Passive', frequency: null, description: 'Company Sales Boost', item_id: null },
  { stock_id: 3, ticker: 'TMI', name: 'TC Music Industries', shares: 6000000, type: 'Active', frequency: 31, description: '$25,000,000', item_id: null },
  { stock_id: 4, ticker: 'TGP', name: 'The Gentlemen\'s Club', shares: 2500000, type: 'Passive', frequency: null, description: 'Company Advertising Boost', item_id: null },
  { stock_id: 8, ticker: 'TCT', name: 'Torn City Times', shares: 100000, type: 'Active', frequency: 31, description: '$1,000,000', item_id: null },
  { stock_id: 5, ticker: 'TSB', name: 'The Torn Strip Bank', shares: 3000000, type: 'Active', frequency: 31, description: '$50,000,000', item_id: null },
  { stock_id: 9, ticker: 'TCC', name: 'Torn Clothing Company', shares: 7500000, type: 'Active', frequency: 31, description: '1x Clothing Cache', item_id: null },
  { stock_id: 10, ticker: 'THS', name: 'Torn & Hospitalized Ltd.', shares: 150000, type: 'Active', frequency: 7, description: '1x Box of Medical Supplies', item_id: 365 },
  { stock_id: 32, ticker: 'TCI', name: 'Torn City Investments', shares: 1500000, type: 'Passive', frequency: null, description: '10% Bank Interest Bonus', item_id: null },
  { stock_id: 33, ticker: 'TCM', name: 'Torn City Motors', shares: 1000000, type: 'Passive', frequency: null, description: '10% Racing Skill Boost', item_id: null },
  { stock_id: 25, ticker: 'WSU', name: 'West Side University', shares: 1000000, type: 'Passive', frequency: null, description: '10% Education Course Time Reduction', item_id: null },
  { stock_id: 34, ticker: 'WLT', name: 'White Line Travel', shares: 9000000, type: 'Passive', frequency: null, description: 'Private Jet Access (Travel)', item_id: null },
  { stock_id: 35, ticker: 'YAZ', name: 'Yazoo Ltd', shares: 1000000, type: 'Passive', frequency: null, description: 'Free Banner Advertising (Newspaper)', item_id: null },
];

async function seedStockBenefits() {
  try {
    await connectDB();
    console.log('Connected to database');

    console.log('Upserting stock benefit data...');

    const bulkOps = STOCK_BENEFITS.map(benefit => ({
      updateOne: {
        filter: { stock_id: benefit.stock_id },
        update: {
          $set: {
            stock_id: benefit.stock_id,
            ticker: benefit.ticker,
            name: benefit.name,
            benefit_requirement: benefit.shares,
            benefit_type: benefit.type,
            benefit_frequency: benefit.frequency,
            benefit_description: benefit.description,
            benefit_item_id: benefit.item_id,
          },
        },
        upsert: true,
      },
    }));

    const result = await StockBenefit.bulkWrite(bulkOps);

    console.log(`\nSummary:`);
    console.log(`  Stocks upserted: ${result.upsertedCount}`);
    console.log(`  Stocks modified: ${result.modifiedCount}`);
    console.log(`  Total stocks processed: ${STOCK_BENEFITS.length}`);

    console.log('\n✅ Stock benefit data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding stock benefits:', error);
    process.exit(1);
  }
}

// Run the seed function
seedStockBenefits();

