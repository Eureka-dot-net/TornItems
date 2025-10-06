import axios from 'axios';
import Bottleneck from 'bottleneck';
import { MarketWatchlistItem } from '../models/MarketWatchlistItem';
import { logInfo, logError } from '../utils/logger';
import { sendDiscordAlert } from '../utils/discord';

const API_KEY = process.env.TORN_API_KEY || 'yLp4OoENbjRy30GZ';
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
 * Monitors market prices for watchlist items and sends Discord alerts when prices drop below thresholds.
 * Includes deduplication logic to prevent spam for the same price.
 */
export async function monitorMarketPrices(): Promise<void> {
  try {
    // Get all watchlist items
    const watchlistItems = await MarketWatchlistItem.find({});
    
    if (watchlistItems.length === 0) {
      logInfo('No items in watchlist to monitor');
      return;
    }
    
    logInfo(`Monitoring ${watchlistItems.length} watchlist items for price alerts...`);
    
    for (const watchlistItem of watchlistItems) {
      try {
        // Fetch market data for this item using rate limiter
        const response = await retryWithBackoff(() =>
          limiter.schedule(() =>
            axios.get(`https://api.torn.com/v2/market/${watchlistItem.itemId}/itemmarket?limit=20&key=${API_KEY}`)
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
        
        // Check if price is below threshold
        if (lowestPrice < watchlistItem.alert_below) {
          // Check if we already sent an alert for this price (deduplication)
          if (watchlistItem.lastAlertPrice === lowestPrice) {
            logInfo(`Skipping duplicate alert for ${watchlistItem.name} at $${lowestPrice.toLocaleString()}`);
            continue;
          }
          
          // Format the alert message
          const discordUserId = process.env.MY_DISCORD_USER_ID;
          const userMention = discordUserId ? `<@${discordUserId}>` : '';
          
          const message = [
            '🚨 Cheap item found!',
            `💊 ${watchlistItem.name} listed at $${lowestPrice.toLocaleString()} (below $${watchlistItem.alert_below.toLocaleString()})`,
            userMention,
            `https://www.torn.com/page.php?sid=ItemMarket#/market/view=search&itemID=${encodeURIComponent(watchlistItem.itemId)}`
          ].filter(Boolean).join('\n');
          
          // Send Discord alert
          await sendDiscordAlert(message);
          
          // Update last alert info to prevent duplicate alerts
          await MarketWatchlistItem.updateOne(
            { itemId: watchlistItem.itemId },
            { 
              lastAlertPrice: lowestPrice,
              lastAlertTimestamp: new Date()
            }
          );
          
          logInfo(`Alert sent for ${watchlistItem.name} at $${lowestPrice.toLocaleString()}`);
        } else {
          // Price is above threshold, reset last alert price so we can alert again if it drops
          if (watchlistItem.lastAlertPrice !== null) {
            await MarketWatchlistItem.updateOne(
              { itemId: watchlistItem.itemId },
              { lastAlertPrice: null }
            );
          }
        }
        
      } catch (error) {
        logError(`Error monitoring item ${watchlistItem.name} (ID: ${watchlistItem.itemId})`, 
          error instanceof Error ? error : new Error(String(error)));
      }
    }
    
  } catch (error) {
    logError('Error in market price monitoring', error instanceof Error ? error : new Error(String(error)));
  }
}
