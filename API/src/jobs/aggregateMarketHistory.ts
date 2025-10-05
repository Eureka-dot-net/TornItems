import { MarketSnapshot } from '../models/MarketSnapshot';
import { MarketHistory } from '../models/MarketHistory';
import { TornItem } from '../models/TornItem';
import { CityShopStock } from '../models/CityShopStock';
import { ForeignStock } from '../models/ForeignStock';
import { logInfo, logError } from '../utils/logger';

const COUNTRY_CODE_MAP: Record<string, string> = {
  mex: 'Mexico',
  can: 'Canada',
  haw: 'Hawaii',
  jap: 'Japan',
  chi: 'China',
  arg: 'Argentina',
  uni: 'United Kingdom',
  uae: 'United Arab Emirates',
  sou: 'South Africa',
  cay: 'Cayman Islands',
  swi: 'Switzerland',
};

interface AggregatedItemData {
  id: number;
  name: string;
  date: string;
  buy_price: number;
  market_price: number;
  profitPer1: number;
  shop_name: string;
  in_stock: number;
  sales_24h_current: number;
  sales_24h_previous: number;
  trend_24h: number;
  hour_velocity_24: number;
  average_price_items_sold: number;
  estimated_market_value_profit: number;
  lowest_50_profit: number;
  sold_profit: number;
}

/**
 * Aggregates MarketSnapshot data for the past 24 hours into daily summary records
 * This job should run once per day at midnight UTC
 */
