import express, { Request, Response } from 'express';
import { StockTransactionHistory } from '../models/StockTransactionHistory';
import { StockRecommendation } from '../models/StockRecommendation';

const router = express.Router({ mergeParams: true });

// GET /stocks/recommendations
router.get('/stocks/recommendations', async (_req: Request, res: Response): Promise<void> => {
  try {
    console.log('Fetching stock recommendations from aggregated data...');

    // Get today's date for fetching the latest aggregated data
    const today = new Date().toISOString().split('T')[0];

    // Fetch aggregated recommendations data (latest available, typically today)
    // Get the most recent date available in StockRecommendation
    const latestRecommendationDate = await StockRecommendation.findOne()
      .sort({ date: -1 })
      .select('date')
      .lean();

    const dateToFetch = latestRecommendationDate?.date || today;

    // Fetch all recommendations for the latest date
    const recommendations = await StockRecommendation.find({ date: dateToFetch })
      .lean();

    if (!recommendations || recommendations.length === 0) {
      res.status(503).json({ 
        error: 'No stock recommendations found. Background aggregation may still be initializing.' 
      });
      return;
    }

    console.log(`Found ${recommendations.length} stock recommendations for date ${dateToFetch}`);

    // Sort by score descending (best buys first)
    const sortedRecommendations = recommendations.sort((a, b) => {
      if (a.score === null && b.score === null) return 0;
      if (a.score === null) return 1;
      if (b.score === null) return -1;
      return b.score - a.score;
    });

    // Map to API response format (remove internal fields)
    const response = sortedRecommendations.map(rec => ({
      stock_id: rec.stock_id,
      ticker: rec.ticker,
      name: rec.name,
      price: rec.price,
      change_7d_pct: rec.change_7d_pct,
      volatility_7d_pct: rec.volatility_7d_pct,
      score: rec.score,
      sell_score: rec.sell_score,
      recommendation: rec.recommendation,
      owned_shares: rec.owned_shares,
      avg_buy_price: rec.avg_buy_price,
      unrealized_profit_value: rec.unrealized_profit_value,
      unrealized_profit_pct: rec.unrealized_profit_pct,
      can_sell: rec.can_sell,
      max_shares_to_sell: rec.max_shares_to_sell
    }));

    console.log(`Returning ${response.length} stock recommendations`);

    res.json(response);
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
    console.log('Fetching top stock to sell recommendation from aggregated data...');

    // Get today's date for fetching the latest aggregated data
    const today = new Date().toISOString().split('T')[0];

    // Fetch aggregated recommendations data (latest available, typically today)
    // Get the most recent date available in StockRecommendation
    const latestRecommendationDate = await StockRecommendation.findOne()
      .sort({ date: -1 })
      .select('date')
      .lean();

    const dateToFetch = latestRecommendationDate?.date || today;

    // Fetch recommendations that can be sold
    const sellableStocks = await StockRecommendation.find({ 
      date: dateToFetch,
      can_sell: true,
      sell_score: { $ne: null }
    }).lean();

    if (!sellableStocks || sellableStocks.length === 0) {
      res.status(404).json({ error: 'No sellable stocks found' });
      return;
    }

    console.log(`Found ${sellableStocks.length} sellable stocks for date ${dateToFetch}`);

    // Sort by sell_score descending (highest sell_score = best to sell)
    const sortedStocks = sellableStocks.sort((a, b) => {
      if (a.sell_score === null && b.sell_score === null) return 0;
      if (a.sell_score === null) return 1;
      if (b.sell_score === null) return -1;
      return b.sell_score - a.sell_score;
    });

    // Return the top stock to sell
    const topStock = sortedStocks[0];

    // Map to API response format (remove internal fields)
    const response = {
      stock_id: topStock.stock_id,
      ticker: topStock.ticker,
      name: topStock.name,
      price: topStock.price,
      change_7d_pct: topStock.change_7d_pct,
      volatility_7d_pct: topStock.volatility_7d_pct,
      score: topStock.score,
      sell_score: topStock.sell_score,
      recommendation: topStock.recommendation,
      owned_shares: topStock.owned_shares,
      avg_buy_price: topStock.avg_buy_price,
      unrealized_profit_value: topStock.unrealized_profit_value,
      unrealized_profit_pct: topStock.unrealized_profit_pct,
      can_sell: topStock.can_sell,
      max_shares_to_sell: topStock.max_shares_to_sell
    };

    console.log(`Returning top stock to sell: ${topStock.ticker}`);

    res.json(response);
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
