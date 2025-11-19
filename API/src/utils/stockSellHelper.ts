import axios from 'axios';
import Bottleneck from 'bottleneck';
import { StockPriceSnapshot } from '../models/StockPriceSnapshot';
import { 
  calculate7DayPercentChange, 
  calculateVolatilityPercent, 
  calculateScores
} from './stockMath';
import { logApiCall } from './apiCallLogger';

const RATE_LIMIT_PER_MINUTE = parseInt(process.env.TORN_RATE_LIMIT || '60', 10);

// Create a shared rate limiter
const limiter = new Bottleneck({
  reservoir: RATE_LIMIT_PER_MINUTE,
  reservoirRefreshAmount: RATE_LIMIT_PER_MINUTE,
  reservoirRefreshInterval: 60 * 1000, // 1 minute
  maxConcurrent: 1,
  minTime: Math.floor(60 * 1000 / RATE_LIMIT_PER_MINUTE),
});

interface StockRecommendation {
  stock_id: number;
  ticker: string;
  name: string;
  price: number;
  sell_score: number;
  owned_shares: number;
  total_value: number;
  benefit_requirement?: number | null;
}

interface SellRecommendation {
  stock_id: number;
  ticker: string;
  name: string;
  shares_to_sell: number;
  current_price: number;
  total_value: number;
  sell_url: string;
  sell_score: number;
}

/**
 * Calculate the best stock to sell to cover a specific cost
 * @param requiredAmount - The amount of money needed
 * @param userApiKey - The Torn API key of the user (decrypted)
 * @returns Sell recommendation with stock details and URL, or null if no suitable stock found
 */
