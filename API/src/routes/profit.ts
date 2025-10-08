import express, { Request, Response } from 'express';
import { TornItem } from '../models/TornItem';
import { CityShopStock } from '../models/CityShopStock';
import { ForeignStock } from '../models/ForeignStock';
import { MarketHistory } from '../models/MarketHistory';
import { ShopItemState } from '../models/ShopItemState';
import { TravelTime } from '../models/TravelTime';
import { roundUpToNextQuarterHour } from '../utils/dateHelpers';

const router = express.Router({ mergeParams: true });

interface CountryItem {
  id: number;
  name: string;
  buy_price: number | null;
  market_price: number | null;
  profitPer1: number | null;
  shop_name: string | null;
  country?: string | null;
  country_code?: string | null;
  shop_url_name?: string | null;
  in_stock?: number | null;
  sales_24h_current?: number | null;
  sales_24h_previous?: number | null;
  trend_24h?: number | null;
  hour_velocity_24?: number | null;
  average_price_items_sold?: number | null;
  ItemsSold?: Array<{ Amount: number; TimeStamp: string; Price: number }>;
  estimated_market_value_profit: number | null;
  lowest_50_profit: number | null;
  sold_profit: number | null;
  sellout_duration_minutes?: number | null;
  cycles_skipped?: number | null;
  last_restock_time?: string | null;
  next_estimated_restock_time?: string | null;
  travel_time_minutes?: number | null;
  profit_per_minute?: number | null;
  boarding_time?: string | null;
}

interface GroupedByCountry {
  [country: string]: CountryItem[];
}

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

const TORN_SHOP_MAP: Record<string, string> = {
  "101": "candy",
  "102": "candy",
  "103": "bitsnbobs",
  "104": "jewelry",
  "105": "super",
  "106": "cyberforce",
  "107": "docks",
  "108": "postoffice",
  "109": "pawnshop",
  "110": "pharmacy",
  "111": "sports",
  "112": "recyclingcenter",
  "113": "printstore",
};

