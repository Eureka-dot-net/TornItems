#!/usr/bin/env node
/**
 * Migration Script: Initialize Jobs Collection
 * 
 * This script creates the initial job records in the database.
 * Run this once to set up the jobs collection before using the job control commands.
 * 
 * Usage:
 *   node scripts/initializeJobs.js
 * 
 * Or with ts-node:
 *   npx ts-node scripts/initializeJobs.ts
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Job } from '../src/models/Job';
import { logInfo, logError } from '../src/utils/logger';

// Load environment variables
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/wasteland_rpg';

const JOBS = [
  {
    name: 'fetch_torn_items',
    description: 'Fetches the complete Torn items catalog',
    enabled: true,
    cronSchedule: '0 3 * * *', // Daily at 3 AM
  },
  {
    name: 'fetch_city_shop_stock',
    description: 'Fetches city shop stock levels',
    enabled: true,
    cronSchedule: '* * * * *', // Every minute
  },
  {
    name: 'fetch_foreign_stock',
    description: 'Fetches foreign stock levels from travel destinations',
    enabled: true,
    cronSchedule: '* * * * *', // Every minute
  },
  {
    name: 'update_monitored_items',
    description: 'Updates the list of items to monitor based on sales velocity',
    enabled: true,
    cronSchedule: '*/1 * * * *', // Every minute
  },
  {
    name: 'aggregate_market_history',
    description: 'Aggregates market snapshot data into daily summaries',
    enabled: true,
    cronSchedule: process.env.HISTORY_AGGREGATION_CRON || '*/30 * * * *', // Every 30 minutes (default)
  },
  {
    name: 'fetch_stock_prices',
    description: 'Fetches current stock market prices and user holdings',
    enabled: true,
    cronSchedule: '* * * * *', // Every minute
  },
  {
    name: 'monitor_market_prices',
    description: 'Monitors market prices for user watchlist items and sends alerts',
    enabled: true,
    cronSchedule: '*/30 * * * * *', // Every 30 seconds
  },
  {
    name: 'adaptive_market_snapshots',
    description: 'Adaptively fetches market snapshots based on item activity',
    enabled: true,
    cronSchedule: 'self-scheduled', // Self-scheduling based on item activity
  },
];

async function initializeJobs(): Promise<void> {
  try {
    logInfo('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    logInfo('Connected to MongoDB');

    logInfo('Initializing jobs...');
    
    for (const jobData of JOBS) {
      const existingJob = await Job.findOne({ name: jobData.name });
      
      if (existingJob) {
        logInfo(`Job "${jobData.name}" already exists, skipping...`);
      } else {
        await Job.create(jobData);
        logInfo(`Created job: ${jobData.name}`);
      }
    }

    logInfo('Job initialization completed successfully!');
    logInfo(`Total jobs in database: ${await Job.countDocuments()}`);
    
    // Display all jobs
    const allJobs = await Job.find().sort({ name: 1 });
    logInfo('\nAll jobs:');
    for (const job of allJobs) {
      logInfo(`  - ${job.name}: ${job.enabled ? '✅ ENABLED' : '❌ DISABLED'} (${job.cronSchedule})`);
    }

  } catch (error) {
    logError('Failed to initialize jobs', error instanceof Error ? error : new Error(String(error)));
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    logInfo('Disconnected from MongoDB');
  }
}

// Run the script
initializeJobs();
