import axios from 'axios';
import Bottleneck from 'bottleneck';
import cron from 'node-cron';
import { TornItem } from '../models/TornItem';
import { CityShopStock } from '../models/CityShopStock';
import { ForeignStock } from '../models/ForeignStock';
import { ItemMarket } from '../models/ItemMarket';
import { MarketSnapshot } from '../models/MarketSnapshot';
import { TrackedItem } from '../models/TrackedItem';
import { logInfo, logError } from '../utils/logger';

const API_KEY = process.env.TORN_API_KEY || 'yLp4OoENbjRy30GZ';

// Country code mapping
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

// Rate limiter: 60 requests per minute
const limiter = new Bottleneck({
  reservoir: 60,
  reservoirRefreshAmount: 60,
  reservoirRefreshInterval: 60 * 1000, // 1 minute
  maxConcurrent: 1,
  minTime: 1000, // Minimum 1 second between requests
});

// Exponential backoff retry logic
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error = new Error('Unknown error');
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        const delay = baseDelay * Math.pow(2, i);
        logInfo(`Rate limited, retrying in ${delay}ms...`, { attempt: i + 1 });
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  
  throw lastError;
}

// Fetch and save all Torn items (once per day)
export async function fetchTornItems(): Promise<void> {
  try {
    // Check if we fetched items in the last 24 hours
    const lastItem = await TornItem.findOne().sort({ lastUpdated: -1 });
    if (lastItem && Date.now() - lastItem.lastUpdated.getTime() < 24 * 60 * 60 * 1000) {
      logInfo('Torn items already fetched within the last 24 hours, skipping...');
      return;
    }

    logInfo('Fetching Torn items catalog...');
    
    const response = await retryWithBackoff(() =>
      limiter.schedule(() =>
        axios.get(`https://api.torn.com/v2/torn/items?cat=All&sort=ASC&key=${API_KEY}`)
      )
    ) as { data: { items: any[] } };

    const items = response.data.items;
    if (!items?.length) {
      logError('No items found in Torn v2 response', new Error('Empty items array'));
      return;
    }

    logInfo(`Saving ${items.length} items to database...`);

    // Use bulk operations for better performance
    const bulkOps = items.map((item: any) => ({
      updateOne: {
        filter: { itemId: item.id },
        update: {
          $set: {
            itemId: item.id,
            name: item.name,
            description: item.description,
            type: item.type,
            sub_type: item.sub_type || null,
            is_tradable: item.is_tradable,
            is_found_in_city: item.is_found_in_city,
            vendor_country: item.value?.vendor?.country || null,
            vendor_name: item.value?.vendor?.name || null,
            buy_price: item.value?.buy_price || null,
            sell_price: item.value?.sell_price || null,
            market_price: item.value?.market_price || null,
            lastUpdated: new Date(),
          },
        },
        upsert: true,
      },
    }));

    await TornItem.bulkWrite(bulkOps);
    logInfo(`Successfully saved ${items.length} items to database`);
  } catch (error) {
    logError('Error fetching Torn items', error instanceof Error ? error : new Error(String(error)));
  }
}

// Fetch and save city shop stock (every minute)
export async function fetchCityShopStock(): Promise<void> {
  try {
    logInfo('Fetching city shop stock...');
    
    const response = await retryWithBackoff(() =>
      limiter.schedule(() =>
        axios.get(`https://api.torn.com/v2/torn?selections=cityshops&key=${API_KEY}`)
      )
    ) as { data: { cityshops: any } };

    const cityshops = response.data.cityshops;
    if (!cityshops) {
      logError('Cityshops not found or empty', new Error('Empty cityshops response'));
      return;
    }

    const bulkOps: any[] = [];
    
    for (const [shopId, shopData] of Object.entries(cityshops) as [string, any][]) {
      if (!shopData.inventory) continue;
      
      for (const [itemId, itemData] of Object.entries(shopData.inventory) as [string, any][]) {
        bulkOps.push({
          updateOne: {
            filter: { shopId, itemId },
            update: {
              $set: {
                shopId,
                shopName: shopData.name,
                itemId,
                itemName: itemData.name,
                type: itemData.type,
                price: itemData.price,
                in_stock: itemData.in_stock,
                lastUpdated: new Date(),
              },
            },
            upsert: true,
          },
        });
      }
    }

    if (bulkOps.length > 0) {
      await CityShopStock.bulkWrite(bulkOps);
      logInfo(`Successfully saved ${bulkOps.length} city shop items to database`);
    }
  } catch (error) {
    logError('Error fetching city shop stock', error instanceof Error ? error : new Error(String(error)));
  }
}

