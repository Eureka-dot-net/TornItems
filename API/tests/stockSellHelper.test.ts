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
  });
});
