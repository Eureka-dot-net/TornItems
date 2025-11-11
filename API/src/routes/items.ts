import express, { Request, Response } from 'express';
import { TornItem } from '../models/TornItem';
import { logInfo, logError } from '../utils/logger';

const router = express.Router({ mergeParams: true });

/**
 * GET /api/items/market-prices
 * Fetch market prices for specific items by their IDs
 * Query parameter: itemIds (comma-separated list of item IDs)
 * Special handling: itemId 0 returns points market price
 */
router.get('/market-prices', async (req: Request, res: Response) => {
  try {
    const { itemIds } = req.query;
    
    if (!itemIds || typeof itemIds !== 'string') {
      return res.status(400).json({ error: 'itemIds query parameter is required (comma-separated list)' });
    }
    
    // Parse comma-separated item IDs and validate
    // Allow 0 for points market
    const ids = itemIds.split(',')
      .map(id => parseInt(id.trim(), 10))
      .filter(id => !isNaN(id) && id >= 0);
    
    if (ids.length === 0) {
      return res.status(400).json({ error: 'No valid item IDs provided' });
    }
    
    logInfo(`Fetching market prices for items: ${ids.join(', ')}`);
    
    // Fetch items from database (including itemId 0 for points)
    const items = await TornItem.find({ itemId: { $in: ids } }).lean();
    
    // Build response object mapping itemId to market_price
    const prices: Record<number, number | null> = {};
    for (const item of items) {
      prices[item.itemId] = item.market_price ?? null;
    }
    
    // Ensure all requested IDs are in the response (even if not found)
    for (const id of ids) {
      if (!(id in prices)) {
        prices[id] = null;
      }
    }
    
    res.json({ prices });
  } catch (error) {
    logError('Error fetching market prices', error instanceof Error ? error : new Error(String(error)));
    res.status(500).json({ error: 'Failed to fetch market prices' });
  }
});

export default router;