// Fetch and save foreign travel stock (every minute)
export async function fetchForeignStock(): Promise<void> {
  try {
    logInfo('Fetching foreign travel stock...');
    
    const response = await retryWithBackoff(() =>
      axios.get('https://yata.yt/api/v1/travel/export/')
    ) as { data: { stocks: any } };

    const stocks = response.data.stocks;
    if (!stocks) {
      logError('YATA travel stock not found or empty', new Error('Empty stocks response'));
      return;
    }

    const bulkOps: any[] = [];
    
    for (const [countryCode, countryData] of Object.entries(stocks) as [string, any][]) {
      const countryName = COUNTRY_CODE_MAP[countryCode] || countryCode;
      
      if (!countryData.stocks) continue;
      
      for (const stock of countryData.stocks) {
        bulkOps.push({
          updateOne: {
            filter: { countryCode, itemId: stock.id },
            update: {
              $set: {
                countryCode,
                countryName,
                itemId: stock.id,
                itemName: stock.name,
                quantity: stock.quantity,
                cost: stock.cost,
                lastUpdated: new Date(),
              },
            },
            upsert: true,
          },
        });
      }
    }

    if (bulkOps.length > 0) {
      await ForeignStock.bulkWrite(bulkOps);
      logInfo(`Successfully saved ${bulkOps.length} foreign stock items to database`);
    }
  } catch (error) {
    logError('Error fetching foreign stock', error instanceof Error ? error : new Error(String(error)));
  }
}

// Determine and update top 10 profitable items per country
export async function updateTrackedItems(): Promise<void> {
  try {
    logInfo('Determining top 10 profitable items per country...');

    // Fetch all items, city shop stock, and foreign stock from MongoDB
    const [items, cityShopStock, foreignStock] = await Promise.all([
      TornItem.find({ buy_price: { $ne: null } }).lean() as Promise<Array<{
        itemId: number;
        name: string;
        description: string;
        type: string;
        vendor_country?: string | null;
        vendor_name?: string | null;
        buy_price?: number | null;
        market_price?: number | null;
      }>>,
      CityShopStock.find().lean() as Promise<Array<{
        shopId: string;
        shopName: string;
        itemId: string;
        itemName: string;
        type: string;
        price: number;
        in_stock: number;
      }>>,
      ForeignStock.find().lean() as Promise<Array<{
        countryCode: string;
        countryName: string;
        itemId: number;
        itemName: string;
        quantity: number;
        cost: number;
      }>>,
    ]);

    if (!items?.length) {
      logError('No items found in database for tracking', new Error('Empty items array'));
      return;
    }

    // Group items by country and calculate profit
    const groupedByCountry: Record<string, Array<{
      itemId: number;
      name: string;
      type: string;
      shopName: string;
      buy_price: number;
      market_price: number;
      profitPer1: number;
      in_stock: number | null;
    }>> = {};

    for (const item of items) {
      const country = item.vendor_country || 'Unknown';
      const shop = item.vendor_name || 'Unknown';
      const buy = item.buy_price ?? 0;
      const market = item.market_price ?? 0;

      // Calculate profit
      const profitPer1 = market && buy ? market - buy : null;
      
      if (profitPer1 === null || profitPer1 <= 0) continue;

      // Get stock info
      let inStock: number | null = null;

      if (country === 'Torn') {
        const match = cityShopStock.find(
          (stock) => stock.itemName?.toLowerCase() === item.name.toLowerCase()
        );
        if (match) {
          inStock = match.in_stock ?? null;
        }
      } else {
        const countryCode = Object.entries(COUNTRY_CODE_MAP).find(
          ([, name]) => name === country
        )?.[0];

        if (countryCode) {
          const match = foreignStock.find(
            (stock) => 
              stock.countryCode === countryCode &&
              stock.itemName.toLowerCase() === item.name.toLowerCase()
          );
          if (match) inStock = match.quantity;
        }
      }

      if (!groupedByCountry[country]) groupedByCountry[country] = [];

      groupedByCountry[country].push({
        itemId: item.itemId,
        name: item.name,
        type: item.type,
        shopName: shop,
        buy_price: buy,
        market_price: market,
        profitPer1,
        in_stock: inStock,
      });
    }

    // For each country, get top 10 profitable items and update TrackedItem collection
    for (const [country, countryItems] of Object.entries(groupedByCountry)) {
      // Sort by profit and take top 10
      const top10 = countryItems
        .sort((a, b) => b.profitPer1 - a.profitPer1)
        .slice(0, 10);

      const itemIds = top10.map(item => item.itemId);
      const itemNames = top10.map(item => item.name);

      // Update tracked items for this country
      await TrackedItem.findOneAndUpdate(
        { country },
        {
          $set: {
            country,
            itemIds,
            lastUpdated: new Date(),
          },
        },
        { upsert: true }
      );

      logInfo(`Tracking top 10 profitable items in ${country}: [${itemNames.join(', ')}]`);
    }

    logInfo('Successfully updated tracked items for all countries');
  } catch (error) {
    logError('Error updating tracked items', error instanceof Error ? error : new Error(String(error)));
  }
}

