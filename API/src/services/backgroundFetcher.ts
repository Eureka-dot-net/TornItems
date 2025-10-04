import axios from 'axios';
import Bottleneck from 'bottleneck';
import cron from 'node-cron';
import { TornItem } from '../models/TornItem';
import { CityShopStock } from '../models/CityShopStock';
import { ForeignStock } from '../models/ForeignStock';
import { ItemMarket } from '../models/ItemMarket';
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

// Selected profitable items to track market prices for
const TRACKED_ITEMS = [
  1, 2, 3, 4, 5, // Add actual profitable item IDs here
];

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
    );

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
    );

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
    );

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

// Fetch and save market prices for selected items (every minute)
export async function fetchMarketPrices(): Promise<void> {
  try {
    logInfo(`Fetching market prices for ${TRACKED_ITEMS.length} items...`);
    
    const promises = TRACKED_ITEMS.map(async (itemId) => {
      try {
        const response = await retryWithBackoff(() =>
          limiter.schedule(() =>
            axios.get(`https://api.torn.com/v2/market/${itemId}/itemmarket?key=${API_KEY}`)
          )
        );

        const itemmarket = response.data.itemmarket;
        if (!itemmarket?.listings?.length) {
          return;
        }

        // Compute weighted average price of cheapest 50 units
        const listings = itemmarket.listings.sort((a: any, b: any) => a.price - b.price);
        let totalUnits = 0;
        let totalCost = 0;

        for (const listing of listings) {
          const unitsToTake = Math.min(listing.amount, 50 - totalUnits);
          totalCost += listing.price * unitsToTake;
          totalUnits += unitsToTake;

          if (totalUnits >= 50) break;
        }

        const weightedAverage = totalUnits > 0 ? totalCost / totalUnits : 0;

        await ItemMarket.findOneAndUpdate(
          { itemId },
          {
            $set: {
              itemId,
              weightedAveragePrice: weightedAverage,
              timestamp: new Date(),
            },
          },
          { upsert: true }
        );
      } catch (error) {
        logError(`Error fetching market price for item ${itemId}`, error instanceof Error ? error : new Error(String(error)));
      }
    });

    await Promise.all(promises);
    logInfo('Successfully updated market prices');
  } catch (error) {
    logError('Error in market prices batch', error instanceof Error ? error : new Error(String(error)));
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

  // Schedule market prices fetch every minute (if we have tracked items)
  if (TRACKED_ITEMS.length > 0) {
    cron.schedule('* * * * *', () => {
      fetchMarketPrices();
    });
  }

  logInfo('Background fetcher scheduler started successfully');
}
