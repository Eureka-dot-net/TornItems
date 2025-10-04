import { TornItem } from '../src/models/TornItem';
import { CityShopStock } from '../src/models/CityShopStock';
import { ForeignStock } from '../src/models/ForeignStock';
import { ItemMarket } from '../src/models/ItemMarket';

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
});
