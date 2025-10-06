import request from 'supertest';
import { app } from '../src/app';
import { StockTransactionHistory } from '../src/models/StockTransactionHistory';
import { StockHoldingLot } from '../src/models/StockHoldingLot';
import mongoose from 'mongoose';

describe('Stock Profit API', () => {
  describe('GET /api/stocks/profit', () => {
    beforeEach(async () => {
      // Clear the collections before each test
      await StockTransactionHistory.deleteMany({});
      await StockHoldingLot.deleteMany({});
    });

    it('should return empty array when no transactions exist', async () => {
      const response = await request(app)
        .get('/api/stocks/profit')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all transactions sorted by timestamp descending', async () => {
      // Create test holding lots and transactions
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      // Create buy lots
      const lot1 = await StockHoldingLot.create({
        stock_id: 22,
        ticker: 'HRG',
        name: 'Helayne Robertson Group',
        shares_total: 10000,
        shares_remaining: 0,
        bought_price: 590.00,
        score_at_buy: 5.23,
        recommendation_at_buy: 'STRONG_BUY',
        timestamp: twoHoursAgo,
        fully_sold: true,
      });

      const lot2 = await StockHoldingLot.create({
        stock_id: 18,
        ticker: 'PRN',
        name: 'Printing Paperwork News',
        shares_total: 15000,
        shares_remaining: 0,
        bought_price: 601.10,
        score_at_buy: 4.82,
        recommendation_at_buy: 'STRONG_BUY',
        timestamp: oneHourAgo,
        fully_sold: true,
      });

      // Create sell transactions
      await StockTransactionHistory.create([
        {
          stock_id: 18,
          ticker: 'PRN',
          name: 'Printing Paperwork News',
          timestamp: now,
          action: 'SELL',
          shares_sold: 15000,
          sell_price: 610.50,
          bought_price: 601.10,
          profit_per_share: 9.40,
          total_profit: 141000,
          score_at_buy: 4.82,
          recommendation_at_buy: 'STRONG_BUY',
          score_at_sale: 3.15,
          recommendation_at_sale: 'BUY',
          linked_buy_id: lot2._id,
        },
        {
          stock_id: 22,
          ticker: 'HRG',
          name: 'Helayne Robertson Group',
          timestamp: oneHourAgo,
          action: 'SELL',
          shares_sold: 10000,
          sell_price: 604.12,
          bought_price: 590.00,
          profit_per_share: 14.12,
          total_profit: 141200,
          score_at_buy: 5.23,
          recommendation_at_buy: 'STRONG_BUY',
          score_at_sale: 6.27,
          recommendation_at_sale: 'STRONG_BUY',
          linked_buy_id: lot1._id,
        },
      ]);

      const response = await request(app)
        .get('/api/stocks/profit')
        .expect(200);

      expect(response.body).toHaveLength(2);
      
      // Should be sorted newest first
      expect(response.body[0].ticker).toBe('PRN');
      expect(response.body[0].action).toBe('SELL');
      expect(response.body[0].total_profit).toBe(141000);
      
      expect(response.body[1].ticker).toBe('HRG');
      expect(response.body[1].action).toBe('SELL');
      expect(response.body[1].total_profit).toBe(141200);
    });

    it('should include all required fields in response', async () => {
      const lot = await StockHoldingLot.create({
        stock_id: 22,
        ticker: 'HRG',
        name: 'Helayne Robertson Group',
        shares_total: 10000,
        shares_remaining: 0,
        bought_price: 590.00,
        score_at_buy: 5.23,
        recommendation_at_buy: 'STRONG_BUY',
        timestamp: new Date(),
        fully_sold: true,
      });

      await StockTransactionHistory.create({
        stock_id: 22,
        ticker: 'HRG',
        name: 'Helayne Robertson Group',
        timestamp: new Date(),
        action: 'SELL',
        shares_sold: 10000,
        sell_price: 604.12,
        bought_price: 590.00,
        profit_per_share: 14.12,
        total_profit: 141200,
        score_at_buy: 5.23,
        recommendation_at_buy: 'STRONG_BUY',
        score_at_sale: 6.27,
        recommendation_at_sale: 'STRONG_BUY',
        linked_buy_id: lot._id,
      });

      const response = await request(app)
        .get('/api/stocks/profit')
        .expect(200);

      expect(response.body).toHaveLength(1);
      
      const transaction = response.body[0];
      expect(transaction).toHaveProperty('_id');
      expect(transaction).toHaveProperty('stock_id', 22);
      expect(transaction).toHaveProperty('ticker', 'HRG');
      expect(transaction).toHaveProperty('name', 'Helayne Robertson Group');
      expect(transaction).toHaveProperty('timestamp');
      expect(transaction).toHaveProperty('action', 'SELL');
      expect(transaction).toHaveProperty('shares_sold', 10000);
      expect(transaction).toHaveProperty('sell_price', 604.12);
      expect(transaction).toHaveProperty('bought_price', 590.00);
      expect(transaction).toHaveProperty('profit_per_share', 14.12);
      expect(transaction).toHaveProperty('total_profit', 141200);
      expect(transaction).toHaveProperty('score_at_buy', 5.23);
      expect(transaction).toHaveProperty('recommendation_at_buy', 'STRONG_BUY');
      expect(transaction).toHaveProperty('score_at_sale', 6.27);
      expect(transaction).toHaveProperty('recommendation_at_sale', 'STRONG_BUY');
      expect(transaction).toHaveProperty('linked_buy_id');
    });
  });
});
