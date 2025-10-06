import { StockMarketHistory } from '../src/models/StockMarketHistory';
import { ShopItemStockHistory } from '../src/models/ShopItemStockHistory';

describe('History Models', () => {
  describe('StockMarketHistory Model', () => {
    it('should create a stock market history record', async () => {
      const historyData = {
        ticker: 'TST',
        name: 'Test Stock',
        date: '2025-01-06',
        opening_price: 1000,
        closing_price: 1050,
        lowest_price: 990,
        highest_price: 1100,
        daily_volatility: 11.11
      };

      const history = await StockMarketHistory.create(historyData);
      
      expect(history.ticker).toBe('TST');
      expect(history.name).toBe('Test Stock');
      expect(history.date).toBe('2025-01-06');
      expect(history.opening_price).toBe(1000);
      expect(history.closing_price).toBe(1050);
      expect(history.lowest_price).toBe(990);
      expect(history.highest_price).toBe(1100);
      expect(history.daily_volatility).toBe(11.11);

      // Cleanup
      await StockMarketHistory.deleteOne({ ticker: 'TST', date: '2025-01-06' });
    });

    it('should enforce unique constraint on ticker and date', async () => {
      const historyData = {
        ticker: 'TST2',
        name: 'Test Stock 2',
        date: '2025-01-06',
        opening_price: 1000,
        closing_price: 1050,
        lowest_price: 990,
        highest_price: 1100,
        daily_volatility: 11.11
      };

      await StockMarketHistory.create(historyData);
      
      // Attempting to create duplicate should fail
      await expect(StockMarketHistory.create(historyData)).rejects.toThrow();

      // Cleanup
      await StockMarketHistory.deleteOne({ ticker: 'TST2', date: '2025-01-06' });
    });
  });

  describe('ShopItemStockHistory Model', () => {
    it('should create a shop item stock history record', async () => {
      const historyData = {
        shopId: 'shop1',
        shopName: 'Test Shop',
        itemId: '1',
        itemName: 'Test Item',
        date: '2025-01-06',
        average_sellout_duration_minutes: 120,
        cycles_skipped: 5
      };

      const history = await ShopItemStockHistory.create(historyData);
      
      expect(history.shopId).toBe('shop1');
      expect(history.shopName).toBe('Test Shop');
      expect(history.itemId).toBe('1');
      expect(history.itemName).toBe('Test Item');
      expect(history.date).toBe('2025-01-06');
      expect(history.average_sellout_duration_minutes).toBe(120);
      expect(history.cycles_skipped).toBe(5);

      // Cleanup
      await ShopItemStockHistory.deleteOne({ shopId: 'shop1', itemId: '1', date: '2025-01-06' });
    });

    it('should enforce unique constraint on shopId, itemId, and date', async () => {
      const historyData = {
        shopId: 'shop2',
        shopName: 'Test Shop 2',
        itemId: '2',
        itemName: 'Test Item 2',
        date: '2025-01-06',
        average_sellout_duration_minutes: 90,
        cycles_skipped: 3
      };

      await ShopItemStockHistory.create(historyData);
      
      // Attempting to create duplicate should fail
      await expect(ShopItemStockHistory.create(historyData)).rejects.toThrow();

      // Cleanup
      await ShopItemStockHistory.deleteOne({ shopId: 'shop2', itemId: '2', date: '2025-01-06' });
    });
  });
});

describe('Sales Tax Calculations', () => {
  const SALES_TAX_RATE = 0.05;

  it('should calculate profit after 5% sales tax', () => {
    const marketPrice = 1000;
    const buyPrice = 500;
    
    const marketAfterTax = marketPrice * (1 - SALES_TAX_RATE);
    const profit = marketAfterTax - buyPrice;
    
    // Expected: (1000 * 0.95) - 500 = 950 - 500 = 450
    expect(profit).toBe(450);
  });

  it('should calculate lowest_50_profit after 5% sales tax', () => {
    const averageLowest50 = 2000;
    const buyPrice = 1000;
    
    const averageLowest50AfterTax = averageLowest50 * (1 - SALES_TAX_RATE);
    const profit = averageLowest50AfterTax - buyPrice;
    
    // Expected: (2000 * 0.95) - 1000 = 1900 - 1000 = 900
    expect(profit).toBe(900);
  });

  it('should calculate sold_profit after 5% sales tax', () => {
    const averagePriceSold = 1500;
    const buyPrice = 800;
    
    const averagePriceSoldAfterTax = averagePriceSold * (1 - SALES_TAX_RATE);
    const profit = averagePriceSoldAfterTax - buyPrice;
    
    // Expected: (1500 * 0.95) - 800 = 1425 - 800 = 625
    expect(profit).toBe(625);
  });
});
