import express, { Request, Response } from 'express';
import { StockPriceSnapshot } from '../models/StockPriceSnapshot';
import { UserStockHoldingSnapshot } from '../models/UserStockHoldingSnapshot';

const router = express.Router({ mergeParams: true });

// Helper function to calculate standard deviation
function calculateStdDev(values: number[]): number {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  
  return Math.sqrt(variance);
}

// Helper function to determine recommendation based on score
function getRecommendation(score: number): string {
  if (score >= 3) return 'STRONG_BUY';
  if (score >= 1) return 'BUY';
  if (score > -1) return 'HOLD';
  if (score > -3) return 'SELL';
  return 'STRONG_SELL';
}

// GET /stocks/recommendations
router.get('/stocks/recommendations', async (_req: Request, res: Response): Promise<void> => {
  try {
    console.log('Fetching stock recommendations...');

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch most recent user stock holdings from database
    const holdingsSnapshots = await UserStockHoldingSnapshot.aggregate([
      {
        $sort: { stock_id: 1, timestamp: -1 }
      },
      {
        $group: {
          _id: '$stock_id',
          total_shares: { $first: '$total_shares' },
          avg_buy_price: { $first: '$avg_buy_price' },
          transaction_count: { $first: '$transaction_count' },
          timestamp: { $first: '$timestamp' }
        }
      }
    ]);
    
    // Create lookup map for holdings
    const holdingsMap: Record<number, { total_shares: number; avg_buy_price: number | null }> = {};
    for (const holding of holdingsSnapshots) {
      holdingsMap[holding._id] = {
        total_shares: holding.total_shares,
        avg_buy_price: holding.avg_buy_price
      };
    }

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
      let change_7d: number | null = null;
      if (weekAgoPrice && weekAgoPrice > 0) {
        change_7d = ((currentPrice - weekAgoPrice) / weekAgoPrice) * 100;
      }

      // Calculate volatility (standard deviation of prices over last 7 days)
      const volatility = calculateStdDev(stock.prices);

      // Calculate scores
      let score: number | null = null;
      let sell_score: number | null = null;
      let recommendation = 'HOLD';

      if (change_7d !== null && volatility > 0) {
        score = -change_7d / volatility;
        sell_score = change_7d / volatility;
        recommendation = getRecommendation(score);
      }

      // Get ownership data and calculate P/L
      const holding = holdingsMap[stockId];
      const ownedShares = holding?.total_shares ?? 0;
      const avgBuyPrice = holding?.avg_buy_price ?? null;
      
      let unrealizedProfitValue: number | null = null;
      let unrealizedProfitPct: number | null = null;
      
      if (ownedShares > 0 && avgBuyPrice !== null && avgBuyPrice > 0) {
        unrealizedProfitValue = (currentPrice - avgBuyPrice) * ownedShares;
        unrealizedProfitPct = ((currentPrice / avgBuyPrice) - 1) * 100;
      }

      return {
        stock_id: stockId,
        ticker,
        name,
        price: currentPrice,
        change_7d: change_7d !== null ? parseFloat(change_7d.toFixed(2)) : null,
        volatility: parseFloat(volatility.toFixed(2)),
        score: score !== null ? parseFloat(score.toFixed(2)) : null,
        sell_score: sell_score !== null ? parseFloat(sell_score.toFixed(2)) : null,
        recommendation,
        owned_shares: ownedShares,
        avg_buy_price: avgBuyPrice,
        unrealized_profit_value: unrealizedProfitValue !== null ? parseFloat(unrealizedProfitValue.toFixed(2)) : null,
        unrealized_profit_pct: unrealizedProfitPct !== null ? parseFloat(unrealizedProfitPct.toFixed(2)) : null,
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
