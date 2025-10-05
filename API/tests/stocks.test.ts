import request from 'supertest';
import { app } from '../src/app';
import { StockPriceSnapshot } from '../src/models/StockPriceSnapshot';

describe('Stocks API', () => {
  describe('GET /api/stocks/recommendations', () => {
    beforeEach(async () => {
      // Clean up test data
      await StockPriceSnapshot.deleteMany({});
    });

    afterEach(async () => {
      // Clean up test data
      await StockPriceSnapshot.deleteMany({});
    });

    it('should return 503 when no stock data exists', async () => {
      const response = await request(app)
        .get('/api/stocks/recommendations')
        .expect(503);

      expect(response.body.error).toContain('No stock data found');
    });

    it('should return stock recommendations with proper scores', async () => {
      // Create test data for a stock with declining price (good buy)
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      // Stock that went DOWN 12.3% over 7 days (should be STRONG_BUY)
      await StockPriceSnapshot.insertMany([
        { stock_id: 25, ticker: 'FHG', name: 'Feathery Hotels Group', price: 1499.22, timestamp: now },
        { stock_id: 25, ticker: 'FHG', name: 'Feathery Hotels Group', price: 1520.00, timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
        { stock_id: 25, ticker: 'FHG', name: 'Feathery Hotels Group', price: 1540.00, timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
        { stock_id: 25, ticker: 'FHG', name: 'Feathery Hotels Group', price: 1560.00, timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
        { stock_id: 25, ticker: 'FHG', name: 'Feathery Hotels Group', price: 1580.00, timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000) },
        { stock_id: 25, ticker: 'FHG', name: 'Feathery Hotels Group', price: 1600.00, timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
        { stock_id: 25, ticker: 'FHG', name: 'Feathery Hotels Group', price: 1650.00, timestamp: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000) },
        { stock_id: 25, ticker: 'FHG', name: 'Feathery Hotels Group', price: 1710.00, timestamp: sevenDaysAgo },
      ]);

      // Stock that went UP 9.2% over 7 days (should be SELL)
      await StockPriceSnapshot.insertMany([
        { stock_id: 2, ticker: 'SYS', name: 'Syscore', price: 2334.98, timestamp: now },
        { stock_id: 2, ticker: 'SYS', name: 'Syscore', price: 2320.00, timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
        { stock_id: 2, ticker: 'SYS', name: 'Syscore', price: 2300.00, timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
        { stock_id: 2, ticker: 'SYS', name: 'Syscore', price: 2280.00, timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
        { stock_id: 2, ticker: 'SYS', name: 'Syscore', price: 2260.00, timestamp: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000) },
        { stock_id: 2, ticker: 'SYS', name: 'Syscore', price: 2240.00, timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
        { stock_id: 2, ticker: 'SYS', name: 'Syscore', price: 2220.00, timestamp: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000) },
        { stock_id: 2, ticker: 'SYS', name: 'Syscore', price: 2137.54, timestamp: sevenDaysAgo }, // 9.2% increase
      ]);

      const response = await request(app)
        .get('/api/stocks/recommendations')
        .expect(200);

      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(2);

      // Check FHG (should be a good buy with negative change)
      const fhg = response.body.find((s: any) => s.ticker === 'FHG');
      expect(fhg).toBeDefined();
      expect(fhg.stock_id).toBe(25);
      expect(fhg.ticker).toBe('FHG');
      expect(fhg.name).toBe('Feathery Hotels Group');
      expect(fhg.price).toBe(1499.22);
      expect(fhg.change_7d).toBeLessThan(0); // Negative change
      expect(fhg.volatility).toBeGreaterThan(0);
      expect(fhg.score).toBeGreaterThan(0); // Positive score for declining stock
      expect(fhg.sell_score).toBeLessThan(0); // Negative sell score
      expect(['STRONG_BUY', 'BUY']).toContain(fhg.recommendation);
      expect(fhg.owned_shares).toBe(0); // No shares owned (API call will fail/return empty)
      expect(fhg.can_sell).toBe(false);

      // Check SYS (should be a sell with positive change)
      const sys = response.body.find((s: any) => s.ticker === 'SYS');
      expect(sys).toBeDefined();
      expect(sys.stock_id).toBe(2);
      expect(sys.ticker).toBe('SYS');
      expect(sys.name).toBe('Syscore');
      expect(sys.price).toBe(2334.98);
      expect(sys.change_7d).toBeGreaterThan(0); // Positive change
      expect(sys.volatility).toBeGreaterThan(0);
      expect(sys.score).toBeLessThan(0); // Negative score for rising stock
      expect(sys.sell_score).toBeGreaterThan(0); // Positive sell score
      expect(['SELL', 'STRONG_SELL']).toContain(sys.recommendation);
      expect(sys.owned_shares).toBe(0); // No shares owned (API call will fail/return empty)
      expect(sys.can_sell).toBe(false);
    });

    it('should sort recommendations by score descending', async () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Stock A: High buy score (large decline)
      await StockPriceSnapshot.insertMany([
        { stock_id: 1, ticker: 'AAA', name: 'Stock A', price: 100, timestamp: now },
        { stock_id: 1, ticker: 'AAA', name: 'Stock A', price: 200, timestamp: sevenDaysAgo },
      ]);

      // Stock B: Low buy score (small decline)
      await StockPriceSnapshot.insertMany([
        { stock_id: 2, ticker: 'BBB', name: 'Stock B', price: 95, timestamp: now },
        { stock_id: 2, ticker: 'BBB', name: 'Stock B', price: 100, timestamp: sevenDaysAgo },
      ]);

      const response = await request(app)
        .get('/api/stocks/recommendations')
        .expect(200);

      expect(response.body.length).toBe(2);
      
      // Stock A should come first (higher buy score)
      expect(response.body[0].ticker).toBe('AAA');
      expect(response.body[0].score).toBeGreaterThan(response.body[1].score);
    });

    it('should handle stocks with insufficient history', async () => {
      const now = new Date();

      // Stock with only current price (no 7-day history)
      await StockPriceSnapshot.create({
        stock_id: 5,
        ticker: 'NEW',
        name: 'New Stock',
        price: 1000,
        timestamp: now,
      });

      const response = await request(app)
        .get('/api/stocks/recommendations')
        .expect(200);

      expect(response.body.length).toBe(1);
      
      const stock = response.body[0];
      expect(stock.stock_id).toBe(5);
      expect(stock.ticker).toBe('NEW');
      expect(stock.change_7d).toBe(0); // No change if same price 7 days ago
      expect(stock.recommendation).toBe('HOLD'); // Should be HOLD with score=null or 0
      expect(stock.owned_shares).toBe(0);
      expect(stock.can_sell).toBe(false);
    });
  });
});
