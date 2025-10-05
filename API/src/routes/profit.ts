import express, { Request, Response } from 'express';
import { TornItem } from '../models/TornItem';
import { CityShopStock } from '../models/CityShopStock';
import { ForeignStock } from '../models/ForeignStock';
import { MarketSnapshot } from '../models/MarketSnapshot';

const router = express.Router({ mergeParams: true });

interface CountryItem {
  id: number;
  name: string;
  buy_price: number | null;
  market_price: number | null;
  profitPer1: number | null;
  shop_name: string | null;
  in_stock?: number | null;
  sales_24h_current?: number | null;
  sales_24h_previous?: number | null;
  trend_24h?: number | null;
  hour_velocity_24?: number | null;
  average_price_items_sold?: number | null;
  ItemsSold?: Array<{ Amount: number; TimeStamp: string }>;
  estimated_market_value_profit: number | null;
  lowest_50_profit: number | null;
  sold_profit: number | null;
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

// GET /profit
router.get('/profit', async (_req: Request, res: Response): Promise<void> => {
  try {
    console.log('Fetching profit data from MongoDB...');

    // Check if ItemsSold should be included in the response (for debugging)
    const includeItemsSold = process.env.INCLUDE_ITEMS_SOLD === 'true';

    // Fetch all items, city shop stock, foreign stock, and market snapshots from MongoDB
    const [items, cityShopStock, foreignStock, marketSnapshots] = await Promise.all([
      TornItem.find({ buy_price: { $ne: null } }).lean(),
      CityShopStock.find().lean(),
      ForeignStock.find().lean(),
      MarketSnapshot.find().sort({ fetched_at: -1 }).lean(),
    ]);

    if (!items?.length) {
      res.status(503).json({ 
        error: 'No items found in database. Background fetcher may still be initializing.' 
      });
      return;
    }

    console.log(
      `Retrieved ${items.length} items, ${cityShopStock.length} city shop items, ${foreignStock.length} foreign stock items, and ${marketSnapshots.length} market snapshots from database.`
    );

    // Create a lookup map for market snapshots: key is "country:itemId", value is the latest snapshot
    const snapshotMap = new Map<string, any>();
    for (const snapshot of marketSnapshots) {
      const key = `${snapshot.country}:${snapshot.itemId}`;
      // Only keep the latest snapshot per country-item pair (already sorted by fetched_at desc)
      if (!snapshotMap.has(key)) {
        snapshotMap.set(key, snapshot);
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

    // Create a lookup map for ItemsSold: key is "country:itemId", value is array of sales
    // Only build this map if includeItemsSold flag is enabled (for performance)
    const itemsSoldMap = new Map<string, Array<{ Amount: number; TimeStamp: string }>>();
    if (includeItemsSold) {
      const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
      for (const snapshot of marketSnapshots) {
        if (snapshot.items_sold != null && snapshot.items_sold > 0 && 
            new Date(snapshot.fetched_at).getTime() >= twentyFourHoursAgo) {
          const key = `${snapshot.country}:${snapshot.itemId}`;
          if (!itemsSoldMap.has(key)) {
            itemsSoldMap.set(key, []);
          }
          itemsSoldMap.get(key)!.push({
            Amount: snapshot.items_sold,
            TimeStamp: snapshot.fetched_at.toISOString()
          });
        }
      }
    }

    // 🗺 Group by country (shop is informational)
    const grouped: GroupedByCountry = {};

    for (const item of items) {
      const country = item.vendor_country || 'Unknown';
      const shop = item.vendor_name || 'Unknown';
      const buy = item.buy_price ?? 0;
      const market = item.market_price ?? 0;

      // 💰 Profit per single item
      const profitPer1 = market && buy ? market - buy : null;

      // 🏙 Merge Torn City stock info if available
      let inStock: number | null = null;

      if (country === 'Torn') {
        const match = cityShopStockMap.get(item.name.toLowerCase());
        if (match) {
          inStock = match.in_stock ?? null;
        }
      } else {
        // 🌍 Check foreign travel stock
        const countryCode = Object.entries(COUNTRY_CODE_MAP).find(
          ([, name]) => name === country
        )?.[0];

        if (countryCode) {
          const foreignKey = `${countryCode}:${item.name.toLowerCase()}`;
          const match = foreignStockMap.get(foreignKey);
          if (match) inStock = match.quantity;
        }
      }

      // 📊 Fetch 24-hour sales metrics from latest market snapshot
      let sales_24h_current: number | null = null;
      let sales_24h_previous: number | null = null;
      let trend_24h: number | null = null;
      let hour_velocity_24: number | null = null;
      let average_price_items_sold: number | null = null;
      
      const snapshotKey = `${country}:${item.itemId}`;
      const latestSnapshot = snapshotMap.get(snapshotKey);
      
      if (latestSnapshot) {
        sales_24h_current = latestSnapshot.sales_24h_current ?? null;
        sales_24h_previous = latestSnapshot.sales_24h_previous ?? null;
        trend_24h = latestSnapshot.trend_24h ?? null;
        hour_velocity_24 = latestSnapshot.hour_velocity_24 ?? null;
        
        // Calculate average price from total revenue and total items sold in 24h period
        if (latestSnapshot.total_revenue_24h_current && latestSnapshot.sales_24h_current && latestSnapshot.sales_24h_current > 0) {
          average_price_items_sold = Math.round(latestSnapshot.total_revenue_24h_current / latestSnapshot.sales_24h_current);
        }
      }
      
      // Get pre-built ItemsSold array from map (O(1) lookup)
      const ItemsSold = itemsSoldMap.get(snapshotKey) || [];

      // 💵 Calculate the three new profit fields
      // 1. estimated_market_value_profit = market_price - buy_price
      const estimated_market_value_profit = market && buy ? market - buy : null;

      // 2. lowest_50_profit = (average of lowest 50 listings) - buy_price
      let lowest_50_profit: number | null = null;
      if (latestSnapshot && latestSnapshot.listings && latestSnapshot.listings.length > 0 && buy) {
        // Sort listings by price ascending
        const sortedListings = [...latestSnapshot.listings].sort((a, b) => a.price - b.price);
        
        // Calculate the average of the lowest 50 items (or fewer if less than 50 available)
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
          lowest_50_profit = averageLowest50 - buy;
        }
      }

      // 3. sold_profit = average_price_items_sold - buy_price
      const sold_profit = average_price_items_sold && buy ? average_price_items_sold - buy : null;

      if (!grouped[country]) grouped[country] = [];

      // Build the country item object
      const countryItem: CountryItem = {
        id: item.itemId,
        name: item.name,
        buy_price: buy,
        market_price: market,
        profitPer1,
        shop_name: shop,
        in_stock: inStock,
        sales_24h_current,
        sales_24h_previous,
        trend_24h,
        hour_velocity_24,
        average_price_items_sold,
        estimated_market_value_profit,
        lowest_50_profit,
        sold_profit,
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