// Fetch and store detailed market snapshots for tracked items
export async function fetchMarketSnapshots(): Promise<void> {
  try {
    logInfo('Fetching market snapshots for tracked items...');

    // Get all tracked items
    const trackedItems = await TrackedItem.find().lean() as Array<{
      country: string;
      itemIds: number[];
    }>;

    if (!trackedItems?.length) {
      logInfo('No tracked items found. Run updateTrackedItems first.');
      return;
    }

    // Get all items data for reference
    const allItems = await TornItem.find().lean() as Array<{
      itemId: number;
      name: string;
      type: string;
      vendor_name?: string | null;
      buy_price?: number | null;
      market_price?: number | null;
    }>;
    const itemsMap = new Map(allItems.map((item: any) => [item.itemId, item]));

    // Get stock data
    const [cityShopStock, foreignStock] = await Promise.all([
      CityShopStock.find().lean() as Promise<Array<{
        itemName: string;
        in_stock: number;
      }>>,
      ForeignStock.find().lean() as Promise<Array<{
        countryCode: string;
        itemName: string;
        quantity: number;
      }>>,
    ]);

    let totalSnapshots = 0;

    // Process each country
    for (const tracked of trackedItems) {
      const { country, itemIds } = tracked;

      logInfo(`Fetching market data for ${itemIds.length} items in ${country}...`);

      // Fetch market data for each tracked item in this country
      const snapshotPromises = itemIds.map(async (itemId: number) => {
        try {
          const response = await retryWithBackoff(() =>
            limiter.schedule(() =>
              axios.get(`https://api.torn.com/v2/market/${itemId}/itemmarket?limit=20&key=${API_KEY}`)
            )
          ) as { data: { itemmarket: any } };

          const itemmarket = response.data.itemmarket;
          if (!itemmarket) {
            return null;
          }

          const item = itemsMap.get(itemId);
          if (!item) {
            return null;
          }

          // Get stock info
          let inStock: number | null = null;

          if (country === 'Torn') {
            const match = cityShopStock.find(
              (stock: any) => stock.itemName?.toLowerCase() === item.name.toLowerCase()
            );
            if (match) {
              inStock = match.in_stock ?? null;
            }
          } else {
            const countryCode = Object.entries(COUNTRY_CODE_MAP).find(
              ([, name]) => name === country
            )?.[0];

            if (countryCode) {
              const match = foreignStock.find(
                (stock: any) => 
                  stock.countryCode === countryCode &&
                  stock.itemName.toLowerCase() === item.name.toLowerCase()
              );
              if (match) inStock = match.quantity;
            }
          }

          const buy = item.buy_price ?? 0;
          const market = itemmarket.item?.average_price ?? item.market_price ?? 0;
          const profitPer1 = market && buy ? market - buy : 0;

          // Create snapshot
          const snapshot = new MarketSnapshot({
            country,
            itemId: itemmarket.item?.id ?? itemId,
            name: itemmarket.item?.name ?? item.name,
            type: itemmarket.item?.type ?? item.type,
            shopName: item.vendor_name,
            buy_price: buy,
            market_price: market,
            profitPer1,
            in_stock: inStock,
            listings: itemmarket.listings?.map((listing: any) => ({
              price: listing.price,
              amount: listing.amount,
            })) ?? [],
            cache_timestamp: itemmarket.cache_timestamp ?? Date.now(),
            fetched_at: new Date(),
          });

          await snapshot.save();
          totalSnapshots++;

          return snapshot;
        } catch (error) {
          logError(`Error fetching market data for item ${itemId} in ${country}`, error instanceof Error ? error : new Error(String(error)));
          return null;
        }
      });

      await Promise.all(snapshotPromises);
      logInfo(`Stored ${itemIds.length} listings for ${country} in MongoDB`);
    }

    logInfo(`Successfully stored ${totalSnapshots} market snapshots across all countries`);
  } catch (error) {
    logError('Error fetching market snapshots', error instanceof Error ? error : new Error(String(error)));
  }
}

// Initialize and start the scheduler
export function startScheduler(): void {
  logInfo('Starting background fetcher scheduler...');

  // Fetch items immediately on startup if needed
  fetchTornItems();

  // Schedule daily item fetch at 3 AM
  cron.schedule('0 3 * * *', () => {
    logInfo('Running scheduled Torn items fetch...');
    fetchTornItems();
  });

  // Schedule city shop stock fetch every minute
  cron.schedule('* * * * *', () => {
    fetchCityShopStock();
  });

  // Schedule foreign stock fetch every minute
  cron.schedule('* * * * *', () => {
    fetchForeignStock();
  });

  // Update tracked items (top 10 per country) every 10 minutes
  cron.schedule('*/10 * * * *', () => {
    logInfo('Running scheduled tracked items update...');
    updateTrackedItems();
  });

  // Run initial tracked items update after 1 minute to ensure data is available
  setTimeout(() => {
    updateTrackedItems();
  }, 60000);

  // Schedule market snapshots fetch every 2 minutes
  cron.schedule('*/2 * * * *', () => {
    logInfo('Running scheduled market snapshots fetch...');
    fetchMarketSnapshots();
  });

  logInfo('Background fetcher scheduler started successfully');
}
