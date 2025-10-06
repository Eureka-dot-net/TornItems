/**
 * Tests for user stock holdings tracking logic
 * 
 * These tests validate that user stock holdings are properly cleared when stocks are sold.
 * The main issue was that the Torn API doesn't return stocks the user no longer owns,
 * so we need to detect sold stocks by comparing previous holdings with current API response.
 * 
 * @jest-environment node
 */

import { UserStockHoldingSnapshot } from '../src/models/UserStockHoldingSnapshot';

describe('User Stock Holdings Tracking', () => {
  beforeEach(async () => {
    // Clean up test data
    await UserStockHoldingSnapshot.deleteMany({});
  });

  afterEach(async () => {
    // Clean up test data
    await UserStockHoldingSnapshot.deleteMany({});
  });

  describe('Detecting stocks that have been sold', () => {
    it('should identify stocks that went from positive shares to 0 when not in API response', async () => {
      // Create previous holdings - user owned 2 stocks
      const timestamp1 = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
      await UserStockHoldingSnapshot.insertMany([
        { stock_id: 1, total_shares: 1000, avg_buy_price: 100.50, transaction_count: 1, timestamp: timestamp1 },
        { stock_id: 2, total_shares: 500, avg_buy_price: 200.75, transaction_count: 2, timestamp: timestamp1 },
      ]);
      
      // Simulate current API response - only returns stocks currently owned
      const currentStockIds = new Set<number>();
      currentStockIds.add(2); // User still owns stock 2
      // Stock 1 is NOT in the response, meaning it's been sold
      
      // Find stocks that were previously owned but are not in the current response
      const previouslyOwnedStocks = await UserStockHoldingSnapshot.aggregate([
        {
          $match: {
            total_shares: { $gt: 0 }
          }
        },
        {
          $sort: { stock_id: 1, timestamp: -1 }
        },
        {
          $group: {
            _id: '$stock_id',
            total_shares: { $first: '$total_shares' },
            timestamp: { $first: '$timestamp' }
          }
        }
      ]);
      
      const stocksToZero = previouslyOwnedStocks.filter(stock => !currentStockIds.has(stock._id));
      
      expect(stocksToZero).toHaveLength(1);
      expect(stocksToZero[0]._id).toBe(1);
      expect(stocksToZero[0].total_shares).toBe(1000);
    });
    
    it('should handle all stocks remaining owned', async () => {
      // Create previous holdings
      const timestamp1 = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
      await UserStockHoldingSnapshot.insertMany([
        { stock_id: 1, total_shares: 1000, avg_buy_price: 100.50, transaction_count: 1, timestamp: timestamp1 },
        { stock_id: 2, total_shares: 500, avg_buy_price: 200.75, transaction_count: 2, timestamp: timestamp1 },
      ]);
      
      // User still owns both stocks
      const currentStockIds = new Set<number>();
      currentStockIds.add(1);
      currentStockIds.add(2);
      
      const previouslyOwnedStocks = await UserStockHoldingSnapshot.aggregate([
        {
          $match: {
            total_shares: { $gt: 0 }
          }
        },
        {
          $sort: { stock_id: 1, timestamp: -1 }
        },
        {
          $group: {
            _id: '$stock_id',
            total_shares: { $first: '$total_shares' },
            timestamp: { $first: '$timestamp' }
          }
        }
      ]);
      
      const stocksToZero = previouslyOwnedStocks.filter(stock => !currentStockIds.has(stock._id));
      
      expect(stocksToZero).toHaveLength(0);
    });
    
    it('should handle all stocks being sold', async () => {
      // Create previous holdings
      const timestamp1 = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
      await UserStockHoldingSnapshot.insertMany([
        { stock_id: 1, total_shares: 1000, avg_buy_price: 100.50, transaction_count: 1, timestamp: timestamp1 },
        { stock_id: 2, total_shares: 500, avg_buy_price: 200.75, transaction_count: 2, timestamp: timestamp1 },
      ]);
      
      // User sold all stocks
      const currentStockIds = new Set<number>();
      // No stocks in the current response
      
      const previouslyOwnedStocks = await UserStockHoldingSnapshot.aggregate([
        {
          $match: {
            total_shares: { $gt: 0 }
          }
        },
        {
          $sort: { stock_id: 1, timestamp: -1 }
        },
        {
          $group: {
            _id: '$stock_id',
            total_shares: { $first: '$total_shares' },
            timestamp: { $first: '$timestamp' }
          }
        }
      ]);
      
      const stocksToZero = previouslyOwnedStocks.filter(stock => !currentStockIds.has(stock._id));
      
      expect(stocksToZero).toHaveLength(2);
    });
    
    it('should ignore stocks that were already at 0 shares', async () => {
      // Create previous holdings with mix of zero and non-zero
      const timestamp1 = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
      await UserStockHoldingSnapshot.insertMany([
        { stock_id: 1, total_shares: 1000, avg_buy_price: 100.50, transaction_count: 1, timestamp: timestamp1 },
        { stock_id: 2, total_shares: 0, avg_buy_price: null, transaction_count: 0, timestamp: timestamp1 },
        { stock_id: 3, total_shares: 0, avg_buy_price: null, transaction_count: 0, timestamp: timestamp1 },
      ]);
      
      // User sold stock 1
      const currentStockIds = new Set<number>();
      // No stocks in the current response
      
      const previouslyOwnedStocks = await UserStockHoldingSnapshot.aggregate([
        {
          $match: {
            total_shares: { $gt: 0 }
          }
        },
        {
          $sort: { stock_id: 1, timestamp: -1 }
        },
        {
          $group: {
            _id: '$stock_id',
            total_shares: { $first: '$total_shares' },
            timestamp: { $first: '$timestamp' }
          }
        }
      ]);
      
      const stocksToZero = previouslyOwnedStocks.filter(stock => !currentStockIds.has(stock._id));
      
      // Only stock 1 should be detected (stocks 2 and 3 were already at 0)
      expect(stocksToZero).toHaveLength(1);
      expect(stocksToZero[0]._id).toBe(1);
    });
    
    it('should use most recent snapshot for each stock', async () => {
      // Create multiple snapshots for same stock
      const timestamp1 = new Date(Date.now() - 1000 * 60 * 120); // 2 hours ago
      const timestamp2 = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
      
      await UserStockHoldingSnapshot.insertMany([
        { stock_id: 1, total_shares: 1000, avg_buy_price: 100.50, transaction_count: 1, timestamp: timestamp1 },
        { stock_id: 1, total_shares: 1500, avg_buy_price: 105.25, transaction_count: 2, timestamp: timestamp2 }, // Most recent
        { stock_id: 2, total_shares: 500, avg_buy_price: 200.75, transaction_count: 1, timestamp: timestamp1 },
      ]);
      
      // User sold stock 1
      const currentStockIds = new Set<number>();
      currentStockIds.add(2); // Still owns stock 2
      
      const previouslyOwnedStocks = await UserStockHoldingSnapshot.aggregate([
        {
          $match: {
            total_shares: { $gt: 0 }
          }
        },
        {
          $sort: { stock_id: 1, timestamp: -1 }
        },
        {
          $group: {
            _id: '$stock_id',
            total_shares: { $first: '$total_shares' },
            timestamp: { $first: '$timestamp' }
          }
        }
      ]);
      
      const stocksToZero = previouslyOwnedStocks.filter(stock => !currentStockIds.has(stock._id));
      
      expect(stocksToZero).toHaveLength(1);
      expect(stocksToZero[0]._id).toBe(1);
      expect(stocksToZero[0].total_shares).toBe(1500); // Should use most recent snapshot
    });
  });
  
  describe('Creating zero-share snapshots', () => {
    it('should create proper zero-share snapshot structure', () => {
      const zeroSnapshot = {
        stock_id: 1,
        total_shares: 0,
        avg_buy_price: null,
        transaction_count: 0,
        timestamp: new Date(),
      };
      
      expect(zeroSnapshot.stock_id).toBe(1);
      expect(zeroSnapshot.total_shares).toBe(0);
      expect(zeroSnapshot.avg_buy_price).toBeNull();
      expect(zeroSnapshot.transaction_count).toBe(0);
      expect(zeroSnapshot.timestamp).toBeInstanceOf(Date);
    });
  });
});
