import { calculateBestStockToSell } from '../src/utils/stockSellHelper';
import { StockPriceSnapshot } from '../src/models/StockPriceSnapshot';
import { UserStockHoldingSnapshot } from '../src/models/UserStockHoldingSnapshot';

describe('Stock Sell Helper', () => {
  beforeEach(async () => {
    // Clear collections before each test
    await StockPriceSnapshot.deleteMany({});
    await UserStockHoldingSnapshot.deleteMany({});
  });

  afterEach(async () => {
    // Clean up test data
    await StockPriceSnapshot.deleteMany({});
    await UserStockHoldingSnapshot.deleteMany({});
  });

  describe('calculateBestStockToSell', () => {
    it('should return null when no stocks are owned', async () => {
      const result = await calculateBestStockToSell(1000000);
      expect(result).toBeNull();
    });

    it('should return null when owned stocks do not have enough value', async () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Create stock price data for a stock worth $100 per share
      await StockPriceSnapshot.create({
        stock_id: 1,
        ticker: 'TST',
        name: 'Test Stock',
        price: 100,
        timestamp: now
      });

      await StockPriceSnapshot.create({
        stock_id: 1,
        ticker: 'TST',
        name: 'Test Stock',
        price: 95,
        timestamp: sevenDaysAgo
      });

      // User owns 10 shares (total value: $1,000)
      await UserStockHoldingSnapshot.create({
        stock_id: 1,
        total_shares: 10,
        avg_buy_price: 90,
        transaction_count: 1,
        timestamp: now
      });

      // Need $10,000 but only have $1,000 worth
      const result = await calculateBestStockToSell(10000);
      expect(result).toBeNull();
    });

    it('should recommend selling the stock with highest sell_score when multiple stocks available', async () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Stock 1: Price increased (low sell_score)
      await StockPriceSnapshot.create({
        stock_id: 1,
        ticker: 'TST1',
        name: 'Test Stock 1',
        price: 105,
        timestamp: now
      });
      await StockPriceSnapshot.create({
        stock_id: 1,
        ticker: 'TST1',
        name: 'Test Stock 1',
        price: 100,
        timestamp: sevenDaysAgo
      });

      // Stock 2: Price decreased (high sell_score)
      await StockPriceSnapshot.create({
        stock_id: 2,
        ticker: 'TST2',
        name: 'Test Stock 2',
        price: 95,
        timestamp: now
      });
      await StockPriceSnapshot.create({
        stock_id: 2,
        ticker: 'TST2',
        name: 'Test Stock 2',
        price: 100,
        timestamp: sevenDaysAgo
      });

      // User owns both stocks with enough value
      await UserStockHoldingSnapshot.create({
        stock_id: 1,
        total_shares: 1000,
        avg_buy_price: 90,
        transaction_count: 1,
        timestamp: now
      });

      await UserStockHoldingSnapshot.create({
        stock_id: 2,
        total_shares: 1000,
        avg_buy_price: 90,
        transaction_count: 1,
        timestamp: now
      });

      const result = await calculateBestStockToSell(5000);

      // Should recommend Stock 2 as it has a higher sell_score (price went down)
      expect(result).not.toBeNull();
      expect(result?.stock_id).toBe(2);
      expect(result?.ticker).toBe('TST2');
    });

    it('should calculate correct number of shares to sell with price buffer', async () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      await StockPriceSnapshot.create({
        stock_id: 1,
        ticker: 'TST',
        name: 'Test Stock',
        price: 100,
        timestamp: now
      });

      await StockPriceSnapshot.create({
        stock_id: 1,
        ticker: 'TST',
        name: 'Test Stock',
        price: 95,
        timestamp: sevenDaysAgo
      });

      await UserStockHoldingSnapshot.create({
        stock_id: 1,
        total_shares: 1000,
        avg_buy_price: 90,
        transaction_count: 1,
        timestamp: now
      });

      const result = await calculateBestStockToSell(5000);

      expect(result).not.toBeNull();
      // Price is $100, with -0.1 buffer = $99.9
      // $5000 / $99.9 = 50.05, ceil = 51 shares
      expect(result?.shares_to_sell).toBe(51);
      expect(result?.current_price).toBe(100);
    });

    it('should cap shares to sell at owned shares', async () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      await StockPriceSnapshot.create({
        stock_id: 1,
        ticker: 'TST',
        name: 'Test Stock',
        price: 100,
        timestamp: now
      });

      await StockPriceSnapshot.create({
        stock_id: 1,
        ticker: 'TST',
        name: 'Test Stock',
        price: 95,
        timestamp: sevenDaysAgo
      });

      // Only own 10 shares
      await UserStockHoldingSnapshot.create({
        stock_id: 1,
        total_shares: 10,
        avg_buy_price: 90,
        transaction_count: 1,
        timestamp: now
      });

      // Need more than we have
      const result = await calculateBestStockToSell(500);

      expect(result).not.toBeNull();
      // Would need 6 shares, but have 10, so should recommend 6
      expect(result?.shares_to_sell).toBe(6);
    });

    it('should generate correct sell URL', async () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      await StockPriceSnapshot.create({
        stock_id: 25,
        ticker: 'TSB',
        name: 'Torn & Shanghai Banking',
        price: 100,
        timestamp: now
      });

      await StockPriceSnapshot.create({
        stock_id: 25,
        ticker: 'TSB',
        name: 'Torn & Shanghai Banking',
        price: 95,
        timestamp: sevenDaysAgo
      });

      await UserStockHoldingSnapshot.create({
        stock_id: 25,
        total_shares: 1000,
        avg_buy_price: 90,
        transaction_count: 1,
        timestamp: now
      });

      const result = await calculateBestStockToSell(2000);

      expect(result).not.toBeNull();
      expect(result?.sell_url).toContain('stockID=25');
      expect(result?.sell_url).toContain('sellamount=');
      expect(result?.sell_url).toMatch(/https:\/\/www\.torn\.com\/page\.php\?sid=stocks&stockID=25&tab=owned&sellamount=\d+/);
    });

    it('should not recommend a stock if selling would cause loss of benefit', async () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Stock with benefit requiring 9,000,000 shares (like Wind Lines Travel)
      await StockPriceSnapshot.create({
        stock_id: 30,
        ticker: 'WLT',
        name: 'Wind Lines Travel',
        price: 775.38,
        benefit: {
          type: 'passive',
          frequency: 7,
          requirement: 9000000,
          description: 'Private jet access'
        },
        timestamp: now
      });

      await StockPriceSnapshot.create({
        stock_id: 30,
        ticker: 'WLT',
        name: 'Wind Lines Travel',
        price: 770,
        timestamp: sevenDaysAgo
      });

      // User owns 9,100,000 shares - just above the requirement
      await UserStockHoldingSnapshot.create({
        stock_id: 30,
        total_shares: 9100000,
        avg_buy_price: 750,
        transaction_count: 1,
        timestamp: now
      });

      // Try to sell enough that would drop below requirement
      // Need $1,000,000, which would require ~1,290 shares
      // After selling, would have ~9,098,710 shares (still above requirement)
      // But if we need $100,000,000, would require ~129,000 shares
      // After selling, would have ~8,971,000 shares (below requirement of 9,000,000)
      const result = await calculateBestStockToSell(100000000);

      // Should return null because selling would lose the benefit
      expect(result).toBeNull();
    });

    it('should recommend a stock with benefit if selling does not cause loss', async () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Stock with benefit requiring 9,000,000 shares
      await StockPriceSnapshot.create({
        stock_id: 30,
        ticker: 'WLT',
        name: 'Wind Lines Travel',
        price: 775.38,
        benefit: {
          type: 'passive',
          frequency: 7,
          requirement: 9000000,
          description: 'Private jet access'
        },
        timestamp: now
      });

      await StockPriceSnapshot.create({
        stock_id: 30,
        ticker: 'WLT',
        name: 'Wind Lines Travel',
        price: 770,
        timestamp: sevenDaysAgo
      });

      // User owns 10,000,000 shares - well above the requirement
      await UserStockHoldingSnapshot.create({
        stock_id: 30,
        total_shares: 10000000,
        avg_buy_price: 750,
        transaction_count: 1,
        timestamp: now
      });

      // Need $100,000, which requires ~130 shares
      // After selling, would have ~9,999,870 shares (still well above requirement)
      const result = await calculateBestStockToSell(100000);

      expect(result).not.toBeNull();
      expect(result?.stock_id).toBe(30);
      expect(result?.ticker).toBe('WLT');
      // Should recommend selling the minimum needed
      expect(result?.shares_to_sell).toBeGreaterThan(0);
    });

    it('should prefer stock without benefit over stock with benefit when both viable', async () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Stock 1: Has benefit and higher sell_score
      await StockPriceSnapshot.create({
        stock_id: 1,
        ticker: 'TST1',
        name: 'Test Stock 1',
        price: 100,
        benefit: {
          type: 'passive',
          frequency: 7,
          requirement: 1000,
          description: 'Some benefit'
        },
        timestamp: now
      });
      await StockPriceSnapshot.create({
        stock_id: 1,
        ticker: 'TST1',
        name: 'Test Stock 1',
        price: 95,
        timestamp: sevenDaysAgo
      });

      // Stock 2: No benefit but lower sell_score
      await StockPriceSnapshot.create({
        stock_id: 2,
        ticker: 'TST2',
        name: 'Test Stock 2',
        price: 100,
        benefit: null,
        timestamp: now
      });
      await StockPriceSnapshot.create({
        stock_id: 2,
        ticker: 'TST2',
        name: 'Test Stock 2',
        price: 105,
        timestamp: sevenDaysAgo
      });

      // User owns both stocks with plenty of shares
      await UserStockHoldingSnapshot.create({
        stock_id: 1,
        total_shares: 10000,
        avg_buy_price: 90,
        transaction_count: 1,
        timestamp: now
      });

      await UserStockHoldingSnapshot.create({
        stock_id: 2,
        total_shares: 10000,
        avg_buy_price: 90,
        transaction_count: 1,
        timestamp: now
      });

      const result = await calculateBestStockToSell(5000);

      // Should recommend Stock 1 because it has the higher sell_score
      // Both are viable (neither would lose benefits)
      expect(result).not.toBeNull();
      expect(result?.stock_id).toBe(1);
    });

    it('should skip stock with benefit if it would be lost and choose next best', async () => {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Stock 1: Has benefit, high sell_score, but would lose benefit
      await StockPriceSnapshot.create({
        stock_id: 1,
        ticker: 'TST1',
        name: 'Test Stock 1',
        price: 100,
        benefit: {
          type: 'passive',
          frequency: 7,
          requirement: 1000,
          description: 'Some benefit'
        },
        timestamp: now
      });
      await StockPriceSnapshot.create({
        stock_id: 1,
        ticker: 'TST1',
        name: 'Test Stock 1',
        price: 95,
        timestamp: sevenDaysAgo
      });

      // Stock 2: No benefit, lower sell_score, but safe to sell
      await StockPriceSnapshot.create({
        stock_id: 2,
        ticker: 'TST2',
        name: 'Test Stock 2',
        price: 100,
        benefit: null,
        timestamp: now
      });
      await StockPriceSnapshot.create({
        stock_id: 2,
        ticker: 'TST2',
        name: 'Test Stock 2',
        price: 105,
        timestamp: sevenDaysAgo
      });

      // User owns stock 1 with just enough shares that selling would lose benefit
      await UserStockHoldingSnapshot.create({
        stock_id: 1,
        total_shares: 1050,
        avg_buy_price: 90,
        transaction_count: 1,
        timestamp: now
      });

      // User owns stock 2 with plenty of shares
      await UserStockHoldingSnapshot.create({
        stock_id: 2,
        total_shares: 10000,
        avg_buy_price: 90,
        transaction_count: 1,
        timestamp: now
      });

      // Need $6,000 which would require ~61 shares
      // Stock 1: 1050 - 61 = 989 shares left (below requirement of 1000) -> EXCLUDED
      // Stock 2: 10000 - 61 = 9939 shares left (no benefit to lose) -> OK
      const result = await calculateBestStockToSell(6000);

      // Should recommend Stock 2 even though it has lower sell_score
      // because Stock 1 would lose its benefit
      expect(result).not.toBeNull();
      expect(result?.stock_id).toBe(2);
      expect(result?.ticker).toBe('TST2');
    });
    });
  });
});
