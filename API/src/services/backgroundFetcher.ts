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

// Configurable rate limit (default 60 requests per minute, can be decreased if needed)
const RATE_LIMIT_PER_MINUTE = parseInt(process.env.TORN_RATE_LIMIT || '60', 10);

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

// Rate limiter: configurable requests per minute
const limiter = new Bottleneck({
  reservoir: RATE_LIMIT_PER_MINUTE,
  reservoirRefreshAmount: RATE_LIMIT_PER_MINUTE,
  reservoirRefreshInterval: 60 * 1000, // 1 minute
  maxConcurrent: 1,
  minTime: Math.floor(60 * 1000 / RATE_LIMIT_PER_MINUTE), // Distribute evenly across the minute
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

// Calculate sell velocity, trend, expected sell time, and 24-hour velocity from historical snapshots
async function calculateVelocityAndTrend(
  country: string,
  itemId: number,
  currentStock: number | null
): Promise<{ 
  sell_velocity: number | null; 
  trend: number | null;
  expected_sell_time_minutes: number | null;
  hour_velocity_24: number | null;
}> {
  try {
    // Fetch the most recent 10 historical snapshots (excluding the current one being saved)
    const snapshots = await MarketSnapshot.find({ country, itemId })
      .sort({ fetched_at: -1 })
      .limit(10)
      .lean();

    if (snapshots.length < 2) {
      // Not enough history
      return { sell_velocity: null, trend: null, expected_sell_time_minutes: null, hour_velocity_24: null };
    }

    // Calculate velocities between consecutive snapshots
    const velocities: number[] = [];

    for (let i = 0; i < snapshots.length - 1; i++) {
      const current = snapshots[i];
      const previous = snapshots[i + 1];

      // Skip if in_stock data is missing
      if (current.in_stock == null || previous.in_stock == null) {
        continue;
      }

      const stockChange = previous.in_stock - current.in_stock;
      
      // Only calculate velocity if stock decreased (items were sold)
      if (stockChange > 0) {
        const timeDiffMs = new Date(current.fetched_at).getTime() - new Date(previous.fetched_at).getTime();
        const minutesElapsed = timeDiffMs / (1000 * 60);

        if (minutesElapsed > 0) {
          const velocity = stockChange / minutesElapsed;
          velocities.push(velocity);
        }
      }
    }

    if (velocities.length === 0) {
      // No valid velocity data
      return { sell_velocity: null, trend: null, expected_sell_time_minutes: null, hour_velocity_24: null };
    }

    // Calculate average sell velocity (units per minute)
    const avgVelocity = velocities.reduce((sum, v) => sum + v, 0) / velocities.length;

    // Calculate trend (rate of change of velocities)
    let trend: number | null = null;
    if (velocities.length >= 2) {
      // Simple linear trend: compare recent velocities to older ones
      const recentVelocities = velocities.slice(0, Math.ceil(velocities.length / 2));
      const olderVelocities = velocities.slice(Math.ceil(velocities.length / 2));

      const recentAvg = recentVelocities.reduce((sum, v) => sum + v, 0) / recentVelocities.length;
      const olderAvg = olderVelocities.reduce((sum, v) => sum + v, 0) / olderVelocities.length;

      // Trend: positive = accelerating, negative = cooling, ~0 = stable
      trend = recentAvg - olderAvg;
    }

    // Calculate expected_sell_time_minutes
    // If we have current stock and positive velocity, estimate how long until sold out
    let expected_sell_time_minutes: number | null = null;
    if (currentStock != null && currentStock > 0 && avgVelocity > 0) {
      expected_sell_time_minutes = currentStock / avgVelocity;
    }

    // Calculate 24_hour_velocity
    // Look at snapshots from the last 24 hours and calculate average velocity
    let hour_velocity_24: number | null = null;
    const now = Date.now();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
    
    // Filter snapshots within 24 hours
    const recent24hSnapshots = snapshots.filter(snapshot => 
      new Date(snapshot.fetched_at).getTime() >= twentyFourHoursAgo
    );

    if (recent24hSnapshots.length >= 2) {
      // Calculate total stock change over 24 hours
      const oldest24h = recent24hSnapshots[recent24hSnapshots.length - 1];
      const newest24h = recent24hSnapshots[0];
      
      if (oldest24h.in_stock != null && newest24h.in_stock != null) {
        const stockChange24h = oldest24h.in_stock - newest24h.in_stock;
        const timeDiff24hMs = new Date(newest24h.fetched_at).getTime() - new Date(oldest24h.fetched_at).getTime();
        const hoursElapsed = timeDiff24hMs / (1000 * 60 * 60);
        
        if (hoursElapsed > 0 && stockChange24h > 0) {
          hour_velocity_24 = stockChange24h / hoursElapsed; // units per hour
        }
      }
    }

    return { 
      sell_velocity: Math.round(avgVelocity * 100) / 100, // Round to 2 decimal places
      trend: trend !== null ? Math.round(trend * 100) / 100 : null,
      expected_sell_time_minutes: expected_sell_time_minutes !== null ? Math.round(expected_sell_time_minutes * 100) / 100 : null,
      hour_velocity_24: hour_velocity_24 !== null ? Math.round(hour_velocity_24 * 100) / 100 : null,
    };
  } catch (error) {
    logError(`Error calculating velocity/trend for item ${itemId} in ${country}`, error instanceof Error ? error : new Error(String(error)));
    return { sell_velocity: null, trend: null, expected_sell_time_minutes: null, hour_velocity_24: null };
  }
}

// Fetch and store detailed market snapshots for tracked items (self-scheduling)
export async function fetchMarketSnapshots(): Promise<void> {
  try {
    const startTime = Date.now();
    logInfo('Fetching market snapshots for tracked items...');

    // Get all tracked items
    const trackedItems = await TrackedItem.find().lean() as Array<{
      country: string;
      itemIds: number[];
    }>;

    if (!trackedItems?.length) {
      logInfo('No tracked items found. Run updateTrackedItems first.');
      // Retry in 1 minute
      setTimeout(() => {
        fetchMarketSnapshots();
      }, 60 * 1000);
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
    let totalApiCalls = 0;

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

          totalApiCalls++;

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

          // Calculate sell velocity, trend, expected sell time, and 24-hour velocity from historical data
          const { sell_velocity, trend, expected_sell_time_minutes, hour_velocity_24 } = await calculateVelocityAndTrend(country, itemId, inStock);

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
            sell_velocity,
            trend,
            expected_sell_time_minutes,
            hour_velocity_24,
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

    const elapsed = Date.now() - startTime;
    const elapsedSeconds = elapsed / 1000;
    
    logInfo(`Successfully stored ${totalSnapshots} market snapshots across all countries`);
    logInfo(`Cycle completed: ${totalApiCalls} API calls in ${elapsedSeconds.toFixed(2)} seconds`);
    
    // Calculate delay to respect rate limit (configurable requests/minute)
    // If we made totalApiCalls requests, we need at least (totalApiCalls / RATE_LIMIT_PER_MINUTE) minutes
    const minRequiredTime = (totalApiCalls / RATE_LIMIT_PER_MINUTE) * 60 * 1000; // milliseconds
    const timeToWait = Math.max(0, minRequiredTime - elapsed);
    
    if (timeToWait > 0) {
      logInfo(`Waiting ${(timeToWait / 1000).toFixed(2)} seconds before next cycle to respect rate limit...`);
    } else {
      logInfo('No wait needed, starting next cycle immediately...');
    }
    
    // Self-schedule next cycle
    setTimeout(() => {
      fetchMarketSnapshots();
    }, timeToWait);
    
  } catch (error) {
    logError('Error fetching market snapshots', error instanceof Error ? error : new Error(String(error)));
    
    // On error, wait 1 minute before retrying
    logInfo('Retrying market snapshots fetch in 1 minute due to error...');
    setTimeout(() => {
      fetchMarketSnapshots();
    }, 60 * 1000); // 1 minute
  }
}

// Initialize and start the scheduler
export function startScheduler(): void {
  logInfo('Starting background fetcher scheduler...');
  logInfo(`Rate limit configured: ${RATE_LIMIT_PER_MINUTE} requests per minute`);

  // Fetch items immediately on startup if needed (every 24 hours)
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

  // Update tracked items immediately on startup
  updateTrackedItems().then(() => {
    // Start self-scheduling market snapshots immediately after tracked items are ready
    logInfo('Tracked items initialized, starting self-scheduling market snapshots...');
    fetchMarketSnapshots();
  }).catch((error) => {
    logError('Failed to initialize tracked items', error instanceof Error ? error : new Error(String(error)));
    // Retry after 1 minute on failure
    logInfo('Retrying tracked items initialization in 1 minute...');
    setTimeout(() => {
      updateTrackedItems().then(() => {
        fetchMarketSnapshots();
      });
    }, 60 * 1000); // 1 minute
  });

  // Schedule tracked items update every 10 minutes
  cron.schedule('*/10 * * * *', () => {
    logInfo('Running scheduled tracked items update...');
    updateTrackedItems();
  });

  logInfo('Background fetcher scheduler started successfully');
}
