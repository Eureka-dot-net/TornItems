# Quick Start Guide: Travel Notifications

## What is this?

Get Discord notifications when to board flights to land exactly at 15-minute restock slots!

## Setup (One-time)

1. Register your Torn API key:
   ```
   /setkey YOUR_API_KEY
   ```

## Basic Usage

### Set up a notification for Mexico:
```
/notifytravel Mexico
```

The bot will tell you when to board so you land at the next 15-min slot!

### Advanced Example:
```
/notifytravel Mexico 10 true 1429 258 259
```

This will:
- ✅ Notify you 10 seconds before you should board
- ✅ Account for your private island (30% faster travel)
- ✅ Track items 1429, 258, and 259
- ✅ Generate a shop URL when you arrive

## What You'll Receive

### 1. Before Departure (10 seconds before)
```
🛫 Travel Alert - 10s Warning

Prepare to board for Mexico!
Board in 10 seconds to land at 13:30
```

### 2. At Departure (on the dot)
```
🛫 Travel Alert - BOARD NOW!

Board now for Mexico!
You will land at 13:30 (next 15-min restock slot)

https://www.torn.com/page.php?sid=travel&destination=mex
```

### 3. On Arrival
```
✈️ Welcome to Mexico!

You've arrived! Here's your shop URL:

https://www.torn.com/page.php?sid=travel&item1=1429&item2=258&item3=259&amount=19&arrival=1759933865

Watch Items: 1429, 258, 259
Items to Buy: 19
```

## Other Commands

### See your notifications:
```
/listtravelnotifications
```

### Disable a notification:
```
/disabletravelnotification Mexico
```

## How It Works

**Example:** You ask for Mexico notifications at 13:00

1. Travel time: 18 minutes (or 13 min with private island)
2. If you board now, you'd land at: 13:18
3. Next 15-minute slot: **13:30**
4. So you should board at: **13:12**
5. Bot notifies you at: 13:11:50 and 13:12:00

Simple!

## Supported Countries

Mexico • Canada • Hawaii • Japan • China • Argentina  
United Kingdom • UAE • South Africa • Cayman Islands • Switzerland

## Tips

💡 **Private Island:** Set it once, it applies to all countries  
💡 **Watch Items:** Different for each country (e.g., Xanax in Mexico, DVDs in Japan)  
💡 **Auto-Update:** Re-run `/notifytravel` to update any setting  
💡 **Multiple Countries:** Set up as many as you want!

## Need Help?

Check the full documentation: `TRAVEL_NOTIFICATION_FEATURE.md`
