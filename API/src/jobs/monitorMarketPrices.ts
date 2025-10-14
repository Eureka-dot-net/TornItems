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
 * If availableQuantity > 5, returns exactly 5 values: 1, max, and 3 evenly spaced values at 25%, 50%, 75%.
 * Example: for 100 items, returns [1, 25, 50, 75, 100]
 * Example: for 82 items, returns [1, 21, 41, 62, 82]
 */
export function calculateQuantityIntervals(availableQuantity: number): number[] {
  if (availableQuantity <= 5) {
    // For 5 or fewer items, return sequential quantities
    return Array.from({ length: availableQuantity }, (_, i) => i + 1);
  }
  
  // For more than 5 items, return exactly 5 values: 1, 25%, 50%, 75%, and max
  return [
    1,
    Math.round(availableQuantity * 0.25),
    Math.round(availableQuantity * 0.5),
    Math.round(availableQuantity * 0.75),
    availableQuantity
  ];
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
        
        let lowestPrice: number;
        let availableQuantity: number;
        let isPointsMarket = false;
        
        // Check if this is the points market (itemId 0)
        if (itemId === 0) {
          isPointsMarket = true;
          // Fetch points market data using different endpoint
          const response = await retryWithBackoff(() =>
            limiter.schedule(() =>
              axios.get(`https://api.torn.com/v2/market?selections=pointsmarket&limit=20&key=${apiKey}`)
            )
          ) as { data: { pointsmarket: any } };
          
          const pointsmarket = response.data?.pointsmarket;
          if (!pointsmarket || Object.keys(pointsmarket).length === 0) {
            continue;
          }
          
          // Find the lowest cost per point from the listings
          // pointsmarket format: { "listingId": { cost: 30350, quantity: 30, total_cost: 910500 }, ... }
          const listings = Object.values(pointsmarket) as Array<{ cost: number; quantity: number; total_cost: number }>;
          const lowestListing = listings.reduce((min, listing) => 
            listing.cost < min.cost ? listing : min
          , listings[0]);
          
          lowestPrice = lowestListing.cost;
          availableQuantity = lowestListing.quantity;
        } else {
          // Fetch regular item market data
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
          
          lowestPrice = lowestListing.price;
          availableQuantity = lowestListing.amount || 1;
        }
        
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
              
              // For points market, only show full quantity option
              // For regular items, calculate smart quantity intervals (max 5 options)
              const quantities = isPointsMarket ? [availableQuantity] : calculateQuantityIntervals(availableQuantity);
              
              for (const qty of quantities) {
                const totalCost = lowestPrice * qty;
                const recommendation = await calculateBestStockToSell(totalCost, userApiKey);
                
                if (recommendation) {
                  quantityOptions.push({ qty, recommendation });
                }
              }
              
              // Generate appropriate URL based on item type
              const itemUrl = isPointsMarket 
                ? 'https://www.torn.com/pmarket.php'
                : `https://www.torn.com/page.php?sid=ItemMarket#/market/view=search&itemID=${encodeURIComponent(itemId)}`;
              
              const messageParts = [
                '🚨 Cheap item found!',
                `💊 ${availableQuantity}x ${watch.name} at $${lowestPrice.toLocaleString()} each (below $${watch.alert_below.toLocaleString()})`,
                userMention,
                itemUrl
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
