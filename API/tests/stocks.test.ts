import request from 'supertest';
import { app } from '../src/app';
import { StockPriceSnapshot } from '../src/models/StockPriceSnapshot';
import { UserStockHoldingSnapshot } from '../src/models/UserStockHoldingSnapshot';

describe('Stocks API', () => {
  describe('GET /api/stocks/recommendations', () => {
    beforeEach(async () => {
      // Clean up test data
      await StockPriceSnapshot.deleteMany({});
      await UserStockHoldingSnapshot.deleteMany({});
    });

    afterEach(async () => {
      // Clean up test data
      await StockPriceSnapshot.deleteMany({});
      await UserStockHoldingSnapshot.deleteMany({});
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
      expect(fhg.change_7d_pct).toBeLessThan(0); // Negative change
      expect(fhg.volatility_7d_pct).toBeGreaterThan(0);
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
      expect(sys.change_7d_pct).toBeGreaterThan(0); // Positive change
      expect(sys.volatility_7d_pct).toBeGreaterThan(0);
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
      expect(stock.change_7d_pct).toBe(0); // No change if same price 7 days ago
      expect(stock.recommendation).toBe('HOLD'); // Should be HOLD with score=null or 0
      expect(stock.owned_shares).toBe(0);
      expect(stock.can_sell).toBe(false);
    });

    it('should show 0 shares for stocks that have been sold', async () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Create stock price data
      await StockPriceSnapshot.insertMany([
        { stock_id: 5, ticker: 'NEW', name: 'Newsies', price: 500.00, timestamp: now },
        { stock_id: 5, ticker: 'NEW', name: 'Newsies', price: 500.00, timestamp: sevenDaysAgo },
      ]);

      // Create holdings snapshot showing the user previously owned this stock
      await UserStockHoldingSnapshot.create({
        stock_id: 5,
        total_shares: 1000,
        avg_buy_price: 450.00,
        transaction_count: 1,
        timestamp: oneHourAgo
      });

      // Create a more recent snapshot showing the stock was sold (0 shares)
      await UserStockHoldingSnapshot.create({
        stock_id: 5,
        total_shares: 0,
        avg_buy_price: null,
        transaction_count: 0,
        timestamp: now
      });

      const response = await request(app)
        .get('/api/stocks/recommendations')
        .expect(200);

      expect(response.body.length).toBe(1);
      
      const stock = response.body[0];
      expect(stock.stock_id).toBe(5);
      expect(stock.ticker).toBe('NEW');
      expect(stock.owned_shares).toBe(0); // Should show 0 shares (most recent snapshot)
      expect(stock.can_sell).toBe(false);
      expect(stock.unrealized_profit_value).toBeNull(); // No profit since 0 shares
      expect(stock.unrealized_profit_pct).toBeNull();
    });

    it('should calculate can_sell and max_shares_to_sell correctly without benefit', async () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Create stock price data (no benefit requirement)
      await StockPriceSnapshot.insertMany([
        { stock_id: 5, ticker: 'TSB', name: 'Torn & Shanghai Banking', price: 100.00, timestamp: now },
        { stock_id: 5, ticker: 'TSB', name: 'Torn & Shanghai Banking', price: 95.00, timestamp: sevenDaysAgo },
      ]);

      // User owns 1000 shares
      await UserStockHoldingSnapshot.create({
        stock_id: 5,
        total_shares: 1000,
        avg_buy_price: 90.00,
        transaction_count: 1,
        timestamp: now
      });

      const response = await request(app)
        .get('/api/stocks/recommendations')
        .expect(200);

      const stock = response.body.find((s: any) => s.ticker === 'TSB');
      expect(stock).toBeDefined();
      expect(stock.owned_shares).toBe(1000);
      expect(stock.can_sell).toBe(true); // Can sell since no benefit
      expect(stock.max_shares_to_sell).toBe(1000); // Can sell all shares
    });

    it('should calculate can_sell and max_shares_to_sell when user has benefit', async () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Create stock price data with benefit requirement of 9,000,000
      await StockPriceSnapshot.insertMany([
        { stock_id: 30, ticker: 'WLT', name: 'Wind Lines Travel', price: 775.00, benefit_requirement: 9000000, timestamp: now },
        { stock_id: 30, ticker: 'WLT', name: 'Wind Lines Travel', price: 770.00, benefit_requirement: 9000000, timestamp: sevenDaysAgo },
      ]);

      // User owns 9,100,000 shares (above requirement)
      await UserStockHoldingSnapshot.create({
        stock_id: 30,
        total_shares: 9100000,
        avg_buy_price: 750.00,
        transaction_count: 1,
        timestamp: now
      });

      const response = await request(app)
        .get('/api/stocks/recommendations')
        .expect(200);

      const stock = response.body.find((s: any) => s.ticker === 'WLT');
      expect(stock).toBeDefined();
      expect(stock.owned_shares).toBe(9100000);
      expect(stock.can_sell).toBe(true); // Can sell some shares
      expect(stock.max_shares_to_sell).toBe(100000); // Can only sell 100k to keep benefit
    });

    it('should set can_sell to false when at exact benefit requirement', async () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Create stock price data with benefit requirement
      await StockPriceSnapshot.insertMany([
        { stock_id: 30, ticker: 'WLT', name: 'Wind Lines Travel', price: 775.00, benefit_requirement: 9000000, timestamp: now },
        { stock_id: 30, ticker: 'WLT', name: 'Wind Lines Travel', price: 770.00, benefit_requirement: 9000000, timestamp: sevenDaysAgo },
      ]);

      // User owns exactly 9,000,000 shares (at requirement)
      await UserStockHoldingSnapshot.create({
        stock_id: 30,
        total_shares: 9000000,
        avg_buy_price: 750.00,
        transaction_count: 1,
        timestamp: now
      });

      const response = await request(app)
        .get('/api/stocks/recommendations')
        .expect(200);

      const stock = response.body.find((s: any) => s.ticker === 'WLT');
      expect(stock).toBeDefined();
      expect(stock.owned_shares).toBe(9000000);
      expect(stock.can_sell).toBe(false); // Can't sell without losing benefit
      expect(stock.max_shares_to_sell).toBe(0); // Can't sell any shares
    });

    it('should allow selling all shares when below benefit requirement', async () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Create stock price data with benefit requirement
      await StockPriceSnapshot.insertMany([
        { stock_id: 30, ticker: 'WLT', name: 'Wind Lines Travel', price: 775.00, benefit_requirement: 9000000, timestamp: now },
        { stock_id: 30, ticker: 'WLT', name: 'Wind Lines Travel', price: 770.00, benefit_requirement: 9000000, timestamp: sevenDaysAgo },
      ]);

      // User owns 5,000,000 shares (below requirement - doesn't have benefit)
      await UserStockHoldingSnapshot.create({
        stock_id: 30,
        total_shares: 5000000,
        avg_buy_price: 750.00,
        transaction_count: 1,
        timestamp: now
      });

      const response = await request(app)
        .get('/api/stocks/recommendations')
        .expect(200);

      const stock = response.body.find((s: any) => s.ticker === 'WLT');
      expect(stock).toBeDefined();
      expect(stock.owned_shares).toBe(5000000);
      expect(stock.can_sell).toBe(true); // Can sell freely since no benefit
      expect(stock.max_shares_to_sell).toBe(5000000); // Can sell all shares
    });
  });

  describe('GET /api/stocks/recommendations/top-sell', () => {
    beforeEach(async () => {
      // Clean up test data
      await StockPriceSnapshot.deleteMany({});
      await UserStockHoldingSnapshot.deleteMany({});
    });

    afterEach(async () => {
      // Clean up test data
      await StockPriceSnapshot.deleteMany({});
      await UserStockHoldingSnapshot.deleteMany({});
    });

    it('should return 404 when no stocks are owned', async () => {
      const response = await request(app)
        .get('/api/stocks/recommendations/top-sell')
        .expect(404);

      expect(response.body.error).toContain('No stocks owned');
    });

    it('should return stock with highest sell_score', async () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Stock A: Increased in price (high sell_score)
      await StockPriceSnapshot.insertMany([
        { stock_id: 1, ticker: 'AAA', name: 'Stock A', price: 200, timestamp: now },
        { stock_id: 1, ticker: 'AAA', name: 'Stock A', price: 100, timestamp: sevenDaysAgo },
      ]);

      // Stock B: Decreased in price (low sell_score)
      await StockPriceSnapshot.insertMany([
        { stock_id: 2, ticker: 'BBB', name: 'Stock B', price: 50, timestamp: now },
        { stock_id: 2, ticker: 'BBB', name: 'Stock B', price: 100, timestamp: sevenDaysAgo },
      ]);

      // User owns both stocks
      await UserStockHoldingSnapshot.create({
        stock_id: 1,
        total_shares: 1000,
        avg_buy_price: 90,
        transaction_count: 1,
        timestamp: now
      });

      await UserStockHoldingSnapshot.create({
        stock_id: 2,
        total_shares: 500,
        avg_buy_price: 90,
        transaction_count: 1,
        timestamp: now
      });

      const response = await request(app)
        .get('/api/stocks/recommendations/top-sell')
        .expect(200);

      // Should return Stock A (higher sell_score)
      expect(response.body.ticker).toBe('AAA');
      expect(response.body.stock_id).toBe(1);
      expect(response.body.sell_score).toBeGreaterThan(0);
      expect(response.body.can_sell).toBe(true);
      expect(response.body.max_shares_to_sell).toBe(1000);
    });

    it('should exclude stocks that cannot be sold due to benefit preservation', async () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Stock A: High sell_score but at exact benefit requirement
      await StockPriceSnapshot.insertMany([
        { stock_id: 30, ticker: 'WLT', name: 'Wind Lines Travel', price: 800, benefit_requirement: 9000000, timestamp: now },
        { stock_id: 30, ticker: 'WLT', name: 'Wind Lines Travel', price: 700, benefit_requirement: 9000000, timestamp: sevenDaysAgo },
      ]);

      // Stock B: Lower sell_score but can be sold
      await StockPriceSnapshot.insertMany([
        { stock_id: 5, ticker: 'TSB', name: 'Torn & Shanghai Banking', price: 110, timestamp: now },
        { stock_id: 5, ticker: 'TSB', name: 'Torn & Shanghai Banking', price: 100, timestamp: sevenDaysAgo },
      ]);

      // User owns WLT at exact requirement (can't sell)
      await UserStockHoldingSnapshot.create({
        stock_id: 30,
        total_shares: 9000000,
        avg_buy_price: 750,
        transaction_count: 1,
        timestamp: now
      });

      // User owns TSB (can sell)
      await UserStockHoldingSnapshot.create({
        stock_id: 5,
        total_shares: 1000,
        avg_buy_price: 95,
        transaction_count: 1,
        timestamp: now
      });

      const response = await request(app)
        .get('/api/stocks/recommendations/top-sell')
        .expect(200);

      // Should return TSB since WLT can't be sold
      expect(response.body.ticker).toBe('TSB');
      expect(response.body.stock_id).toBe(5);
      expect(response.body.can_sell).toBe(true);
    });

    it('should return 404 when all stocks cannot be sold', async () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Stock with benefit requirement
      await StockPriceSnapshot.insertMany([
        { stock_id: 30, ticker: 'WLT', name: 'Wind Lines Travel', price: 775, benefit_requirement: 9000000, timestamp: now },
        { stock_id: 30, ticker: 'WLT', name: 'Wind Lines Travel', price: 770, benefit_requirement: 9000000, timestamp: sevenDaysAgo },
      ]);

      // User owns at exact requirement (can't sell)
      await UserStockHoldingSnapshot.create({
        stock_id: 30,
        total_shares: 9000000,
        avg_buy_price: 750,
        transaction_count: 1,
        timestamp: now
      });

      const response = await request(app)
        .get('/api/stocks/recommendations/top-sell')
        .expect(404);

      expect(response.body.error).toContain('No sellable stocks found');
    });
  });
});
