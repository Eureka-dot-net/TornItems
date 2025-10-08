import { TornItem } from '../src/models/TornItem';
import { CityShopStock } from '../src/models/CityShopStock';
import { CityShopStockHistory } from '../src/models/CityShopStockHistory';
import { ForeignStock } from '../src/models/ForeignStock';
import { ForeignStockHistory } from '../src/models/ForeignStockHistory';
import { ItemMarket } from '../src/models/ItemMarket';
import { MarketHistory } from '../src/models/MarketHistory';
import { StockPriceSnapshot } from '../src/models/StockPriceSnapshot';
import { UserStockHoldingSnapshot } from '../src/models/UserStockHoldingSnapshot';
import { MarketWatchlistItem } from '../src/models/MarketWatchlistItem';
import { StockTransactionHistory } from '../src/models/StockTransactionHistory';
import { StockHoldingLot } from '../src/models/StockHoldingLot';

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

  describe('StockPriceSnapshot Model', () => {
    it('should create a StockPriceSnapshot entry', async () => {
      const snapshot = await StockPriceSnapshot.create({
        stock_id: 1,
        ticker: 'TSB',
        name: 'Torn & Shanghai Banking',
        price: 1139.91,
        timestamp: new Date(),
      });

      expect(snapshot.stock_id).toBe(1);
      expect(snapshot.ticker).toBe('TSB');
      expect(snapshot.name).toBe('Torn & Shanghai Banking');
      expect(snapshot.price).toBe(1139.91);
      expect(snapshot.timestamp).toBeInstanceOf(Date);
      
      await StockPriceSnapshot.deleteOne({ _id: snapshot._id });
    });

    it('should have compound index on ticker and timestamp', async () => {
      const indexes = await StockPriceSnapshot.collection.getIndexes();
      
      // Check if compound index exists
      const hasCompoundIndex = Object.keys(indexes).some(key => 
        indexes[key].some((field: any) => field[0] === 'ticker' && field[1] === 1) &&
        indexes[key].some((field: any) => field[0] === 'timestamp' && field[1] === -1)
      );
      
      expect(hasCompoundIndex || indexes['ticker_1_timestamp_-1']).toBeTruthy();
    });
  });

  describe('UserStockHoldingSnapshot Model', () => {
    it('should create a UserStockHoldingSnapshot entry', async () => {
      const snapshot = await UserStockHoldingSnapshot.create({
        stock_id: 25,
        total_shares: 1061192,
        avg_buy_price: 103.44,
        transaction_count: 2,
        timestamp: new Date(),
      });

      expect(snapshot.stock_id).toBe(25);
      expect(snapshot.total_shares).toBe(1061192);
      expect(snapshot.avg_buy_price).toBe(103.44);
      expect(snapshot.transaction_count).toBe(2);
      expect(snapshot.timestamp).toBeInstanceOf(Date);
      
      await UserStockHoldingSnapshot.deleteOne({ _id: snapshot._id });
    });

    it('should allow null avg_buy_price', async () => {
      const snapshot = await UserStockHoldingSnapshot.create({
        stock_id: 2,
        total_shares: 0,
        avg_buy_price: null,
        transaction_count: 0,
        timestamp: new Date(),
      });

      expect(snapshot.stock_id).toBe(2);
      expect(snapshot.avg_buy_price).toBeNull();
      
      await UserStockHoldingSnapshot.deleteOne({ _id: snapshot._id });
    });

    it('should have compound index on stock_id and timestamp', async () => {
      const indexes = await UserStockHoldingSnapshot.collection.getIndexes();
      
      // Check if compound index exists
      const hasCompoundIndex = Object.keys(indexes).some(key => 
        indexes[key].some((field: any) => field[0] === 'stock_id' && field[1] === 1) &&
        indexes[key].some((field: any) => field[0] === 'timestamp' && field[1] === -1)
      );
      
      expect(hasCompoundIndex || indexes['stock_id_1_timestamp_-1']).toBeTruthy();
    });
  });

  describe('MarketWatchlistItem Model', () => {
    it('should create a MarketWatchlistItem entry', async () => {
      const watchlistItem = await MarketWatchlistItem.create({
        itemId: 18,
        name: 'Xanax',
        alert_below: 830000,
        discordUserId: '123456789',
        apiKey: 'test_encrypted_key',
        guildId: '987654321',
        channelId: '111222333',
        enabled: true,
      });

      expect(watchlistItem.itemId).toBe(18);
      expect(watchlistItem.name).toBe('Xanax');
      expect(watchlistItem.alert_below).toBe(830000);
      expect(watchlistItem.discordUserId).toBe('123456789');
      expect(watchlistItem.guildId).toBe('987654321');
      expect(watchlistItem.channelId).toBe('111222333');
      expect(watchlistItem.enabled).toBe(true);
      expect(watchlistItem.lastAlertPrice).toBeNull();
      expect(watchlistItem.lastAlertTimestamp).toBeNull();
      
      await MarketWatchlistItem.deleteOne({ _id: watchlistItem._id });
    });

    it('should update lastAlertPrice and lastAlertTimestamp', async () => {
      const watchlistItem = await MarketWatchlistItem.create({
        itemId: 23,
        name: 'Erotic DVD',
        alert_below: 4600000,
        discordUserId: '123456789',
        apiKey: 'test_encrypted_key',
        guildId: '987654321',
        channelId: '111222333',
        enabled: true,
      });

      const alertPrice = 4500000;
      const alertTime = new Date();

      await MarketWatchlistItem.updateOne(
        { _id: watchlistItem._id },
        { 
          lastAlertPrice: alertPrice,
          lastAlertTimestamp: alertTime
        }
      );

      const updated = await MarketWatchlistItem.findOne({ _id: watchlistItem._id });
      expect(updated?.lastAlertPrice).toBe(alertPrice);
      expect(updated?.lastAlertTimestamp).toBeInstanceOf(Date);
      
      await MarketWatchlistItem.deleteOne({ _id: watchlistItem._id });
    });

    it('should enforce unique constraint on discordUserId and itemId combination', async () => {
      const data = {
        itemId: 99,
        name: 'Test Item',
        alert_below: 1000000,
        discordUserId: '123456789',
        apiKey: 'test_encrypted_key',
        guildId: '987654321',
        channelId: '111222333',
        enabled: true,
      };

      await MarketWatchlistItem.create(data);

      await expect(
        MarketWatchlistItem.create(data)
      ).rejects.toThrow();
      
      await MarketWatchlistItem.deleteOne({ discordUserId: '123456789', itemId: 99 });
    });

    it('should allow different users to watch the same item', async () => {
      const item1 = await MarketWatchlistItem.create({
        itemId: 99,
        name: 'Test Item',
        alert_below: 1000000,
        discordUserId: '123456789',
        apiKey: 'test_encrypted_key_1',
        guildId: '987654321',
        channelId: '111222333',
        enabled: true,
      });

      const item2 = await MarketWatchlistItem.create({
        itemId: 99,
        name: 'Test Item',
        alert_below: 1000000,
        discordUserId: '987654321',
        apiKey: 'test_encrypted_key_2',
        guildId: '987654321',
        channelId: '444555666',
        enabled: true,
      });

      expect(item1.itemId).toBe(99);
      expect(item2.itemId).toBe(99);
      expect(item1.discordUserId).not.toBe(item2.discordUserId);
      
      await MarketWatchlistItem.deleteMany({ itemId: 99 });
    });
  });

  describe('StockHoldingLot Model', () => {
    it('should create a buy lot', async () => {
      const lot = await StockHoldingLot.create({
        stock_id: 22,
        ticker: 'HRG',
        name: 'Helayne Robertson Group',
        shares_total: 10000,
        shares_remaining: 10000,
        bought_price: 590.50,
        score_at_buy: 5.23,
        recommendation_at_buy: 'STRONG_BUY',
        timestamp: new Date(),
        fully_sold: false,
      });

      expect(lot.stock_id).toBe(22);
      expect(lot.ticker).toBe('HRG');
      expect(lot.shares_total).toBe(10000);
      expect(lot.shares_remaining).toBe(10000);
      expect(lot.bought_price).toBe(590.50);
      expect(lot.score_at_buy).toBe(5.23);
      expect(lot.recommendation_at_buy).toBe('STRONG_BUY');
      expect(lot.fully_sold).toBe(false);
      
      await StockHoldingLot.deleteOne({ _id: lot._id });
    });

    it('should have compound index on stock_id and timestamp', async () => {
      const indexes = await StockHoldingLot.collection.getIndexes();
      
      // Check if compound index exists
      const hasCompoundIndex = Object.keys(indexes).some(key => 
        indexes[key].some((field: any) => field[0] === 'stock_id' && field[1] === 1) &&
        indexes[key].some((field: any) => field[0] === 'timestamp' && field[1] === 1)
      );
      
      expect(hasCompoundIndex || indexes['stock_id_1_timestamp_1']).toBeTruthy();
    });
  });

  describe('StockTransactionHistory Model', () => {
    it('should create a SELL transaction with profit', async () => {
      // First create a holding lot
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

      const transaction = await StockTransactionHistory.create({
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

      expect(transaction.stock_id).toBe(22);
      expect(transaction.ticker).toBe('HRG');
      expect(transaction.action).toBe('SELL');
      expect(transaction.shares_sold).toBe(10000);
      expect(transaction.profit_per_share).toBe(14.12);
      expect(transaction.total_profit).toBe(141200);
      expect(transaction.score_at_buy).toBe(5.23);
      expect(transaction.recommendation_at_buy).toBe('STRONG_BUY');
      expect(transaction.score_at_sale).toBe(6.27);
      expect(transaction.recommendation_at_sale).toBe('STRONG_BUY');
      expect(transaction.linked_buy_id?.toString()).toBe(lot._id?.toString());
      
      await StockTransactionHistory.deleteOne({ _id: transaction._id });
      await StockHoldingLot.deleteOne({ _id: lot._id });
    });

    it('should have compound index on stock_id and timestamp', async () => {
      const indexes = await StockTransactionHistory.collection.getIndexes();
      
      // Check if compound index exists
      const hasCompoundIndex = Object.keys(indexes).some(key => 
        indexes[key].some((field: any) => field[0] === 'stock_id' && field[1] === 1) &&
        indexes[key].some((field: any) => field[0] === 'timestamp' && field[1] === -1)
      );
      
      expect(hasCompoundIndex || indexes['stock_id_1_timestamp_-1']).toBeTruthy();
    });

    it('should have index on timestamp for sorting', async () => {
      const indexes = await StockTransactionHistory.collection.getIndexes();
      expect(indexes['timestamp_-1']).toBeTruthy();
    });
  });
});
