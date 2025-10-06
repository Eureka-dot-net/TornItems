import request from 'supertest';
import { app } from '../src/app';
import { StockTransactionHistory } from '../src/models/StockTransactionHistory';

describe('Stock Profit API', () => {
  describe('GET /api/stocks/profit', () => {
    beforeEach(async () => {
      // Clear the collection before each test
      await StockTransactionHistory.deleteMany({});
    });

    it('should return empty array when no transactions exist', async () => {
      const response = await request(app)
        .get('/api/stocks/profit')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all transactions sorted by time descending', async () => {
      // Create test transactions
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

      await StockTransactionHistory.create([
        {
          stock_id: 22,
          ticker: 'HRG',
          name: 'Helayne Robertson Group',
          time: twoHoursAgo,
          action: 'BUY',
          shares: 10000,
          price: 590.00,
          previous_shares: 0,
          new_shares: 10000,
          bought_price: 590.00,
          score_at_buy: 5.23,
          recommendation_at_buy: 'STRONG_BUY',
          trend_7d_pct: -15.2,
          volatility_7d_pct: 2.9,
        },
        {
          stock_id: 18,
          ticker: 'PRN',
          name: 'Printing Paperwork News',
          time: oneHourAgo,
          action: 'BUY',
          shares: 15000,
          price: 601.10,
          previous_shares: 0,
          new_shares: 15000,
          bought_price: 601.10,
          score_at_buy: 4.82,
          recommendation_at_buy: 'STRONG_BUY',
          trend_7d_pct: -12.1,
          volatility_7d_pct: 2.5,
        },
        {
          stock_id: 22,
          ticker: 'HRG',
          name: 'Helayne Robertson Group',
          time: now,
          action: 'SELL',
          shares: 10000,
          price: 604.12,
          previous_shares: 10000,
          new_shares: 0,
          bought_price: 590.00,
          profit_per_share: 14.12,
          total_profit: 141200,
          score_at_sale: 6.27,
          recommendation_at_sale: 'STRONG_BUY',
          trend_7d_pct: -18.3,
          volatility_7d_pct: 2.9,
        },
      ]);

      const response = await request(app)
        .get('/api/stocks/profit')
        .expect(200);

      expect(response.body).toHaveLength(3);
      
      // Should be sorted newest first
      expect(response.body[0].ticker).toBe('HRG');
      expect(response.body[0].action).toBe('SELL');
      expect(response.body[0].total_profit).toBe(141200);
      
      expect(response.body[1].ticker).toBe('PRN');
      expect(response.body[1].action).toBe('BUY');
      
      expect(response.body[2].ticker).toBe('HRG');
      expect(response.body[2].action).toBe('BUY');
    });

    it('should include all required fields in response', async () => {
      await StockTransactionHistory.create({
        stock_id: 22,
        ticker: 'HRG',
        name: 'Helayne Robertson Group',
        time: new Date(),
        action: 'SELL',
        shares: 10000,
        price: 604.12,
        previous_shares: 10000,
        new_shares: 0,
        bought_price: 590.00,
        profit_per_share: 14.12,
        total_profit: 141200,
        score_at_sale: 6.27,
        recommendation_at_sale: 'STRONG_BUY',
        trend_7d_pct: -18.3,
        volatility_7d_pct: 2.9,
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
      expect(transaction).toHaveProperty('time');
      expect(transaction).toHaveProperty('action', 'SELL');
      expect(transaction).toHaveProperty('shares', 10000);
      expect(transaction).toHaveProperty('price', 604.12);
      expect(transaction).toHaveProperty('previous_shares', 10000);
      expect(transaction).toHaveProperty('new_shares', 0);
      expect(transaction).toHaveProperty('bought_price', 590.00);
      expect(transaction).toHaveProperty('profit_per_share', 14.12);
      expect(transaction).toHaveProperty('total_profit', 141200);
      expect(transaction).toHaveProperty('score_at_sale', 6.27);
      expect(transaction).toHaveProperty('recommendation_at_sale', 'STRONG_BUY');
      expect(transaction).toHaveProperty('trend_7d_pct', -18.3);
      expect(transaction).toHaveProperty('volatility_7d_pct', 2.9);
    });
  });
});