// GET /profit
router.get('/profit', async (_req: Request, res: Response): Promise<void> => {
  try {
    console.log('Fetching profit data from MongoDB...');

    // Check if ItemsSold should be included in the response (for debugging)
    const includeItemsSold = process.env.INCLUDE_ITEMS_SOLD === 'true';

    // Get today's date for fetching the latest aggregated data
    const today = new Date().toISOString().split('T')[0];

    // Fetch aggregated market history data (latest available, typically today or yesterday)
    // Get the most recent date available in MarketHistory
    const latestHistoryDate = await MarketHistory.findOne()
      .sort({ date: -1 })
      .select('date')
      .lean();

    const dateToFetch = latestHistoryDate?.date || today;

    // Fetch all items, city shop stock, foreign stock, market history, shop item states, and travel times
    const [items, cityShopStock, foreignStock, marketHistory, shopItemStates, travelTimes] = await Promise.all([
      TornItem.find({ buy_price: { $ne: null } }).lean(),
      CityShopStock.find().lean(),
      ForeignStock.find().lean(),
      MarketHistory.find({ date: dateToFetch }).lean(),
      ShopItemState.find().lean(),
      TravelTime.find().lean(),
    ]);

    if (!items?.length) {
      res.status(503).json({ 
        error: 'No items found in database. Background fetcher may still be initializing.' 
      });
      return;
    }

    console.log(
      `Retrieved ${items.length} items, ${cityShopStock.length} city shop items, ${foreignStock.length} foreign stock items, ${marketHistory.length} market history records (date: ${dateToFetch}), ${shopItemStates.length} shop item states, and ${travelTimes.length} travel times from database.`
    );

    // Create a lookup map for market history: key is "country:itemId", value is the history record
    const historyMap = new Map<string, any>();
    for (const record of marketHistory) {
      const key = `${record.country}:${record.id}`;
      historyMap.set(key, record);
    }

    // Create a lookup map for shop item states: key is "shopId:itemId" 
    // For Torn shops, we store by itemId only for backward compatibility
    // For foreign shops, we use "countryCode:itemId"
    const shopItemStateMap = new Map<string, any>();
    for (const state of shopItemStates) {
      // Store with composite key "shopId:itemId" for all items
      const key = `${state.shopId}:${state.itemId}`;
      shopItemStateMap.set(key, state);
      
      // Also store Torn items by itemId alone for backward compatibility
      if (state.shopName === 'Torn' || !state.shopId.includes('_')) {
        shopItemStateMap.set(state.itemId, state);
      }
    }

    // Create a lookup map for city shop stock: key is lowercase item name
    const cityShopStockMap = new Map<string, any>();
    for (const stock of cityShopStock) {
      if (stock.itemName) {
        cityShopStockMap.set(stock.itemName.toLowerCase(), stock);
      }
    }

    // Create a lookup map for foreign stock: key is "countryCode:itemName" (lowercase)
    const foreignStockMap = new Map<string, any>();
    for (const stock of foreignStock) {
      const key = `${stock.countryCode}:${stock.itemName.toLowerCase()}`;
      foreignStockMap.set(key, stock);
    }

    // Create a lookup map for travel times: key is countryCode
    const travelTimeMap = new Map<string, number>();
    for (const travelTime of travelTimes) {
      travelTimeMap.set(travelTime.countryCode, travelTime.travelTimeMinutes);
    }

    // Constants for foreign stock calculations
    const MAX_FOREIGN_ITEMS = 15;
    const PRIVATE_ISLAND_REDUCTION = 0.30; // 30% reduction (airstrip effect)
    const HAS_PRIVATE_ISLAND = true; // Hardcoded for now

    // 🗺 Group by country (shop is informational)
    const grouped: GroupedByCountry = {};

    for (const item of items) {
      const country = item.vendor_country || 'Unknown';
      const shop = item.vendor_name || 'Unknown';
      const buy = item.buy_price ?? 0;
      const market = item.market_price ?? 0;

      // 💰 Apply 5% sales tax (deducted from market price)
      const SALES_TAX_RATE = 0.05;
      const marketAfterTax = market * (1 - SALES_TAX_RATE);

      // 💰 Profit per single item (after sales tax)
      const profitPer1 = market && buy ? marketAfterTax - buy : null;

      // 🏙 Merge Torn City stock info if available
      // If an item is not found in stock data, it means it's out of stock (0)
      // The API doesn't return items with 0 stock
      let inStock: number | null = null;

      if (country === 'Torn') {
        const match = cityShopStockMap.get(item.name.toLowerCase());
        inStock = match ? (match.in_stock ?? 0) : 0;
      } else {
        // 🌍 Check foreign travel stock
        const countryCode = Object.entries(COUNTRY_CODE_MAP).find(
          ([, name]) => name === country
        )?.[0];

        if (countryCode) {
          const foreignKey = `${countryCode}:${item.name.toLowerCase()}`;
          const match = foreignStockMap.get(foreignKey);
          inStock = match ? (match.quantity ?? 0) : 0;
        } else {
          // If we can't determine country code, default to 0
          inStock = 0;
        }
      }

      // 📊 Use pre-calculated 24-hour sales metrics from the latest snapshot
      let sales_24h_current: number | null = null;
      let sales_24h_previous: number | null = null;
      let trend_24h: number | null = null;
      let hour_velocity_24: number | null = null;
      let average_price_items_sold: number | null = null;
      
      const historyKey = `${country}:${item.itemId}`;
      const historyRecord = historyMap.get(historyKey);
      
      // Use pre-calculated metrics from MarketHistory
      if (historyRecord) {
        sales_24h_current = historyRecord.sales_24h_current ?? null;
        sales_24h_previous = historyRecord.sales_24h_previous ?? null;
        trend_24h = historyRecord.trend_24h ?? null;
        hour_velocity_24 = historyRecord.hour_velocity_24 ?? null;
        average_price_items_sold = historyRecord.average_price_items_sold ?? null;
      }

      // Build ItemsSold array for debugging if requested (not available from aggregated data)
      const ItemsSold: Array<{ Amount: number; TimeStamp: string; Price: number }> = [];

      // 💵 Use pre-calculated profit fields from MarketHistory
      const estimated_market_value_profit = historyRecord?.estimated_market_value_profit ?? (market && buy ? marketAfterTax - buy : null);
      const lowest_50_profit = historyRecord?.lowest_50_profit ?? null;
      const sold_profit = historyRecord?.sold_profit ?? null;

      // 📦 Fetch shop item state data for restock timing (for both Torn and foreign shops)
      let sellout_duration_minutes: number | null = null;
      let cycles_skipped: number | null = null;
      let last_restock_time: string | null = null;
      let next_estimated_restock_time: string | null = null;
      
      // Determine the lookup key based on country
      let shopItemState = null;
      if (country === 'Torn') {
        // For Torn items, try itemId lookup first
        shopItemState = shopItemStateMap.get(String(item.itemId));
      } else {
        // For foreign items, use countryCode:itemId lookup
        const countryCode = Object.entries(COUNTRY_CODE_MAP).find(
          ([, name]) => name === country
        )?.[0];
        
        if (countryCode) {
          const stateKey = `${countryCode}:${item.itemId}`;
          shopItemState = shopItemStateMap.get(stateKey);
        }
      }
      
      // If we found state data, populate the fields
      if (shopItemState) {
        sellout_duration_minutes = shopItemState.selloutDurationMinutes ?? null;
        cycles_skipped = shopItemState.cyclesSkipped ?? null;
        
        if (shopItemState.lastRestockTime) {
          last_restock_time = shopItemState.lastRestockTime.toISOString();
          
          // Calculate next estimated restock time
          // Start from last restock time, add (cyclesSkipped + 1) * 15 minutes
          const lastRestock = new Date(shopItemState.lastRestockTime);
          const cyclesSkippedCount = shopItemState.cyclesSkipped ?? 0;
          
          // Add estimated wait time: (cycles_skipped + 1) * 15 minutes
          const estimatedWaitMinutes = (cyclesSkippedCount + 1) * 15;
          let estimatedTime = new Date(lastRestock.getTime() + estimatedWaitMinutes * 60 * 1000);
          
          // Round to next quarter hour
          let nextRestock = roundUpToNextQuarterHour(estimatedTime);
          
          // If the calculated time is in the past, advance it to the next future restock cycle
          const now = new Date();
          if (nextRestock < now) {
            // Calculate how many 15-minute cycles have passed since the estimated time
            const minutesSinceEstimate = (now.getTime() - nextRestock.getTime()) / (60 * 1000);
            const cyclesPassed = Math.ceil(minutesSinceEstimate / 15);
            
            // Advance to the next restock cycle in the future
            nextRestock = new Date(nextRestock.getTime() + cyclesPassed * 15 * 60 * 1000);
            nextRestock = roundUpToNextQuarterHour(nextRestock);
          }
          
          next_estimated_restock_time = nextRestock.toISOString();
        }
      }

      if (!grouped[country]) grouped[country] = [];

      // Determine shop_url_name for Torn shops using shopId
      let shop_url_name: string | null = null;
      if (country === 'Torn') {
        const match = cityShopStockMap.get(item.name.toLowerCase());
        if (match && match.shopId) {
          shop_url_name = TORN_SHOP_MAP[match.shopId] ?? null;
        }
      }

      // Calculate travel time and profit per minute for foreign stock
      let travel_time_minutes: number | null = null;
      let profit_per_minute: number | null = null;
      let country_code: string | null = null;
      let boarding_time: string | null = null;
      
      if (country !== 'Torn' && country !== 'Unknown') {
        // Get country code for this country
        const countryCode = Object.entries(COUNTRY_CODE_MAP).find(
          ([, name]) => name === country
        )?.[0];
        
        if (countryCode) {
          country_code = countryCode;
          
          // Get base travel time from the map
          const baseTravelTime = travelTimeMap.get(countryCode);
          
          if (baseTravelTime !== undefined) {
            // Apply private island reduction if applicable
            travel_time_minutes = HAS_PRIVATE_ISLAND 
              ? baseTravelTime * (1 - PRIVATE_ISLAND_REDUCTION)
              : baseTravelTime;
            
            // Calculate profit per minute: (sold_profit * MAX_FOREIGN_ITEMS) / (2 * travel_time)
            // travel_time_minutes is stored as ONE-WAY time, so multiply by 2 for round trip
            if (sold_profit !== null && travel_time_minutes > 0) {
              const totalProfit = sold_profit * MAX_FOREIGN_ITEMS;
              const roundTripTime = travel_time_minutes * 2;
              profit_per_minute = totalProfit / roundTripTime;
            }
            
            // Calculate boarding time to land on estimated restock time
            // Strategy: Calculate when we would land if we board now, then find the next
            // estimated restock that occurs AFTER that landing time
            // NOTE: travel_time_minutes is stored as ONE-WAY time
            if (travel_time_minutes > 0) {
              const now = new Date();
              const travelTimeToDestination = travel_time_minutes; // Already one-way
              
              // Calculate when we would land if we boarded right now
              const landingTimeIfBoardNow = new Date(now.getTime() + travelTimeToDestination * 60 * 1000);
              
              let targetRestockTime: Date;
              
              if (next_estimated_restock_time) {
                // We have restock data - find next restock after our landing time
                let estimatedRestock = new Date(next_estimated_restock_time);
                
                // If the estimated restock is before we would land, advance to next cycle(s)
                while (estimatedRestock <= landingTimeIfBoardNow) {
                  // Advance by 15 minutes (one restock cycle)
                  estimatedRestock = new Date(estimatedRestock.getTime() + 15 * 60 * 1000);
                }
                
                targetRestockTime = estimatedRestock;
              } else {
                // No restock data - find next quarter hour after landing time
                targetRestockTime = roundUpToNextQuarterHour(landingTimeIfBoardNow);
              }
              
              // Boarding time is the target restock time minus the travel time
              const boardingTimeDate = new Date(targetRestockTime.getTime() - travelTimeToDestination * 60 * 1000);
              boarding_time = boardingTimeDate.toISOString();
            }
          }
        }
      }

      // Build the country item object
      const countryItem: CountryItem = {
        id: item.itemId,
        name: item.name,
        buy_price: buy,
        market_price: market,
        profitPer1,
        shop_name: shop,
        country,
        country_code,
        shop_url_name,
        in_stock: inStock,
        sales_24h_current,
        sales_24h_previous,
        trend_24h,
        hour_velocity_24,
        average_price_items_sold,
        estimated_market_value_profit,
        lowest_50_profit,
        sold_profit,
        sellout_duration_minutes,
        cycles_skipped,
        last_restock_time,
        next_estimated_restock_time,
        travel_time_minutes,
        profit_per_minute,
        boarding_time,
      };

      // Conditionally add ItemsSold if flag is enabled
      if (includeItemsSold && ItemsSold.length > 0) {
        countryItem.ItemsSold = ItemsSold;
      }

      grouped[country].push(countryItem);
    }

    // Sort each country's results by the new profit priorities:
    // 1. sold_profit desc (items with sold_profit come first)
    // 2. lowest_50_profit desc
    // 3. estimated_market_value_profit desc
    for (const country of Object.keys(grouped)) {
      grouped[country].sort((a, b) => {
        // First priority: sold_profit (desc)
        // Items with sold_profit should always come before those without
        const aSoldProfit = a.sold_profit ?? null;
        const bSoldProfit = b.sold_profit ?? null;
        
        if (aSoldProfit !== null && bSoldProfit === null) return -1;
        if (aSoldProfit === null && bSoldProfit !== null) return 1;
        if (aSoldProfit !== null && bSoldProfit !== null) {
          if (aSoldProfit !== bSoldProfit) return bSoldProfit - aSoldProfit;
        }
        
        // Second priority: lowest_50_profit (desc)
        const aLowest50 = a.lowest_50_profit ?? 0;
        const bLowest50 = b.lowest_50_profit ?? 0;
        if (aLowest50 !== bLowest50) return bLowest50 - aLowest50;
        
        // Third priority: estimated_market_value_profit (desc)
        const aEstimated = a.estimated_market_value_profit ?? 0;
        const bEstimated = b.estimated_market_value_profit ?? 0;
        return bEstimated - aEstimated;
      });
    }

    res.json({
      count: items.length,
      countries: Object.keys(grouped).length,
      results: grouped,
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('Error:', err.message);
    } else {
      console.error('Unknown error');
    }

    res.status(500).json({ error: 'Failed to fetch profit data from database.' });
  }
});

export default router;