export async function aggregateMarketHistory(): Promise<void> {
  const startTime = Date.now();
  logInfo('=== Starting MarketHistory aggregation job ===');

  try {
    // Get current UTC date in YYYY-MM-DD format
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    
    // Calculate 24 hours ago timestamp
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);

    // Fetch all necessary data
    logInfo('Fetching data from database...');
    const [snapshots, items, cityShopStock, foreignStock] = await Promise.all([
      MarketSnapshot.find({ 
        fetched_at: { $gte: new Date(twentyFourHoursAgo) } 
      }).lean(),
      TornItem.find({ buy_price: { $ne: null } }).lean(),
      CityShopStock.find().lean(),
      ForeignStock.find().lean(),
    ]);

    logInfo(`Retrieved ${snapshots.length} snapshots, ${items.length} items`);

    if (snapshots.length === 0) {
      logInfo('No snapshots found in the last 24 hours, skipping aggregation');
      return;
    }

    // Create lookup maps
    const itemMap = new Map(items.map(item => [item.itemId, item]));
    const cityShopStockMap = new Map(
      cityShopStock.map(stock => [stock.itemName.toLowerCase(), stock])
    );
    const foreignStockMap = new Map(
      foreignStock.map(stock => [`${stock.countryCode}:${stock.itemName.toLowerCase()}`, stock])
    );

    // Group snapshots by country:itemId
    const groupedSnapshots = new Map<string, any[]>();
    for (const snapshot of snapshots) {
      const key = `${snapshot.country}:${snapshot.itemId}`;
      if (!groupedSnapshots.has(key)) {
        groupedSnapshots.set(key, []);
      }
      groupedSnapshots.get(key)!.push(snapshot);
    }

    logInfo(`Processing ${groupedSnapshots.size} unique country-item combinations`);

    // Aggregate each group and prepare for upsert
    const aggregatedData: AggregatedItemData[] = [];
    let itemsProcessed = 0;
    let itemsWithErrors = 0;

    for (const [key, itemSnapshots] of groupedSnapshots.entries()) {
      try {
        const [country, itemIdStr] = key.split(':');
        const itemId = parseInt(itemIdStr, 10);
        
        const item = itemMap.get(itemId);
        if (!item) {
          logError(`Item ${itemId} not found in TornItem collection`, new Error('Item not found'));
          itemsWithErrors++;
          continue;
        }

        // Get the most recent snapshot for latest values
        const latestSnapshot = itemSnapshots.sort((a, b) => 
          new Date(b.fetched_at).getTime() - new Date(a.fetched_at).getTime()
        )[0];

        // Calculate averages for numeric fields
        const avgBuyPrice = item.buy_price ?? 0;
        const avgMarketPrice = item.market_price ?? 0;
        const avgProfitPer1 = avgMarketPrice - avgBuyPrice;

        // Get shop name
        const shop_name = item.vendor_name || 'Unknown';

        // Get in_stock value
        let in_stock = 0;
        if (country === 'Torn') {
          const stockEntry = cityShopStockMap.get(item.name.toLowerCase());
          if (stockEntry) {
            in_stock = stockEntry.in_stock ?? 0;
          }
        } else {
          const countryCode = Object.entries(COUNTRY_CODE_MAP).find(
            ([, name]) => name === country
          )?.[0];
          if (countryCode) {
            const foreignKey = `${countryCode}:${item.name.toLowerCase()}`;
            const stockEntry = foreignStockMap.get(foreignKey);
            if (stockEntry) {
              in_stock = stockEntry.quantity ?? 0;
            }
          }
        }

        // Calculate sales metrics from snapshots
        let sales_24h_current = 0;
        let sales_24h_previous = 0;
        let trend_24h = 0;
        let hour_velocity_24 = 0;
        let average_price_items_sold = 0;

        // Use the latest snapshot's metrics
        if (latestSnapshot) {
          sales_24h_current = latestSnapshot.sales_24h_current ?? 0;
          sales_24h_previous = latestSnapshot.sales_24h_previous ?? 0;
          trend_24h = latestSnapshot.trend_24h ?? 0;
          hour_velocity_24 = latestSnapshot.hour_velocity_24 ?? 0;
        }

        // Calculate average_price_items_sold from sales_by_price data
        let totalRevenue = 0;
        let totalItemsSold = 0;
        for (const snapshot of itemSnapshots) {
          if (snapshot.sales_by_price && snapshot.sales_by_price.length > 0) {
            for (const sale of snapshot.sales_by_price) {
              totalItemsSold += sale.amount;
              totalRevenue += sale.amount * sale.price;
            }
          }
        }
        if (totalItemsSold > 0) {
          average_price_items_sold = Math.round(totalRevenue / totalItemsSold);
        }

        // Calculate profit metrics
        const estimated_market_value_profit = avgMarketPrice - avgBuyPrice;

        // Calculate lowest_50_profit from latest snapshot
        let lowest_50_profit = 0;
        if (latestSnapshot && latestSnapshot.listings && latestSnapshot.listings.length > 0) {
          const sortedListings = [...latestSnapshot.listings].sort((a, b) => a.price - b.price);
          let totalPrice = 0;
          let count = 0;
          for (const listing of sortedListings) {
            const itemsToTake = Math.min(listing.amount, 50 - count);
            totalPrice += listing.price * itemsToTake;
            count += itemsToTake;
            if (count >= 50) break;
          }
          if (count > 0) {
            const averageLowest50 = Math.round(totalPrice / count);
            lowest_50_profit = averageLowest50 - avgBuyPrice;
          }
        }

        // Calculate sold_profit
        const sold_profit = average_price_items_sold > 0 
          ? average_price_items_sold - avgBuyPrice 
          : 0;

        aggregatedData.push({
          id: itemId,
          name: item.name,
          date: currentDate,
          buy_price: avgBuyPrice,
          market_price: avgMarketPrice,
          profitPer1: avgProfitPer1,
          shop_name,
          in_stock,
          sales_24h_current,
          sales_24h_previous,
          trend_24h,
          hour_velocity_24,
          average_price_items_sold,
          estimated_market_value_profit,
          lowest_50_profit,
          sold_profit,
        });

        itemsProcessed++;
      } catch (error) {
        logError(`Error processing item from key ${key}`, error instanceof Error ? error : new Error(String(error)));
        itemsWithErrors++;
      }
    }

    // Bulk upsert into MarketHistory
    if (aggregatedData.length > 0) {
      logInfo(`Upserting ${aggregatedData.length} records into MarketHistory...`);
      
      const bulkOps = aggregatedData.map(data => ({
        updateOne: {
          filter: { id: data.id, date: data.date },
          update: { $set: data },
          upsert: true,
        },
      }));

      await MarketHistory.bulkWrite(bulkOps);
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    logInfo('=== MarketHistory aggregation job completed ===', {
      duration: `${duration}s`,
      itemsProcessed,
      itemsWithErrors,
      recordsUpserted: aggregatedData.length,
      date: currentDate,
    });

  } catch (error) {
    logError('MarketHistory aggregation job failed', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}
