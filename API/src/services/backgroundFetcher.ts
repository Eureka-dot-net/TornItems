import axios from 'axios';
import Bottleneck from 'bottleneck';
import cron from 'node-cron';
import { TornItem } from '../models/TornItem';
import { CityShopStock } from '../models/CityShopStock';
import { CityShopStockHistory } from '../models/CityShopStockHistory';
import { ForeignStock } from '../models/ForeignStock';
import { ForeignStockHistory } from '../models/ForeignStockHistory';
import { MarketSnapshot } from '../models/MarketSnapshot';
import { MonitoredItem } from '../models/MonitoredItem';
import { ShopItemState } from '../models/ShopItemState';
import { logInfo, logError } from '../utils/logger';
import { aggregateMarketHistory } from '../jobs/aggregateMarketHistory';
import { roundUpToNextQuarterHour, minutesBetween } from '../utils/dateHelpers';

const API_KEY = process.env.TORN_API_KEY || 'yLp4OoENbjRy30GZ';

// Configurable rate limit (default 60 requests per minute, can be decreased if needed)
const RATE_LIMIT_PER_MINUTE = parseInt(process.env.TORN_RATE_LIMIT || '60', 10);

// Curiosity rate - percentage of budget to reserve for random checks of quiet items (default 5%)
const CURIOSITY_RATE = parseFloat(process.env.CURIOSITY_RATE || '0.05');

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
    const historyDocs: any[] = [];
    const fetchedAt = new Date();
    
    // Track which (shopId, itemId) pairs are present in the current API response
    const currentInventoryKeys = new Set<string>();
    
    for (const [shopId, shopData] of Object.entries(cityshops) as [string, any][]) {
      if (!shopData.inventory) continue;
      
      for (const [itemId, itemData] of Object.entries(shopData.inventory) as [string, any][]) {
        const inventoryKey = `${shopId}:${itemId}`;
        currentInventoryKeys.add(inventoryKey);
        
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

        // Add to history
        historyDocs.push({
          shopId,
          shopName: shopData.name,
          itemId,
          itemName: itemData.name,
          type: itemData.type,
          price: itemData.price,
          in_stock: itemData.in_stock,
          fetched_at: fetchedAt,
        });
        
        // Track shop item state transitions
        await trackShopItemState(
          shopId,
          shopData.name,
          itemId,
          itemData.name,
          itemData.type,
          itemData.price,
          itemData.in_stock,
          fetchedAt
        );
      }
    }

    // Handle items that are now out of stock (not in API response but were tracked before)
    // The API doesn't return items with 0 stock, so we need to detect sellouts manually
    // Get all city shop items (exclude foreign shops which use country codes as shopId)
    const previouslyTrackedItems = await ShopItemState.find({
      in_stock: { $gt: 0 },
      shopId: { $nin: Object.keys(COUNTRY_CODE_MAP) }
    }).lean();
    
    for (const previousItem of previouslyTrackedItems) {
      const inventoryKey = `${previousItem.shopId}:${previousItem.itemId}`;
      
      // If this item was in stock before but is not in the current API response, it's now out of stock
      if (!currentInventoryKeys.has(inventoryKey)) {
        // Update CityShopStock to reflect 0 stock
        bulkOps.push({
          updateOne: {
            filter: { shopId: previousItem.shopId, itemId: previousItem.itemId },
            update: {
              $set: {
                in_stock: 0,
                lastUpdated: fetchedAt,
              },
            },
          },
        });
        
        // Add to history with 0 stock
        historyDocs.push({
          shopId: previousItem.shopId,
          shopName: previousItem.shopName,
          itemId: previousItem.itemId,
          itemName: previousItem.itemName,
          type: previousItem.type,
          price: previousItem.price,
          in_stock: 0,
          fetched_at: fetchedAt,
        });
        
        // Track the sellout transition
        await trackShopItemState(
          previousItem.shopId,
          previousItem.shopName,
          previousItem.itemId,
          previousItem.itemName,
          previousItem.type,
          previousItem.price,
          0,  // Current stock is 0
          fetchedAt
        );
      }
    }

    if (bulkOps.length > 0) {
      await CityShopStock.bulkWrite(bulkOps);
      logInfo(`Successfully saved ${bulkOps.length} city shop items to database`);
      
      // Save history
      await CityShopStockHistory.insertMany(historyDocs);
      logInfo(`Successfully saved ${historyDocs.length} city shop stock history entries`);
    }
  } catch (error) {
    logError('Error fetching city shop stock', error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Track shop item state transitions (sellout and restock)
 * This function detects when items sell out or restock and calculates relevant metrics
 */
async function trackShopItemState(
  shopId: string,
  shopName: string,
  itemId: string,
  itemName: string,
  type: string,
  price: number,
  currentStock: number,
  fetchedAt: Date
): Promise<void> {
  try {
    // Retrieve previous state for this shop item
    const previousState = await ShopItemState.findOne({ shopId, itemId });
    
    // Prepare the base update object
    const updateData: any = {
      shopId,
      shopName,
      itemId,
      itemName,
      type,
      price,
      in_stock: currentStock,
      lastUpdated: fetchedAt,
    };
    
    if (!previousState) {
      // First time seeing this item - initialize with current stock
      if (currentStock > 0) {
        updateData.lastRestockTime = fetchedAt;
      }
      
      await ShopItemState.create(updateData);
      return;
    }
    
    const previousStock = previousState.in_stock;
    
    // Detect sellout: previous stock > 0 → current stock = 0
    if (previousStock > 0 && currentStock === 0) {
      updateData.lastSelloutTime = fetchedAt;
      
      // Calculate sellout duration if we have a restock time
      if (previousState.lastRestockTime) {
        const selloutDuration = minutesBetween(previousState.lastRestockTime, fetchedAt);
        updateData.selloutDurationMinutes = Math.round(selloutDuration * 100) / 100;
        
        // Update rolling average for sellout duration (optional)
        if (previousState.averageSelloutMinutes !== undefined && previousState.averageSelloutMinutes !== null) {
          updateData.averageSelloutMinutes = 
            Math.round(((previousState.averageSelloutMinutes + selloutDuration) / 2) * 100) / 100;
        } else {
          updateData.averageSelloutMinutes = selloutDuration;
        }
        
        logInfo(`[Sellout] ${itemName} sold out in ${selloutDuration.toFixed(1)} min`);
      }
    }
    
    // Detect restock: current stock > previous stock (stock increased)
    if (currentStock > previousStock) {
      // Calculate cycles skipped since last restock (if we have a previous restock time)
      if (previousState.lastRestockTime) {
        const expectedRestockTime = roundUpToNextQuarterHour(previousState.lastRestockTime);
        const timeSinceLastRestock = minutesBetween(expectedRestockTime, fetchedAt);
        const cyclesSkipped = Math.max(0, Math.round(timeSinceLastRestock / 15));
        
        updateData.cyclesSkipped = cyclesSkipped;
        
        // Update rolling average for cycles skipped (optional)
        if (previousState.averageCyclesSkipped !== undefined && previousState.averageCyclesSkipped !== null) {
          updateData.averageCyclesSkipped = 
            Math.round(((previousState.averageCyclesSkipped + cyclesSkipped) / 2) * 100) / 100;
        } else {
          updateData.averageCyclesSkipped = cyclesSkipped;
        }
        
        const lastRestockTimeStr = previousState.lastRestockTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        const newRestockTimeStr = fetchedAt.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        
        logInfo(`[Restock] ${itemName} restocked after skipping ${cyclesSkipped} cycles (last restock ${lastRestockTimeStr}, new restock ${newRestockTimeStr})`);
      } else {
        // First restock we've seen for this item
        logInfo(`[Restock] ${itemName} restocked (stock increased from ${previousStock} to ${currentStock})`);
      }
      
      updateData.lastRestockTime = fetchedAt;
    }
    
    // Update the state
    await ShopItemState.updateOne(
      { shopId, itemId },
      { $set: updateData },
      { upsert: true }
    );
    
  } catch (error) {
    logError(
      `Error tracking shop item state for ${itemName} (shop: ${shopId}, item: ${itemId})`,
      error instanceof Error ? error : new Error(String(error))
    );
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
    const historyDocs: any[] = [];
    const fetchedAt = new Date();
    
    // Track which (countryCode, itemId) pairs are present in the current API response
    const currentInventoryKeys = new Set<string>();
    
    for (const [countryCode, countryData] of Object.entries(stocks) as [string, any][]) {
      const countryName = COUNTRY_CODE_MAP[countryCode] || countryCode;
      
      if (!countryData.stocks) continue;
      
      for (const stock of countryData.stocks) {
        const inventoryKey = `${countryCode}:${stock.id}`;
        currentInventoryKeys.add(inventoryKey);
        
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

        // Add to history
        historyDocs.push({
          countryCode,
          countryName,
          itemId: stock.id,
          itemName: stock.name,
          quantity: stock.quantity,
          cost: stock.cost,
          fetched_at: fetchedAt,
        });
        
        // Track foreign stock item state transitions
        await trackShopItemState(
          countryCode,          // Use countryCode as shopId
          countryName,          // Use countryName as shopName
          String(stock.id),     // itemId as string
          stock.name,           // itemName
          'Foreign',            // type
          stock.cost,           // price
          stock.quantity,       // in_stock (quantity for foreign)
          fetchedAt
        );
      }
    }

    // Handle items that are now out of stock (not in API response but were tracked before)
    // Similar to city shops, foreign stocks may not return items with 0 quantity
    const previouslyTrackedItems = await ShopItemState.find({
      shopId: { $in: Object.keys(COUNTRY_CODE_MAP) },
      in_stock: { $gt: 0 }
    }).lean();
    
    for (const previousItem of previouslyTrackedItems) {
      const inventoryKey = `${previousItem.shopId}:${previousItem.itemId}`;
      
      // If this item was in stock before but is not in the current API response, it's now out of stock
      if (!currentInventoryKeys.has(inventoryKey)) {
        // Update ForeignStock to reflect 0 quantity
        bulkOps.push({
          updateOne: {
            filter: { countryCode: previousItem.shopId, itemId: previousItem.itemId },
            update: {
              $set: {
                quantity: 0,
                lastUpdated: fetchedAt,
              },
            },
          },
        });
        
        // Add to history with 0 quantity
        historyDocs.push({
          countryCode: previousItem.shopId,
          countryName: previousItem.shopName,
          itemId: previousItem.itemId,
          itemName: previousItem.itemName,
          quantity: 0,
          cost: previousItem.price,
          fetched_at: fetchedAt,
        });
        
        // Track the sellout transition
        await trackShopItemState(
          previousItem.shopId,
          previousItem.shopName,
          previousItem.itemId,
          previousItem.itemName,
          previousItem.type,
          previousItem.price,
          0,  // Current stock is 0
          fetchedAt
        );
      }
    }

    if (bulkOps.length > 0) {
      await ForeignStock.bulkWrite(bulkOps);
      logInfo(`Successfully saved ${bulkOps.length} foreign stock items to database`);
      
      // Save history
      await ForeignStockHistory.insertMany(historyDocs);
      logInfo(`Successfully saved ${historyDocs.length} foreign stock history entries`);
    }
  } catch (error) {
    logError('Error fetching foreign stock', error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Update monitored items - tracks ALL items with positive profit (market_price - buy_price > 0)
 * Each item gets adaptive monitoring with MonitorFrequency field
 */
export async function updateMonitoredItems(): Promise<void> {
  try {
    logInfo('Updating monitored items (all items with profit > 0)...');

    // Fetch all items from MongoDB
    const items = await TornItem.find({ buy_price: { $ne: null } }).lean() as Array<{
      itemId: number;
      name: string;
      description: string;
      type: string;
      vendor_country?: string | null;
      vendor_name?: string | null;
      buy_price?: number | null;
      market_price?: number | null;
    }>;

    if (!items?.length) {
      logError('No items found in database for monitoring', new Error('Empty items array'));
      return;
    }

    const bulkOps: any[] = [];

    for (const item of items) {
      const country = item.vendor_country || 'Unknown';
      const buy = item.buy_price ?? 0;
      const market = item.market_price ?? 0;

      // Calculate profit - only monitor items with positive profit
      const profitPer1 = market && buy ? market - buy : null;
      
      if (profitPer1 === null || profitPer1 <= 0) continue;

      // Add or update this item in MonitoredItem collection
      bulkOps.push({
        updateOne: {
          filter: { country, itemId: item.itemId },
          update: {
            $set: {
              country,
              itemId: item.itemId,
              name: item.name,
              lastUpdated: new Date(),
            },
            $setOnInsert: {
              // Only set these on first insert, not on updates
              MonitorFrequency: 1,
              cycles_since_last_check: 0,
              lastCheckedData: {
                stock: null,
                price: null,
                sales: null,
              },
              lastCheckTimestamp: new Date(),
            },
          },
          upsert: true,
        },
      });
    }

    if (bulkOps.length > 0) {
      await MonitoredItem.bulkWrite(bulkOps);
      logInfo(`Successfully updated ${bulkOps.length} monitored items with positive profit`);
    }

  } catch (error) {
    logError('Error updating monitored items', error instanceof Error ? error : new Error(String(error)));
  }
}

// Calculate 24-hour sales metrics from historical snapshots
// Uses LISTINGS data (market sales) not in_stock (shop inventory)
async function calculate24HourMetrics(
  country: string,
  itemId: number,
  currentListings: { price: number; amount: number }[]
): Promise<{ 
  items_sold: number | null;
  total_revenue_sold: number | null;
  sales_by_price: { price: number; amount: number }[];
  has_delisted: boolean;
  sales_24h_current: number | null;
  sales_24h_previous: number | null;
  total_revenue_24h_current: number | null;
  trend_24h: number | null;
  hour_velocity_24: number | null;
}> {
  try {
    // Fetch all snapshots from the last 48 hours to calculate both current and previous 24h periods
    const fortyEightHoursAgo = Date.now() - (48 * 60 * 60 * 1000);
    const snapshots = await MarketSnapshot.find({ 
      country, 
      itemId,
      fetched_at: { $gte: new Date(fortyEightHoursAgo) }
    })
      .sort({ fetched_at: -1 })
      .lean();

    if (snapshots.length < 1) {
      // Not enough history - this is the first snapshot
      return { items_sold: null, total_revenue_sold: null, sales_by_price: [], has_delisted: false, sales_24h_current: null, sales_24h_previous: null, total_revenue_24h_current: null, trend_24h: null, hour_velocity_24: null };
    }

    // Calculate items sold and revenue between current snapshot and most recent previous snapshot
    const previousSnapshot = snapshots[0];
    const { itemsSold, totalRevenue, salesByPrice, hasDelisted } = calculateItemsSoldAndRevenueBetweenSnapshots(previousSnapshot.listings, currentListings);

    if (snapshots.length < 2) {
      // Only one previous snapshot, can't calculate 24h metrics yet
      return { items_sold: itemsSold, total_revenue_sold: totalRevenue, sales_by_price: salesByPrice, has_delisted: hasDelisted, sales_24h_current: null, sales_24h_previous: null, total_revenue_24h_current: null, trend_24h: null, hour_velocity_24: null };
    }

    const now = Date.now();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
    
    // Calculate sales in the last 24 hours (current period)
    const current24hSnapshots = snapshots.filter(snapshot => 
      new Date(snapshot.fetched_at).getTime() >= twentyFourHoursAgo
    );

    let sales_24h_current: number | null = null;
    let total_revenue_24h_current: number | null = null;
    if (current24hSnapshots.length >= 1) {
      // Calculate total items sold in 24h period by comparing oldest to newest snapshot in that period
      const oldestIn24h = current24hSnapshots[current24hSnapshots.length - 1];
      const newestIn24h = currentListings; // Current listings we're about to save
      const result = calculateItemsSoldAndRevenueBetweenSnapshots(oldestIn24h.listings, newestIn24h);
      sales_24h_current = result.itemsSold;
      total_revenue_24h_current = result.totalRevenue;
    }

    // Calculate sales in the previous 24-hour period (24h-48h ago)
    const previous24hSnapshots = snapshots.filter(snapshot => {
      const time = new Date(snapshot.fetched_at).getTime();
      return time >= fortyEightHoursAgo && time < twentyFourHoursAgo;
    });

    let sales_24h_previous: number | null = null;
    if (previous24hSnapshots.length >= 1 && current24hSnapshots.length >= 1) {
      // Calculate total items sold in previous 24h period
      // Compare oldest snapshot in previous period to oldest snapshot in current period
      const oldestInPrevious = previous24hSnapshots[previous24hSnapshots.length - 1];
      const oldestInCurrent = current24hSnapshots[current24hSnapshots.length - 1];
      const result = calculateItemsSoldAndRevenueBetweenSnapshots(oldestInPrevious.listings, oldestInCurrent.listings);
      sales_24h_previous = result.itemsSold;
    }

    // Calculate trend_24h (percentage change from previous to current)
    let trend_24h: number | null = null;
    if (sales_24h_current !== null && sales_24h_previous !== null && sales_24h_previous > 0) {
      trend_24h = (sales_24h_current - sales_24h_previous) / sales_24h_previous;
    }

    // Calculate hour_velocity_24 (sales per hour over last 24 hours)
    let hour_velocity_24: number | null = null;
    if (sales_24h_current !== null && sales_24h_current > 0) {
      hour_velocity_24 = sales_24h_current / 24;
    }

    return { 
      items_sold: itemsSold,
      total_revenue_sold: totalRevenue,
      sales_by_price: salesByPrice,
      has_delisted: hasDelisted,
      sales_24h_current: sales_24h_current,
      sales_24h_previous: sales_24h_previous,
      total_revenue_24h_current: total_revenue_24h_current,
      trend_24h: trend_24h !== null ? Math.round(trend_24h * 100) / 100 : null,
      hour_velocity_24: hour_velocity_24 !== null ? Math.round(hour_velocity_24 * 100) / 100 : null,
    };
  } catch (error) {
    logError(`Error calculating 24h metrics for item ${itemId} in ${country}`, error instanceof Error ? error : new Error(String(error)));
    return { items_sold: null, total_revenue_sold: null, sales_by_price: [], has_delisted: false, sales_24h_current: null, sales_24h_previous: null, total_revenue_24h_current: null, trend_24h: null, hour_velocity_24: null };
  }
}

// Helper function to calculate how many items were sold and total revenue between two snapshots
// Compares listings arrays to determine what disappeared or decreased
function calculateItemsSoldAndRevenueBetweenSnapshots(
  olderListings: { price: number; amount: number }[],
  newerListings: { price: number; amount: number }[]
): { itemsSold: number; totalRevenue: number; salesByPrice: { price: number; amount: number }[]; hasDelisted: boolean } {
  // Create a map of price -> total amount for newer listings
  const newerMap = new Map<number, number>();
  for (const listing of newerListings) {
    newerMap.set(listing.price, (newerMap.get(listing.price) || 0) + listing.amount);
  }

  // Calculate how many items from older listings are no longer available and total revenue
  let itemsSold = 0;
  let totalRevenue = 0;
  const salesByPrice: { price: number; amount: number }[] = [];
  const olderMap = new Map<number, number>();
  for (const listing of olderListings) {
    olderMap.set(listing.price, (olderMap.get(listing.price) || 0) + listing.amount);
  }

  // Get sorted list of prices from NEWER listings (cheapest first)
  // We count items as sold if their price is <= the cheapest price available NOW
  // This handles cases where all items at the cheapest price were sold out
  const sortedNewerPrices = Array.from(newerMap.keys()).sort((a, b) => a - b);
  const cheapestCurrentPrice = sortedNewerPrices[0];
  
  // Track if any items were delisted (removed from market at any price)
  let hasDelisted = false;

  // For each price point in older listings, see how many are missing in newer
  for (const [price, olderAmount] of olderMap.entries()) {
    const newerAmount = newerMap.get(price) || 0;
    if (olderAmount > newerAmount) {
      const removedAmount = olderAmount - newerAmount;
      
      // Count as sold if price is less than or equal to the cheapest current price
      // If there are no newer listings (all sold out), cheapestCurrentPrice will be undefined
      // In that case, count all removed items as sold
      if (cheapestCurrentPrice === undefined || price <= cheapestCurrentPrice) {
        itemsSold += removedAmount;
        totalRevenue += removedAmount * price;
        salesByPrice.push({ price, amount: removedAmount });
      } else {
        // Items removed from prices higher than the cheapest current price are considered delisted
        hasDelisted = true;
      }
    }
  }

  return { itemsSold, totalRevenue, salesByPrice, hasDelisted };
}

/**
 * Helper: Select items that are due for monitoring
 * Items are due when cycles_since_last_check >= MonitorFrequency
 */
async function selectDueItems(): Promise<any[]> {
  const dueItems = await MonitoredItem.find({
    $expr: { $gte: ['$cycles_since_last_check', '$MonitorFrequency'] }
  }).lean();
  
  return dueItems;
}

/**
 * Helper: Select random items for curiosity checks
 * Picks up to 5% of budget from items with MonitorFrequency >= 5 (quiet items)
 * @param maxCount - Maximum number of items to select for curiosity
 */
async function selectCuriosityItems(maxCount: number): Promise<any[]> {
  if (maxCount <= 0) return [];
  
  // Find eligible items: MonitorFrequency >= 5 and not already due
  const eligibleItems = await MonitoredItem.find({
    MonitorFrequency: { $gte: 5 },
    $expr: { $lt: ['$cycles_since_last_check', '$MonitorFrequency'] }
  }).lean();
  
  if (eligibleItems.length === 0) return [];
  
  // Randomly shuffle and take up to maxCount items
  const shuffled = eligibleItems.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, maxCount);
  
  logInfo(`Selected ${selected.length} items for curiosity checks (out of ${eligibleItems.length} eligible)`);
  return selected;
}

/**
 * Helper: Detect if an item has movement (changed stock, price, or sales)
 * Compares current data to cached lastCheckedData
 */
function detectMovement(
  item: any,
  currentData: { stock?: number | null; price?: number | null; sales?: number | null }
): boolean {
  const lastData = item.lastCheckedData || {};
  
  // Check for changes in stock
  if (lastData.stock !== null && currentData.stock !== null && lastData.stock !== currentData.stock) {
    return true;
  }
  
  // Check for changes in price (more than 1% difference to avoid minor fluctuations)
  if (lastData.price !== null && currentData.price !== null && 
      currentData.price !== undefined && lastData.price !== undefined) {
    const priceDiff = Math.abs(currentData.price - lastData.price) / lastData.price;
    if (priceDiff > 0.01) return true;
  }
  
  // Check for changes in sales
  if (lastData.sales !== null && currentData.sales !== null && lastData.sales !== currentData.sales) {
    return true;
  }
  
  return false;
}

/**
 * Helper: Update MonitorFrequency based on whether movement was detected
 * - If movement detected: reset to 1
 * - If no movement: increment by 1 (max 10)
 */
async function updateMonitorFrequency(
  itemId: number,
  country: string,
  hasMovement: boolean,
  currentData: { stock?: number | null; price?: number | null; sales?: number | null }
): Promise<void> {
  if (hasMovement) {
    // Reset frequency to 1 - this item is active
    await MonitoredItem.findOneAndUpdate(
      { itemId, country },
      {
        $set: {
          MonitorFrequency: 1,
          cycles_since_last_check: 0,
          lastCheckedData: currentData,
          lastCheckTimestamp: new Date(),
        },
      }
    );
  } else {
    // Increment frequency (max 10) - this item is quiet
    // Use aggregation pipeline to increment and cap in a single operation
    const result = await MonitoredItem.findOneAndUpdate(
      { itemId, country },
      [
        {
          $set: {
            MonitorFrequency: {
              $cond: {
                if: { $gte: ['$MonitorFrequency', 10] },
                then: 10,
                else: { $add: ['$MonitorFrequency', 1] }
              }
            },
            cycles_since_last_check: 0,
            lastCheckedData: currentData,
            lastCheckTimestamp: new Date(),
          }
        }
      ]
    );
    
    // If item doesn't exist, log a warning (shouldn't happen)
    if (!result) {
      logError(`MonitoredItem not found for itemId ${itemId} in ${country}`, new Error('Item not found'));
    }
  }
}

/**
 * Helper: Increment cycles_since_last_check for all monitored items
 * Called at the start of each monitoring cycle
 */
async function incrementCycleCounters(): Promise<void> {
  await MonitoredItem.updateMany(
    {},
    { $inc: { cycles_since_last_check: 1 } }
  );
}

// Fetch and store detailed market snapshots for monitored items (self-scheduling with adaptive monitoring)
export async function fetchMarketSnapshots(): Promise<void> {
  try {
    const startTime = Date.now();
    logInfo('=== Starting adaptive monitoring cycle ===');

    // Step 1: Increment cycle counters for all monitored items
    await incrementCycleCounters();

    // Step 2: Select items that are due for checking
    const dueItems = await selectDueItems();
    logInfo(`Found ${dueItems.length} items due for monitoring`);

    // Step 3: Calculate curiosity budget (5% of rate limit)
    const curiosityBudget = Math.floor(RATE_LIMIT_PER_MINUTE * CURIOSITY_RATE);
    const curiosityItems = await selectCuriosityItems(curiosityBudget);
    
    // Step 4: Combine due items and curiosity items
    const itemsToCheck = [...dueItems];
    const curiosityItemIds = new Set(curiosityItems.map(item => `${item.country}:${item.itemId}`));
    
    // Add curiosity items that aren't already in due items
    for (const curiosityItem of curiosityItems) {
      const key = `${curiosityItem.country}:${curiosityItem.itemId}`;
      if (!dueItems.some(item => `${item.country}:${item.itemId}` === key)) {
        itemsToCheck.push(curiosityItem);
      }
    }

    logInfo(`Total items to check: ${itemsToCheck.length} (${dueItems.length} due + ${curiosityItems.length} curiosity)`);

    if (itemsToCheck.length === 0) {
      logInfo('No items to check this cycle, scheduling next cycle...');
      setTimeout(() => {
        fetchMarketSnapshots();
      }, 60 * 1000); // Wait 1 minute
      return;
    }

    // Ensure we don't exceed rate limit
    const maxItemsToCheck = Math.min(itemsToCheck.length, RATE_LIMIT_PER_MINUTE);
    const selectedItems = itemsToCheck.slice(0, maxItemsToCheck);
    
    if (itemsToCheck.length > maxItemsToCheck) {
      logInfo(`Rate limit protection: checking ${maxItemsToCheck} of ${itemsToCheck.length} items`);
    }

    logInfo(`Starting to check ${selectedItems.length} items...`);

    // Get all items data and stock data for reference
    const [allItems, cityShopStock, foreignStock] = await Promise.all([
      TornItem.find().lean() as Promise<Array<{
        itemId: number;
        name: string;
        type: string;
        vendor_name?: string | null;
        buy_price?: number | null;
        market_price?: number | null;
      }>>,
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
    const itemsMap = new Map(allItems.map((item: any) => [item.itemId, item]));

    let totalSnapshots = 0;
    let totalApiCalls = 0;
    let movementDetectedCount = 0;
    let curiosityCheckedCount = 0;

    // Process each item
    for (const monitoredItem of selectedItems) {
      const { country, itemId } = monitoredItem;
      const isCuriosityCheck = curiosityItemIds.has(`${country}:${itemId}`);
      
      try {
        const response = await retryWithBackoff(() =>
          limiter.schedule(() =>
            axios.get(`https://api.torn.com/v2/market/${itemId}/itemmarket?limit=20&key=${API_KEY}`)
          )
        ) as { data: { itemmarket: any } };

        totalApiCalls++;

        const itemmarket = response.data.itemmarket;
        if (!itemmarket) {
          continue;
        }

        const item = itemsMap.get(itemId);
        if (!item) {
          continue;
        }

        // Get stock info
        // If an item is not found in stock data, it means it's out of stock (0)
        // The API doesn't return items with 0 stock
        let inStock: number | null = null;

        if (country === 'Torn') {
          const match = cityShopStock.find(
            (stock: any) => stock.itemName?.toLowerCase() === item.name.toLowerCase()
          );
          inStock = match ? (match.in_stock ?? 0) : 0;
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
            inStock = match ? (match.quantity ?? 0) : 0;
          } else {
            // If we can't determine country code, default to 0
            inStock = 0;
          }
        }

        const buy = item.buy_price ?? 0;
        const market = itemmarket.item?.average_price ?? item.market_price ?? 0;
        const profitPer1 = market && buy ? market - buy : 0;

        // Get current listings from API
        const currentListings = itemmarket.listings?.map((listing: any) => ({
          price: listing.price,
          amount: listing.amount,
        })) ?? [];

        // Calculate 24-hour sales metrics from historical data
        const { items_sold, total_revenue_sold, sales_by_price, has_delisted, sales_24h_current, sales_24h_previous, total_revenue_24h_current, trend_24h, hour_velocity_24 } = await calculate24HourMetrics(country, itemId, currentListings);

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
          listings: currentListings,
          cache_timestamp: itemmarket.cache_timestamp ?? Date.now(),
          fetched_at: new Date(),
          items_sold,
          total_revenue_sold,
          sales_by_price,
          sales_24h_current,
          sales_24h_previous,
          total_revenue_24h_current,
          trend_24h,
          hour_velocity_24,
        });

        await snapshot.save();
        totalSnapshots++;

        // Detect movement and update MonitorFrequency
        const currentData = {
          stock: inStock,
          price: market,
          sales: items_sold,
        };
        
        // Check for movement: either detected by data changes OR items were delisted
        const hasMovement = detectMovement(monitoredItem, currentData) || has_delisted;
        if (hasMovement) {
          movementDetectedCount++;
        }
        
        if (isCuriosityCheck) {
          curiosityCheckedCount++;
        }
        
        // Update MonitorFrequency with error handling
        try {
          await updateMonitorFrequency(itemId, country, hasMovement, currentData);
        } catch (freqError) {
          logError(`Error updating MonitorFrequency for item ${itemId} in ${country}`, freqError instanceof Error ? freqError : new Error(String(freqError)));
        }

      } catch (error) {
        logError(`Error fetching market data for item ${itemId} in ${country}`, error instanceof Error ? error : new Error(String(error)));
      }
    }

    logInfo(`Finished checking ${selectedItems.length} items`);

    const elapsed = Date.now() - startTime;
    const elapsedSeconds = elapsed / 1000;
    
    logInfo(`Successfully stored ${totalSnapshots} market snapshots`);
    logInfo(`Movement detected in ${movementDetectedCount} items (frequencies reset to 1)`);
    logInfo(`Curiosity checks performed: ${curiosityCheckedCount}`);
    logInfo(`Cycle completed: ${totalApiCalls} API calls in ${elapsedSeconds.toFixed(2)} seconds`);
    
    // Calculate delay to respect rate limit
    const minRequiredTime = (totalApiCalls / RATE_LIMIT_PER_MINUTE) * 60 * 1000;
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
    logError('Error in adaptive monitoring cycle', error instanceof Error ? error : new Error(String(error)));
    
    // On error, wait 1 minute before retrying
    logInfo('Retrying market snapshots fetch in 1 minute due to error...');
    setTimeout(() => {
      fetchMarketSnapshots();
    }, 60 * 1000);
  }
}

// Initialize and start the scheduler
export function startScheduler(): void {
  logInfo('Starting background fetcher scheduler...');
  logInfo(`Rate limit configured: ${RATE_LIMIT_PER_MINUTE} requests per minute`);
  logInfo(`Curiosity rate: ${(CURIOSITY_RATE * 100).toFixed(0)}% (${Math.floor(RATE_LIMIT_PER_MINUTE * CURIOSITY_RATE)} requests reserved for random checks)`);

  // Fetch items immediately on startup if needed (every 24 hours)
  // Wait for this to complete before updating monitored items
  fetchTornItems().then(() => {
    // After items are fetched, update monitored items and start market snapshots
    updateMonitoredItems().then(() => {
      // Start self-scheduling market snapshots immediately after monitored items are ready
      logInfo('Monitored items initialized, starting adaptive monitoring system...');
      fetchMarketSnapshots();
    }).catch((error) => {
      logError('Failed to initialize monitored items', error instanceof Error ? error : new Error(String(error)));
      // Retry after 1 minute on failure
      logInfo('Retrying monitored items initialization in 1 minute...');
      setTimeout(() => {
        updateMonitoredItems().then(() => {
          fetchMarketSnapshots();
        });
      }, 60 * 1000); // 1 minute
    });
  }).catch((error) => {
    logError('Failed to fetch Torn items on startup', error instanceof Error ? error : new Error(String(error)));
    // Retry after 1 minute on failure
    logInfo('Retrying Torn items fetch in 1 minute...');
    setTimeout(() => {
      fetchTornItems().then(() => {
        updateMonitoredItems().then(() => {
          fetchMarketSnapshots();
        });
      });
    }, 60 * 1000); // 1 minute
  });

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

  // Schedule monitored items update every 10 minutes
  cron.schedule('*/10 * * * *', () => {
    logInfo('Running scheduled monitored items update...');
    updateMonitoredItems();
  });

  // Schedule market history aggregation (default: daily at midnight UTC)
  const historyAggregationCron = process.env.HISTORY_AGGREGATION_CRON || '0 0 * * *';
  cron.schedule(historyAggregationCron, () => {
    logInfo('Running scheduled market history aggregation...');
    aggregateMarketHistory();
  });

  logInfo('Background fetcher scheduler started successfully');
}
