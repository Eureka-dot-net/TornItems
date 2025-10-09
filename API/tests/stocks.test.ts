import request from 'supertest';
import { app } from '../src/app';
import { StockPriceSnapshot } from '../src/models/StockPriceSnapshot';
import { UserStockHoldingSnapshot } from '../src/models/UserStockHoldingSnapshot';
import { StockRecommendation } from '../src/models/StockRecommendation';

describe('Stocks API', () => {
  describe('GET /api/stocks/recommendations', () => {
    beforeEach(async () => {
      // Clean up test data
      await StockPriceSnapshot.deleteMany({});
      await UserStockHoldingSnapshot.deleteMany({});
      await StockRecommendation.deleteMany({});
    });

    afterEach(async () => {
      // Clean up test data
      await StockPriceSnapshot.deleteMany({});
      await UserStockHoldingSnapshot.deleteMany({});
      await StockRecommendation.deleteMany({});
    });

    it('should return 503 when no stock recommendation data exists', async () => {
      const response = await request(app)
        .get('/api/stocks/recommendations')
        .expect(503);

      expect(response.body.error).toContain('No stock recommendations found');
    });

    it('should return stock recommendations with proper scores', async () => {
      // Create test recommendation data directly
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();
      
      // Stock that went DOWN 12.3% over 7 days (should be STRONG_BUY)
      await StockRecommendation.create({
        stock_id: 25,
        ticker: 'FHG',
        name: 'Feathery Hotels Group',
        price: 1499.22,
        change_7d_pct: -12.32,
        volatility_7d_pct: 5.5,
        score: 3.5,
        sell_score: -3.5,
        recommendation: 'STRONG_BUY',
        owned_shares: 0,
        avg_buy_price: null,
        unrealized_profit_value: null,
        unrealized_profit_pct: null,
        can_sell: false,
        max_shares_to_sell: 0,
        benefit_requirement: null,
        date: today,
        timestamp: now
      });

      // Stock that went UP 9.2% over 7 days (should be SELL)
      await StockRecommendation.create({
        stock_id: 2,
        ticker: 'SYS',
        name: 'Syscore',
        price: 2334.98,
        change_7d_pct: 9.24,
        volatility_7d_pct: 3.2,
        score: -2.1,
        sell_score: 2.1,
        recommendation: 'SELL',
        owned_shares: 0,
        avg_buy_price: null,
        unrealized_profit_value: null,
        unrealized_profit_pct: null,
        can_sell: false,
        max_shares_to_sell: 0,
        benefit_requirement: null,
        date: today,
        timestamp: now
      });

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
      expect(fhg.recommendation).toBe('STRONG_BUY');
      expect(fhg.owned_shares).toBe(0);
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
      expect(sys.recommendation).toBe('SELL');
      expect(sys.owned_shares).toBe(0);
      expect(sys.can_sell).toBe(false);
    });

    it('should sort recommendations by score descending', async () => {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();

      // Stock A: High buy score (large decline)
      await StockRecommendation.create({
        stock_id: 1,
        ticker: 'AAA',
        name: 'Stock A',
        price: 100,
        change_7d_pct: -50.0,
        volatility_7d_pct: 10.0,
        score: 5.0,
        sell_score: -5.0,
        recommendation: 'STRONG_BUY',
        owned_shares: 0,
        avg_buy_price: null,
        unrealized_profit_value: null,
        unrealized_profit_pct: null,
        can_sell: false,
        max_shares_to_sell: 0,
        benefit_requirement: null,
        date: today,
        timestamp: now
      });

      // Stock B: Low buy score (small decline)
      await StockRecommendation.create({
        stock_id: 2,
        ticker: 'BBB',
        name: 'Stock B',
        price: 95,
        change_7d_pct: -5.0,
        volatility_7d_pct: 2.0,
        score: 0.5,
        sell_score: -0.5,
        recommendation: 'BUY',
        owned_shares: 0,
        avg_buy_price: null,
        unrealized_profit_value: null,
        unrealized_profit_pct: null,
        can_sell: false,
        max_shares_to_sell: 0,
        benefit_requirement: null,
        date: today,
        timestamp: now
      });

      const response = await request(app)
        .get('/api/stocks/recommendations')
        .expect(200);

      expect(response.body.length).toBe(2);
      
      // Stock A should come first (higher buy score)
      expect(response.body[0].ticker).toBe('AAA');
      expect(response.body[0].score).toBeGreaterThan(response.body[1].score);
    });

    it('should handle stocks with insufficient history', async () => {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();

      // Stock with no change (same price 7 days ago)
      await StockRecommendation.create({
        stock_id: 5,
        ticker: 'NEW',
        name: 'New Stock',
        price: 1000,
        change_7d_pct: 0,
        volatility_7d_pct: 0,
        score: null,
        sell_score: null,
        recommendation: 'HOLD',
        owned_shares: 0,
        avg_buy_price: null,
        unrealized_profit_value: null,
        unrealized_profit_pct: null,
        can_sell: false,
        max_shares_to_sell: 0,
        benefit_requirement: null,
        date: today,
        timestamp: now
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
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();

      // Create stock recommendation with 0 shares (sold)
      await StockRecommendation.create({
        stock_id: 5,
        ticker: 'NEW',
        name: 'Newsies',
        price: 500.00,
        change_7d_pct: 0,
        volatility_7d_pct: 1.5,
        score: null,
        sell_score: null,
        recommendation: 'HOLD',
        owned_shares: 0,
        avg_buy_price: null,
        unrealized_profit_value: null,
        unrealized_profit_pct: null,
        can_sell: false,
        max_shares_to_sell: 0,
        benefit_requirement: null,
        date: today,
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
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();

      // Create stock recommendation with owned shares and no benefit requirement
      await StockRecommendation.create({
        stock_id: 5,
        ticker: 'TSB',
        name: 'Torn & Shanghai Banking',
        price: 100.00,
        change_7d_pct: 5.26,
        volatility_7d_pct: 2.5,
        score: -1.2,
        sell_score: 1.2,
        recommendation: 'SELL',
        owned_shares: 1000,
        avg_buy_price: 90.00,
        unrealized_profit_value: 10000.00,
        unrealized_profit_pct: 11.11,
        can_sell: true,
        max_shares_to_sell: 1000,
        benefit_requirement: null,
        date: today,
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
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();

      // Create stock recommendation with benefit requirement
      await StockRecommendation.create({
        stock_id: 30,
        ticker: 'WLT',
        name: 'Wind Lines Travel',
        price: 775.00,
        change_7d_pct: 0.65,
        volatility_7d_pct: 1.8,
        score: -0.3,
        sell_score: 0.3,
        recommendation: 'HOLD',
        owned_shares: 9100000,
        avg_buy_price: 750.00,
        unrealized_profit_value: 2275000.00,
        unrealized_profit_pct: 3.33,
        can_sell: true,
        max_shares_to_sell: 100000,
        benefit_requirement: 9000000,
        date: today,
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
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();

      // Create stock recommendation at exact benefit requirement
      await StockRecommendation.create({
        stock_id: 30,
        ticker: 'WLT',
        name: 'Wind Lines Travel',
        price: 775.00,
        change_7d_pct: 0.65,
        volatility_7d_pct: 1.8,
        score: -0.3,
        sell_score: 0.3,
        recommendation: 'HOLD',
        owned_shares: 9000000,
        avg_buy_price: 750.00,
        unrealized_profit_value: 2250000.00,
        unrealized_profit_pct: 3.33,
        can_sell: false,
        max_shares_to_sell: 0,
        benefit_requirement: 9000000,
        date: today,
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
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();

      // Create stock recommendation below benefit requirement
      await StockRecommendation.create({
        stock_id: 30,
        ticker: 'WLT',
        name: 'Wind Lines Travel',
        price: 775.00,
        change_7d_pct: 0.65,
        volatility_7d_pct: 1.8,
        score: -0.3,
        sell_score: 0.3,
        recommendation: 'HOLD',
        owned_shares: 5000000,
        avg_buy_price: 750.00,
        unrealized_profit_value: 1250000.00,
        unrealized_profit_pct: 3.33,
        can_sell: true,
        max_shares_to_sell: 5000000,
        benefit_requirement: 9000000,
        date: today,
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
      await StockRecommendation.deleteMany({});
    });

    afterEach(async () => {
      // Clean up test data
      await StockPriceSnapshot.deleteMany({});
      await UserStockHoldingSnapshot.deleteMany({});
      await StockRecommendation.deleteMany({});
    });

    it('should return 404 when no stocks are owned', async () => {
      const response = await request(app)
        .get('/api/stocks/recommendations/top-sell')
        .expect(404);

      expect(response.body.error).toContain('No sellable stocks found');
    });

    it('should return stock with highest sell_score', async () => {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();

      // Stock A: Increased in price (high sell_score)
      await StockRecommendation.create({
        stock_id: 1,
        ticker: 'AAA',
        name: 'Stock A',
        price: 200,
        change_7d_pct: 100.0,
        volatility_7d_pct: 5.0,
        score: -5.0,
        sell_score: 5.0,
        recommendation: 'STRONG_SELL',
        owned_shares: 1000,
        avg_buy_price: 90,
        unrealized_profit_value: 110000,
        unrealized_profit_pct: 122.22,
        can_sell: true,
        max_shares_to_sell: 1000,
        benefit_requirement: null,
        date: today,
        timestamp: now
      });

      // Stock B: Decreased in price (low/negative sell_score)
      await StockRecommendation.create({
        stock_id: 2,
        ticker: 'BBB',
        name: 'Stock B',
        price: 50,
        change_7d_pct: -50.0,
        volatility_7d_pct: 8.0,
        score: 4.0,
        sell_score: -4.0,
        recommendation: 'STRONG_BUY',
        owned_shares: 500,
        avg_buy_price: 90,
        unrealized_profit_value: -20000,
        unrealized_profit_pct: -44.44,
        can_sell: true,
        max_shares_to_sell: 500,
        benefit_requirement: null,
        date: today,
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
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();

      // Stock A: High sell_score but at exact benefit requirement (can't sell)
      await StockRecommendation.create({
        stock_id: 30,
        ticker: 'WLT',
        name: 'Wind Lines Travel',
        price: 800,
        change_7d_pct: 14.29,
        volatility_7d_pct: 3.5,
        score: -3.0,
        sell_score: 3.0,
        recommendation: 'SELL',
        owned_shares: 9000000,
        avg_buy_price: 750,
        unrealized_profit_value: 450000000,
        unrealized_profit_pct: 6.67,
        can_sell: false,
        max_shares_to_sell: 0,
        benefit_requirement: 9000000,
        date: today,
        timestamp: now
      });

      // Stock B: Lower sell_score but can be sold
      await StockRecommendation.create({
        stock_id: 5,
        ticker: 'TSB',
        name: 'Torn & Shanghai Banking',
        price: 110,
        change_7d_pct: 10.0,
        volatility_7d_pct: 2.0,
        score: -2.0,
        sell_score: 2.0,
        recommendation: 'SELL',
        owned_shares: 1000,
        avg_buy_price: 95,
        unrealized_profit_value: 15000,
        unrealized_profit_pct: 15.79,
        can_sell: true,
        max_shares_to_sell: 1000,
        benefit_requirement: null,
        date: today,
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
      const today = new Date().toISOString().split('T')[0];
      const now = new Date();

      // Stock with benefit requirement that can't be sold
      await StockRecommendation.create({
        stock_id: 30,
        ticker: 'WLT',
        name: 'Wind Lines Travel',
        price: 775,
        change_7d_pct: 0.65,
        volatility_7d_pct: 1.8,
        score: -0.3,
        sell_score: 0.3,
        recommendation: 'HOLD',
        owned_shares: 9000000,
        avg_buy_price: 750,
        unrealized_profit_value: 2250000,
        unrealized_profit_pct: 3.33,
        can_sell: false,
        max_shares_to_sell: 0,
        benefit_requirement: 9000000,
        date: today,
        timestamp: now
      });

      const response = await request(app)
        .get('/api/stocks/recommendations/top-sell')
        .expect(404);

      expect(response.body.error).toContain('No sellable stocks found');
    });
  });
});
