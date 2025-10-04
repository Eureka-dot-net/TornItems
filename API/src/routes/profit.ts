import axios from 'axios';
import express, { Request, Response } from 'express';

const router = express.Router({ mergeParams: true });
const API_KEY = (process.env.TORN_API_KEY as string) || 'yLp4OoENbjRy30GZ';

// Helper to pause between requests if needed later
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

interface VendorInfo {
  country: string;
  name: string;
}

interface ItemValue {
  vendor: VendorInfo | null;
  buy_price: number | null;
  sell_price: number | null;
  market_price: number | null;
}

interface TornItem {
  id: number;
  name: string;
  description: string;
  type: string;
  sub_type?: string | null;
  is_tradable: boolean;
  is_found_in_city: boolean;
  value: ItemValue;
}

interface CityShopItem {
  name: string;
  type: string;
  price: number;
  in_stock: number;
}

interface CityShops {
  [shopId: string]: {
    name: string;
    inventory: Record<string, CityShopItem>;
  };
}

interface CountryItem {
  id: number;
  name: string;
  buy_price: number | null;
  market_price: number | null;
  profitPer1: number | null;
  shop_name: string | null;
  in_stock?: number | null;
}

interface GroupedByCountry {
  [country: string]: CountryItem[];
}

// YATA API types
interface YataStock {
  id: number;
  name: string;
  quantity: number;
  cost: number;
}

interface YataCountry {
  update: number;
  stocks: YataStock[];
}

interface YataResponse {
  stocks: Record<string, YataCountry>;
  timestamp: number;
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
    console.log('Fetching items, Torn City stock, and YATA travel stock...');

    // ✅ Fetch all three in parallel
    const [itemsResponse, cityshopsResponse, yataResponse] = await Promise.all([
      axios.get<{ items: TornItem[] }>(
        `https://api.torn.com/v2/torn/items?cat=All&sort=ASC&key=${API_KEY}`
      ),
      axios.get<{ cityshops: CityShops }>(
        `https://api.torn.com/v2/torn?selections=cityshops&key=${API_KEY}`
      ),
      axios.get<YataResponse>('https://yata.yt/api/v1/travel/export/'),
    ]);

    const items = itemsResponse.data.items;
    const cityshops = cityshopsResponse.data.cityshops;
    const yataStocks = yataResponse.data.stocks;

    if (!items?.length) throw new Error('No items found in Torn v2 response.');
    if (!cityshops) console.warn('Cityshops not found or empty.');
    if (!yataStocks) console.warn('YATA travel stock not found or empty.');

    console.log(
      `Fetched ${items.length} items, ${Object.keys(cityshops).length} city shops, and ${Object.keys(yataStocks).length} travel countries.`
    );

    // 🗺 Group by country (shop is informational)
    const grouped: GroupedByCountry = {};

    for (const item of items) {
      const vendor = item.value.vendor;
      if (!vendor || !item.value.buy_price) continue; // skip unpurchasable items

      const country = vendor.country || 'Unknown';
      const shop = vendor.name || 'Unknown';
      const buy = item.value.buy_price ?? 0;
      const market = item.value.market_price ?? 0;

      // 💰 Profit per single item
      const profitPer1 = market && buy ? market - buy : null;

      // 🏙 Merge Torn City stock info if available
      let inStock: number | null = null;

      if (country === 'Torn') {
        for (const shopData of Object.values(cityshops)) {
          if (!shopData.inventory) continue;
          const match = Object.values(shopData.inventory).find(
            (inv) => inv.name?.toLowerCase() === item.name.toLowerCase()
          );
          if (match) {
            inStock = match.in_stock ?? null;
            break;
          }
        }
      } else {
        // 🌍 Check YATA travel stock
        const countryCode = Object.entries(COUNTRY_CODE_MAP).find(
          ([code, name]) => name === country
        )?.[0];

        if (countryCode && yataStocks[countryCode]) {
          const match = yataStocks[countryCode].stocks.find(
            (s) => s.name.toLowerCase() === item.name.toLowerCase()
          );
          if (match) inStock = match.quantity;
        }
      }

      if (!grouped[country]) grouped[country] = [];

      grouped[country].push({
        id: item.id,
        name: item.name,
        buy_price: buy,
        market_price: market,
        profitPer1,
        shop_name: shop,
        in_stock: inStock,
      });
    }

    // Sort each country’s results by profit
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
    if (axios.isAxiosError(err)) {
      console.error('API Error:', err.message);
    } else if (err instanceof Error) {
      console.error('Error:', err.message);
    } else {
      console.error('Unknown error');
    }

    res.status(500).json({ error: 'Failed to fetch or process Torn data.' });
  }
});

export default router;
