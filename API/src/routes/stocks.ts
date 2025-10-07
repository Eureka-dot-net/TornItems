import express, { Request, Response } from 'express';
import { StockPriceSnapshot } from '../models/StockPriceSnapshot';
import { UserStockHoldingSnapshot } from '../models/UserStockHoldingSnapshot';
import { StockTransactionHistory } from '../models/StockTransactionHistory';
import { 
  calculate7DayPercentChange, 
  calculateVolatilityPercent, 
  calculateScores,
  getRecommendation 
} from '../utils/stockMath';

const router = express.Router({ mergeParams: true });

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
          prices: { $push: '$price' },
          benefit_requirement: { $first: '$benefit_requirement' }
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
      const benefitRequirement = stock.benefit_requirement;

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

      // Calculate can_sell and max_shares_to_sell based on benefit preservation
      let canSell = ownedShares > 0;
      let maxSharesToSell = ownedShares;

      if (ownedShares > 0 && benefitRequirement && benefitRequirement > 0) {
        const currentlyHasBenefit = ownedShares >= benefitRequirement;
        
        if (currentlyHasBenefit) {
          // User has the benefit, can only sell shares above the requirement
          maxSharesToSell = Math.max(0, ownedShares - benefitRequirement);
          // Can only sell if we have shares above the requirement
          canSell = maxSharesToSell > 0;
        }
        // If we don't have the benefit, we can sell all shares freely
      }

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
        avg_buy_price: avgBuyPrice,
        unrealized_profit_value: unrealizedProfitValue !== null ? parseFloat(unrealizedProfitValue.toFixed(2)) : null,
        unrealized_profit_pct: unrealizedProfitPct !== null ? parseFloat(unrealizedProfitPct.toFixed(2)) : null,
        can_sell: canSell,
        max_shares_to_sell: maxSharesToSell
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

// GET /stocks/recommendations/top-sell
router.get('/stocks/recommendations/top-sell', async (_req: Request, res: Response): Promise<void> => {
  try {
    console.log('Fetching top stock to sell recommendation...');

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
      },
      {
        $match: {
          total_shares: { $gt: 0 } // Only stocks we own
        }
      }
    ]);
    
    if (holdingsSnapshots.length === 0) {
      res.status(404).json({ error: 'No stocks owned' });
      return;
    }

    // Create lookup map for holdings
    const holdingsMap: Record<number, { total_shares: number; avg_buy_price: number | null }> = {};
    for (const holding of holdingsSnapshots) {
      holdingsMap[holding._id] = {
        total_shares: holding.total_shares,
        avg_buy_price: holding.avg_buy_price
      };
    }

    // Get stock IDs we own
    const ownedStockIds = holdingsSnapshots.map(h => h._id);

    // Use aggregation to get all data efficiently for owned stocks
    const stockData = await StockPriceSnapshot.aggregate([
      {
        $match: {
          timestamp: { $gte: sevenDaysAgo },
          stock_id: { $in: ownedStockIds }
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
          prices: { $push: '$price' },
          benefit_requirement: { $first: '$benefit_requirement' }
        }
      }
    ]);

    if (!stockData || stockData.length === 0) {
      res.status(503).json({ 
        error: 'No stock data found. Background fetcher may still be initializing.' 
      });
      return;
    }

    // Calculate sell scores for owned stocks
    const recommendations = stockData.map((stock: any) => {
      const ticker = stock._id;
      const stockId = stock.stock_id;
      const name = stock.name;
      const currentPrice = stock.currentPrice;
      const weekAgoPrice = stock.oldestPrice;
      const benefitRequirement = stock.benefit_requirement;

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

      // Calculate can_sell and max_shares_to_sell based on benefit preservation
      let canSell = ownedShares > 0;
      let maxSharesToSell = ownedShares;

      if (ownedShares > 0 && benefitRequirement && benefitRequirement > 0) {
        const currentlyHasBenefit = ownedShares >= benefitRequirement;
        
        if (currentlyHasBenefit) {
          // User has the benefit, can only sell shares above the requirement
          maxSharesToSell = Math.max(0, ownedShares - benefitRequirement);
          // Can only sell if we have shares above the requirement
          canSell = maxSharesToSell > 0;
        }
        // If we don't have the benefit, we can sell all shares freely
      }

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
        avg_buy_price: avgBuyPrice,
        unrealized_profit_value: unrealizedProfitValue !== null ? parseFloat(unrealizedProfitValue.toFixed(2)) : null,
        unrealized_profit_pct: unrealizedProfitPct !== null ? parseFloat(unrealizedProfitPct.toFixed(2)) : null,
        can_sell: canSell,
        max_shares_to_sell: maxSharesToSell
      };
    });

    // Filter to only stocks that can be sold
    const sellableStocks = recommendations.filter(stock => stock.can_sell && stock.sell_score !== null);

    if (sellableStocks.length === 0) {
      res.status(404).json({ error: 'No sellable stocks found' });
      return;
    }

    // Sort by sell_score descending (highest sell_score = best to sell)
    sellableStocks.sort((a, b) => {
      if (a.sell_score === null && b.sell_score === null) return 0;
      if (a.sell_score === null) return 1;
      if (b.sell_score === null) return -1;
      return b.sell_score - a.sell_score;
    });

    // Return the top stock to sell
    const topStock = sellableStocks[0];

    console.log(`Returning top stock to sell: ${topStock.ticker}`);

    res.json(topStock);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('Error:', err.message);
    } else {
      console.error('Unknown error');
    }

    res.status(500).json({ error: 'Failed to fetch top stock to sell recommendation.' });
  }
});

// GET /stocks/profit
router.get('/stocks/profit', async (_req: Request, res: Response): Promise<void> => {
  try {
    console.log('Fetching stock transaction history...');

    // Fetch all transaction records, sorted by timestamp descending (newest first)
    const transactions = await StockTransactionHistory.find()
      .sort({ timestamp: -1 })
      .lean();

    console.log(`Returning ${transactions.length} stock transactions`);

    res.json(transactions);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('Error:', err.message);
    } else {
      console.error('Unknown error');
    }

    res.status(500).json({ error: 'Failed to fetch stock transaction history.' });
  }
});

export default router;