export async function calculateBestStockToSell(requiredAmount: number, userApiKey: string): Promise<SellRecommendation | null> {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Fetch user's current stock holdings from Torn API
    const response = await limiter.schedule(() =>
      axios.get(`https://api.torn.com/v2/user?selections=stocks&key=${userApiKey}`)
    ) as { data: { stocks: any } };

    // Log the API call
    await logApiCall('user/stocks', 'stockSellHelper');

    const stocks = response.data?.stocks;
    
    if (!stocks || Object.keys(stocks).length === 0) {
      return null; // No stocks owned
    }

    // Create lookup map for holdings
    const holdingsMap: Record<number, { total_shares: number; avg_buy_price: number | null }> = {};
    for (const [stockId, stockData] of Object.entries(stocks) as [string, any][]) {
      const stockIdNum = parseInt(stockId, 10);
      const totalShares = stockData.total_shares || 0;
      const transactions = stockData.transactions || {};
      
      if (totalShares === 0) continue;
      
      // Calculate weighted average buy price
      let avgBuyPrice: number | null = null;
      if (totalShares > 0 && Object.keys(transactions).length > 0) {
        let weightedSum = 0;
        for (const transaction of Object.values(transactions) as any[]) {
          const shares = transaction.shares || 0;
          const boughtPrice = transaction.bought_price || 0;
          weightedSum += shares * boughtPrice;
        }
        avgBuyPrice = weightedSum / totalShares;
      }
      
      holdingsMap[stockIdNum] = {
        total_shares: totalShares,
        avg_buy_price: avgBuyPrice
      };
    }

    // Get stock IDs we own
    const ownedStockIds = Object.keys(holdingsMap).map(id => parseInt(id, 10));

    if (ownedStockIds.length === 0) {
      return null; // No stocks owned
    }

    // Fetch stock data for owned stocks
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
      return null; // No stock price data available
    }

    // Calculate sell scores for owned stocks
    const recommendations: StockRecommendation[] = [];

    for (const stock of stockData) {
      const stockId = stock.stock_id;
      const ticker = stock._id;
      const name = stock.name;
      const currentPrice = stock.currentPrice;
      const weekAgoPrice = stock.oldestPrice;
      const benefit_requirement = stock.benefit_requirement;

      const holding = holdingsMap[stockId];
      if (!holding || holding.total_shares === 0) {
        continue;
      }

      const ownedShares = holding.total_shares;
      const totalValue = currentPrice * ownedShares;

      // Calculate 7-day change percentage
      let sell_score = 0;
      if (weekAgoPrice && weekAgoPrice > 0) {
        const change_7d_pct = calculate7DayPercentChange(currentPrice, weekAgoPrice);
        const volatility_7d_pct = calculateVolatilityPercent(stock.prices);
        const scores = calculateScores(change_7d_pct, volatility_7d_pct);
        sell_score = scores.sell_score;
      }

      recommendations.push({
        stock_id: stockId,
        ticker,
        name,
        price: currentPrice,
        sell_score,
        owned_shares: ownedShares,
        total_value: totalValue,
        benefit_requirement: benefit_requirement
      });
    }

    // Filter stocks that have enough value to cover the cost
    // AND won't lose any stock block benefits after selling
    const affordableStocks = recommendations.filter(stock => {
      // Check if stock has enough value
      if (stock.total_value < requiredAmount) {
        return false;
      }
      
      // If stock has a benefit with a requirement, check if we'd lose a block
      if (stock.benefit_requirement && stock.benefit_requirement > 0) {
        // Calculate how many blocks user currently owns
        let benefitBlocksOwned = 0;
        if (stock.owned_shares >= stock.benefit_requirement) {
          let totalSharesNeeded = 0;
          let blockNum = 1;
          while (totalSharesNeeded + (stock.benefit_requirement * Math.pow(2, blockNum - 1)) <= stock.owned_shares) {
            totalSharesNeeded += stock.benefit_requirement * Math.pow(2, blockNum - 1);
            blockNum++;
          }
          benefitBlocksOwned = blockNum - 1;
        }
        
        if (benefitBlocksOwned > 0) {
          // Calculate shares needed to maintain current blocks
          let totalSharesForCurrentBlocks = 0;
          for (let i = 1; i <= benefitBlocksOwned; i++) {
            totalSharesForCurrentBlocks += stock.benefit_requirement * Math.pow(2, i - 1);
          }
          
          // Calculate how many shares would need to be sold
          const adjustedPrice = Math.max(stock.price - 0.1, 0.01);
          const sharesToSell = Math.ceil(requiredAmount / adjustedPrice);
          const sharesAfterSale = stock.owned_shares - sharesToSell;
          
          // If selling would drop below shares needed for current blocks, exclude this stock
          if (sharesAfterSale < totalSharesForCurrentBlocks) {
            return false;
          }
        }
        // If we don't currently have any blocks, we can sell freely
      }
      
      return true;
    });

    if (affordableStocks.length === 0) {
      return null; // No single stock has enough value or all would lose benefits
    }

    // Sort by sell_score descending (highest sell_score = best to sell)
    affordableStocks.sort((a, b) => b.sell_score - a.sell_score);

    // Get the best stock to sell
    const bestStock = affordableStocks[0];

    // Calculate shares to sell
    // Add buffer for price fluctuations (assume price drops by 0.1)
    const adjustedPrice = Math.max(bestStock.price - 0.1, 0.01);
    const sharesToSell = Math.ceil(requiredAmount / adjustedPrice);

    // Cap at owned shares
    const finalSharesToSell = Math.min(sharesToSell, bestStock.owned_shares);

    // Generate Torn.com sell URL
    const sellUrl = `https://www.torn.com/page.php?sid=stocks&stockID=${bestStock.stock_id}&tab=owned&sellamount=${finalSharesToSell}`;

    return {
      stock_id: bestStock.stock_id,
      ticker: bestStock.ticker,
      name: bestStock.name,
      shares_to_sell: finalSharesToSell,
      current_price: bestStock.price,
      total_value: finalSharesToSell * bestStock.price,
      sell_url: sellUrl,
      sell_score: bestStock.sell_score
    };
  } catch (error) {
    console.error('Error calculating best stock to sell:', error);
    return null;
  }
}
