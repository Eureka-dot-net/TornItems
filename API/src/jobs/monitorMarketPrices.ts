import axios from 'axios';
import Bottleneck from 'bottleneck';
import { MarketWatchlistItem } from '../models/MarketWatchlistItem';
import { logInfo, logError } from '../utils/logger';
import { sendDiscordChannelAlert } from '../utils/discord';
import { calculateBestStockToSell } from '../utils/stockSellHelper';
import { decrypt } from '../utils/encryption';

const RATE_LIMIT_PER_MINUTE = parseInt(process.env.TORN_RATE_LIMIT || '60', 10);

// Create a shared rate limiter for market monitoring
// This ensures we don't exceed Torn API rate limits
const limiter = new Bottleneck({
  reservoir: RATE_LIMIT_PER_MINUTE,
  reservoirRefreshAmount: RATE_LIMIT_PER_MINUTE,
  reservoirRefreshInterval: 60 * 1000, // 1 minute
  maxConcurrent: 1,
  minTime: Math.floor(60 * 1000 / RATE_LIMIT_PER_MINUTE),
});

// Exponential backoff retry logic
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error = new Error('Unknown error');
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (axios.isAxiosError(error) && error.response?.status === 429) {
        const delay = baseDelay * Math.pow(2, i);
        logInfo(`Rate limited, retrying in ${delay}ms...`, { attempt: i + 1 });
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  
  throw lastError;
}

/**
 * Calculate smart quantity intervals for purchase recommendations.
 * If availableQuantity <= 5, returns [1, 2, 3, 4, 5] up to the available amount.
 * If availableQuantity > 5, returns up to 5 evenly spaced intervals including 1 and the max.
 * Example: for 100 items, returns [1, 20, 40, 60, 80, 100] (6 values)
 * Example: for 82 items, returns [1, 16, 32, 48, 64, 82] (6 values)
 */
export function calculateQuantityIntervals(availableQuantity: number): number[] {
  if (availableQuantity <= 5) {
    // For 5 or fewer items, return sequential quantities
    return Array.from({ length: availableQuantity }, (_, i) => i + 1);
  }
  
  // For more than 5 items, calculate evenly spaced intervals
  // Calculate interval size as max/5, then show multiples up to max
  const intervals: number[] = [1]; // Always start with 1
  const step = Math.floor(availableQuantity / 5);
  
  // Add intervals at step, step*2, step*3, step*4
  for (let i = 1; i <= 4; i++) {
    const value = step * i;
    // Only add if it's greater than the last value and less than max
    if (value > intervals[intervals.length - 1] && value < availableQuantity) {
      intervals.push(value);
    }
  }
  
  // Always include the max (even if it creates 6 values total)
  if (intervals[intervals.length - 1] !== availableQuantity) {
    intervals.push(availableQuantity);
  }
  
  return intervals;
}

/**
 * Monitors market prices for watchlist items and sends Discord alerts when prices drop below thresholds.
 * Uses random API keys from users watching each item and sends alerts to user-specific channels.
 * Includes deduplication logic to prevent spam for the same price.
 */
