import { TornItem } from '../src/models/TornItem';
import { CityShopStock } from '../src/models/CityShopStock';
import { CityShopStockHistory } from '../src/models/CityShopStockHistory';
import { ForeignStock } from '../src/models/ForeignStock';
import { ForeignStockHistory } from '../src/models/ForeignStockHistory';
import { ItemMarket } from '../src/models/ItemMarket';
import { MarketHistory } from '../src/models/MarketHistory';

describe('MongoDB Models', () => {
  describe('TornItem Model', () => {
    it('should create a TornItem', async () => {
      const item = await TornItem.create({
        itemId: 1,
        name: 'Test Item',
        description: 'A test item',
        type: 'Weapon',
        is_tradable: true,
        is_found_in_city: false,
        vendor_country: 'Mexico',
        vendor_name: 'Test Vendor',
        buy_price: 100,
        market_price: 150,
      });

      expect(item.itemId).toBe(1);
      expect(item.name).toBe('Test Item');
      expect(item.buy_price).toBe(100);
      
      await TornItem.deleteOne({ itemId: 1 });
    });
  });

  describe('CityShopStock Model', () => {
    it('should create a CityShopStock entry', async () => {
      const stock = await CityShopStock.create({
        shopId: '100',
        shopName: 'Test Shop',
        itemId: '1',
        itemName: 'Test Item',
        type: 'Weapon',
        price: 100,
        in_stock: 50,
      });

      expect(stock.shopId).toBe('100');
      expect(stock.in_stock).toBe(50);
      
      await CityShopStock.deleteOne({ shopId: '100', itemId: '1' });
    });
  });

  describe('ForeignStock Model', () => {
    it('should create a ForeignStock entry', async () => {
      const stock = await ForeignStock.create({
        countryCode: 'mex',
        countryName: 'Mexico',
        itemId: 1,
        itemName: 'Test Item',
        quantity: 100,
        cost: 500,
      });

      expect(stock.countryCode).toBe('mex');
      expect(stock.quantity).toBe(100);
      
      await ForeignStock.deleteOne({ countryCode: 'mex', itemId: 1 });
    });
  });

  describe('ItemMarket Model', () => {
    it('should create an ItemMarket entry', async () => {
      const market = await ItemMarket.create({
        itemId: 1,
        weightedAveragePrice: 125.50,
      });

      expect(market.itemId).toBe(1);
      expect(market.weightedAveragePrice).toBe(125.50);
      
      await ItemMarket.deleteOne({ itemId: 1 });
    });
  });

  describe('CityShopStockHistory Model', () => {
    it('should create a CityShopStockHistory entry', async () => {
      const history = await CityShopStockHistory.create({
        shopId: '100',
        shopName: 'Test Shop',
        itemId: '1',
        itemName: 'Test Item',
        type: 'Weapon',
        price: 100,
        in_stock: 50,
        fetched_at: new Date(),
      });

      expect(history.shopId).toBe('100');
      expect(history.in_stock).toBe(50);
      expect(history.fetched_at).toBeInstanceOf(Date);
      
      await CityShopStockHistory.deleteOne({ _id: history._id });
    });
  });

  describe('ForeignStockHistory Model', () => {
    it('should create a ForeignStockHistory entry', async () => {
      const history = await ForeignStockHistory.create({
        countryCode: 'mex',
        countryName: 'Mexico',
        itemId: 1,
        itemName: 'Test Item',
        quantity: 100,
        cost: 500,
        fetched_at: new Date(),
      });

      expect(history.countryCode).toBe('mex');
      expect(history.quantity).toBe(100);
      expect(history.fetched_at).toBeInstanceOf(Date);
      
      await ForeignStockHistory.deleteOne({ _id: history._id });
    });
  });

  describe('MarketHistory Model', () => {
    it('should create a MarketHistory entry', async () => {
      const history = await MarketHistory.create({
        id: 1,
        name: 'Test Item',
        date: '2025-01-05',
        buy_price: 100,
        market_price: 150,
        profitPer1: 50,
        shop_name: 'Test Shop',
        in_stock: 10,
        sales_24h_current: 5,
        sales_24h_previous: 3,
        trend_24h: 0.67,
        hour_velocity_24: 0.21,
        average_price_items_sold: 145,
        estimated_market_value_profit: 50,
        lowest_50_profit: 45,
        sold_profit: 45,
      });

      expect(history.id).toBe(1);
      expect(history.name).toBe('Test Item');
      expect(history.date).toBe('2025-01-05');
      expect(history.profitPer1).toBe(50);
      
      await MarketHistory.deleteOne({ id: 1, date: '2025-01-05' });
    });

    it('should enforce unique constraint on id and date', async () => {
      const data = {
        id: 2,
        name: 'Test Item 2',
        date: '2025-01-05',
        buy_price: 100,
        market_price: 150,
        profitPer1: 50,
        shop_name: 'Test Shop',
        in_stock: 10,
        sales_24h_current: 5,
        sales_24h_previous: 3,
        trend_24h: 0.67,
        hour_velocity_24: 0.21,
        average_price_items_sold: 145,
        estimated_market_value_profit: 50,
        lowest_50_profit: 45,
        sold_profit: 45,
      };

      await MarketHistory.create(data);

      // Try to create another record with same id and date
      await expect(MarketHistory.create(data)).rejects.toThrow();
      
      await MarketHistory.deleteOne({ id: 2, date: '2025-01-05' });
    });
  });
});
