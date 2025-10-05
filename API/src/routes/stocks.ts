import express, { Request, Response } from 'express';
import axios from 'axios';
import { StockPriceSnapshot } from '../models/StockPriceSnapshot';
import { 
  calculate7DayPercentChange, 
  calculateVolatilityPercent, 
  calculateScores,
  getRecommendation 
} from '../utils/stockMath';

const router = express.Router({ mergeParams: true });

const TORN_API_KEY = process.env.TORN_API_KEY || 'yLp4OoENbjRy30GZ';

// Helper function to fetch user's stock holdings from Torn v2 API
async function fetchUserStocks(): Promise<Record<number, { total_shares: number }>> {
  try {
    const response = await axios.get(
      `https://api.torn.com/v2/user?selections=stocks&key=${TORN_API_KEY}`
    );
    
    const stocks = response.data?.stocks;
    if (!stocks) {
      console.warn('No stocks data returned from Torn API');
      return {};
    }

    // Parse into simple lookup map: { stock_id: { total_shares } }
    const holdings: Record<number, { total_shares: number }> = {};
    for (const [stockId, stockData] of Object.entries(stocks) as [string, any][]) {
      holdings[parseInt(stockId, 10)] = {
        total_shares: stockData.total_shares || 0
      };
    }
    
    return holdings;
  } catch (error) {
    console.error('Error fetching user stocks:', error instanceof Error ? error.message : String(error));
    // Return empty object on error - stocks will show 0 shares
    return {};
  }
}

// GET /stocks/recommendations
router.get('/stocks/recommendations', async (_req: Request, res: Response): Promise<void> => {
  try {
    console.log('Fetching stock recommendations...');

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch user's stock holdings from Torn v2 API
    const holdings = await fetchUserStocks();

    // Use aggregation to get all data efficiently
    const stockData = await StockPriceSnapshot.aggregate([
      {
        $match: {
          timestamp: { $gte: sevenDaysAgo }
        }
      },
      {
        $sort: { ticker: 1, timestamp: -1 }
      },
      {
        $group: {
          _id: '$ticker',
          stock_id: { $first: '$stock_id' },
          name: { $first: '$name' },
          currentPrice: { $first: '$price' },
          oldestPrice: { $last: '$price' },
          prices: { $push: '$price' }
        }
      }
    ]);

    if (!stockData || stockData.length === 0) {
      res.status(503).json({ 
        error: 'No stock data found. Background fetcher may still be initializing.' 
      });
      return;
    }

    console.log(`Processing ${stockData.length} stocks...`);

    const recommendations = stockData.map((stock: any) => {
      const ticker = stock._id;
      const stockId = stock.stock_id;
      const name = stock.name;
      const currentPrice = stock.currentPrice;
      const weekAgoPrice = stock.oldestPrice;

      // Calculate 7-day change percentage
      let change_7d_pct: number | null = null;
      if (weekAgoPrice && weekAgoPrice > 0) {
        change_7d_pct = calculate7DayPercentChange(currentPrice, weekAgoPrice);
      }

      // Calculate volatility as percentage (standard deviation of daily returns)
      const volatility_7d_pct = calculateVolatilityPercent(stock.prices);

      // Calculate scores
      let score: number | null = null;
      let sell_score: number | null = null;
      let recommendation = 'HOLD';

      if (change_7d_pct !== null) {
        const scores = calculateScores(change_7d_pct, volatility_7d_pct);
        score = scores.score;
        sell_score = scores.sell_score;
        recommendation = getRecommendation(score);
      }

      // Get ownership data
      const ownedShares = holdings[stockId]?.total_shares ?? 0;

      return {
        stock_id: stockId,
        ticker,
        name,
        price: currentPrice,
        change_7d_pct: change_7d_pct !== null ? parseFloat(change_7d_pct.toFixed(2)) : null,
        volatility_7d_pct: parseFloat(volatility_7d_pct.toFixed(2)),
        score: score !== null ? parseFloat(score.toFixed(2)) : null,
        sell_score: sell_score !== null ? parseFloat(sell_score.toFixed(2)) : null,
        recommendation,
        owned_shares: ownedShares,
        can_sell: ownedShares > 0
      };
    });

    // Sort by score descending (best buys first)
    recommendations.sort((a, b) => {
      if (a.score === null && b.score === null) return 0;
      if (a.score === null) return 1;
      if (b.score === null) return -1;
      return b.score - a.score;
    });

    console.log(`Returning ${recommendations.length} stock recommendations`);

    res.json(recommendations);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('Error:', err.message);
    } else {
      console.error('Unknown error');
    }

    res.status(500).json({ error: 'Failed to fetch stock recommendations.' });
  }
});

export default router;
