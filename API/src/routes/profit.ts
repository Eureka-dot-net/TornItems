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
  expected_sell_time_minutes?: number | null;
  hour_velocity_24?: number | null;
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

      // 📊 Fetch sell velocity, trend, and other analytics from latest market snapshot
      let sell_velocity: number | null = null;
      let trend: number | null = null;
      let expected_sell_time_minutes: number | null = null;
      let hour_velocity_24: number | null = null;
      
      const latestSnapshot = await MarketSnapshot.findOne({ country, itemId: item.itemId })
        .sort({ fetched_at: -1 })
        .lean();
      
      if (latestSnapshot) {
        sell_velocity = latestSnapshot.sell_velocity ?? null;
        trend = latestSnapshot.trend ?? null;
        expected_sell_time_minutes = latestSnapshot.expected_sell_time_minutes ?? null;
        hour_velocity_24 = latestSnapshot.hour_velocity_24 ?? null;
      }

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
        expected_sell_time_minutes,
        hour_velocity_24,
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