export async function monitorMarketPrices(): Promise<void> {
  try {
    // Get all enabled watchlist items
    const watchlistItems = await MarketWatchlistItem.find({ enabled: true });
    
    if (watchlistItems.length === 0) {
      logInfo('No enabled items in watchlist to monitor');
      return;
    }
    
    logInfo(`Monitoring ${watchlistItems.length} enabled watchlist items for price alerts...`);
    
    // Group watches by itemId to process each item once with all watchers
    const itemWatchMap = new Map<number, typeof watchlistItems>();
    for (const watch of watchlistItems) {
      if (!itemWatchMap.has(watch.itemId)) {
        itemWatchMap.set(watch.itemId, []);
      }
      itemWatchMap.get(watch.itemId)!.push(watch);
    }
    
    for (const [itemId, watches] of itemWatchMap.entries()) {
      try {
        // Select a random watch to get an API key
        const randomWatch = watches[Math.floor(Math.random() * watches.length)];
        const apiKey = decrypt(randomWatch.apiKey);
        
        // Fetch market data for this item using rate limiter
        const response = await retryWithBackoff(() =>
          limiter.schedule(() =>
            axios.get(`https://api.torn.com/v2/market/${itemId}/itemmarket?limit=20&key=${apiKey}`)
          )
        ) as { data: { itemmarket: any } };
        
        const itemmarket = response.data?.itemmarket;
        if (!itemmarket || !itemmarket.listings || itemmarket.listings.length === 0) {
          continue;
        }
        
        // Find the lowest priced listing
        const listings = itemmarket.listings;
        const lowestListing = listings.reduce((min: any, listing: any) => 
          listing.price < min.price ? listing : min
        , listings[0]);
        
        const lowestPrice = lowestListing.price;
        const availableQuantity = lowestListing.amount || 1;
        
        // Check each watch for this item
        for (const watch of watches) {
          try {
            // Check if price is below threshold
            if (lowestPrice < watch.alert_below) {
              // Check if we already sent an alert for this price (deduplication)
              if (watch.lastAlertPrice === lowestPrice) {
                logInfo(`Skipping duplicate alert for ${watch.name} at $${lowestPrice.toLocaleString()} for user ${watch.discordUserId}`);
                continue;
              }
              
              // Format the alert message
              const userMention = `<@${watch.discordUserId}>`;
              
              // Calculate stock sell recommendations for multiple quantities using user's API key
              const userApiKey = decrypt(watch.apiKey);
              const quantityOptions: Array<{ qty: number; recommendation: any }> = [];
              
              // Calculate smart quantity intervals (max 5 options)
              const quantities = calculateQuantityIntervals(availableQuantity);
              
              for (const qty of quantities) {
                const totalCost = lowestPrice * qty;
                const recommendation = await calculateBestStockToSell(totalCost, userApiKey);
                
                if (recommendation) {
                  quantityOptions.push({ qty, recommendation });
                }
              }
              
              const messageParts = [
                '🚨 Cheap item found!',
                `💊 ${availableQuantity}x ${watch.name} at $${lowestPrice.toLocaleString()} each (below $${watch.alert_below.toLocaleString()})`,
                userMention,
                `https://www.torn.com/page.php?sid=ItemMarket#/market/view=search&itemID=${encodeURIComponent(itemId)}`
              ];
              
              // Add stock sell recommendations for each quantity
              if (quantityOptions.length > 0) {
                messageParts.push('');
                messageParts.push('💰 Click here to sell stocks to buy:');
                
                for (const option of quantityOptions) {
                  const { qty, recommendation } = option;
                  const totalCost = (lowestPrice * qty).toLocaleString();
                  const scoreFormatted = recommendation.sell_score.toFixed(2);
                  messageParts.push(`${qty}x (score: ${scoreFormatted}) - $${totalCost} - ${recommendation.sell_url}`);
                }
              }
              
              const message = messageParts.filter(Boolean).join('\n');
              
              // Send Discord alert to user's channel
              await sendDiscordChannelAlert(watch.channelId, message);
              
              // Update last alert info to prevent duplicate alerts
              await MarketWatchlistItem.updateOne(
                { _id: watch._id },
                { 
                  lastAlertPrice: lowestPrice,
                  lastAlertTimestamp: new Date()
                }
              );
              
              logInfo(`Alert sent for ${watch.name} at $${lowestPrice.toLocaleString()} to user ${watch.discordUserId}`);
            } else {
              // Price is above threshold, reset last alert price so we can alert again if it drops
              if (watch.lastAlertPrice !== null) {
                await MarketWatchlistItem.updateOne(
                  { _id: watch._id },
                  { lastAlertPrice: null }
                );
              }
            }
          } catch (error) {
            logError(`Error processing watch for ${watch.name} (user: ${watch.discordUserId})`, 
              error instanceof Error ? error : new Error(String(error)));
          }
        }
        
      } catch (error) {
        logError(`Error monitoring item ${itemId}`, 
          error instanceof Error ? error : new Error(String(error)));
      }
    }
    
  } catch (error) {
    logError('Error in market price monitoring', error instanceof Error ? error : new Error(String(error)));
  }
}
