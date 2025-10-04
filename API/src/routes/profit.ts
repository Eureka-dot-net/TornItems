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
  sell_velocity?: number | null;
  trend?: number | null;
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

// Calculate sell velocity and trend from historical snapshots
async function calculateVelocityAndTrend(
  country: string,
  itemId: number
): Promise<{ sell_velocity: number | null; trend: number | null }> {
  try {
    // Fetch the most recent 10 historical snapshots
    const snapshots = await MarketSnapshot.find({ country, itemId })
      .sort({ fetched_at: -1 })
      .limit(10)
      .lean();

    if (snapshots.length < 2) {
      // Not enough history
      return { sell_velocity: null, trend: null };
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
      return { sell_velocity: null, trend: null };
    }

    // Calculate average sell velocity
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

    return { 
      sell_velocity: Math.round(avgVelocity * 100) / 100, // Round to 2 decimal places
      trend: trend !== null ? Math.round(trend * 100) / 100 : null 
    };
  } catch (error) {
    console.error(`Error calculating velocity/trend for item ${itemId} in ${country}:`, error);
    return { sell_velocity: null, trend: null };
  }
}


// GET /profit
router.get('/profit', async (_req: Request, res: Response): Promise<void> => {
  try {
    console.log('Fetching profit data from MongoDB...');

    // Fetch all items, city shop stock, and foreign stock from MongoDB
    const [items, cityShopStock, foreignStock] = await Promise.all([
      TornItem.find({ buy_price: { $ne: null } }).lean(),
      CityShopStock.find().lean(),
      ForeignStock.find().lean(),
    ]);

    if (!items?.length) {
      res.status(503).json({ 
        error: 'No items found in database. Background fetcher may still be initializing.' 
      });
      return;
    }

    console.log(
      `Retrieved ${items.length} items, ${cityShopStock.length} city shop items, and ${foreignStock.length} foreign stock items from database.`
    );

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
        const match = cityShopStock.find(
          (stock) => stock.itemName?.toLowerCase() === item.name.toLowerCase()
        );
        if (match) {
          inStock = match.in_stock ?? null;
        }
      } else {
        // 🌍 Check foreign travel stock
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

      // 📊 Calculate sell velocity and trend from historical data
      const { sell_velocity, trend } = await calculateVelocityAndTrend(country, item.itemId);

      if (!grouped[country]) grouped[country] = [];

      grouped[country].push({
        id: item.itemId,
        name: item.name,
        buy_price: buy,
        market_price: market,
        profitPer1,
        shop_name: shop,
        in_stock: inStock,
        sell_velocity,
        trend,
      });
    }

    // Sort each country's results by profit
    for (const country of Object.keys(grouped)) {
      grouped[country].sort(
        (a, b) => (b.profitPer1 ?? 0) - (a.profitPer1 ?? 0)
      );
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
