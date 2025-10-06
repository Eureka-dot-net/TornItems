import { StockPriceSnapshot } from '../models/StockPriceSnapshot';
import { UserStockHoldingSnapshot } from '../models/UserStockHoldingSnapshot';
import { 
  calculate7DayPercentChange, 
  calculateVolatilityPercent, 
  calculateScores
} from './stockMath';

interface StockRecommendation {
  stock_id: number;
  ticker: string;
  name: string;
  price: number;
  sell_score: number;
  owned_shares: number;
  total_value: number;
  benefit?: {
    type: string;
    frequency: number;
    requirement: number;
    description: string;
  } | null;
}

interface SellRecommendation {
  stock_id: number;
  ticker: string;
  name: string;
  shares_to_sell: number;
  current_price: number;
  total_value: number;
  sell_url: string;
}

/**
 * Calculate the best stock to sell to cover a specific cost
 * @param requiredAmount - The amount of money needed
 * @returns Sell recommendation with stock details and URL, or null if no suitable stock found
 */
export async function calculateBestStockToSell(requiredAmount: number): Promise<SellRecommendation | null> {
  try {
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
      return null; // No stocks owned
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
          benefit: { $first: '$benefit' }
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
      const benefit = stock.benefit;

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
        benefit: benefit
      });
    }

    // Filter stocks that have enough value to cover the cost
    // AND won't lose their benefits after selling
    const affordableStocks = recommendations.filter(stock => {
      // Check if stock has enough value
      if (stock.total_value < requiredAmount) {
        return false;
      }
      
      // If stock has a benefit with a requirement, check if we'd lose it
      if (stock.benefit && stock.benefit.requirement > 0) {
        // Calculate how many shares would need to be sold
        const adjustedPrice = Math.max(stock.price - 0.1, 0.01);
        const sharesToSell = Math.ceil(requiredAmount / adjustedPrice);
        const sharesAfterSale = stock.owned_shares - sharesToSell;
        
        // If selling would drop below the requirement, exclude this stock
        if (sharesAfterSale < stock.benefit.requirement) {
          return false;
        }
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
      sell_url: sellUrl
    };
  } catch (error) {
    console.error('Error calculating best stock to sell:', error);
    return null;
  }
}
