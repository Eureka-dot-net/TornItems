# Travel Notification Feature

## Overview

The Travel Notification feature allows users to receive Discord notifications when it's time to board flights to foreign countries, ensuring they land exactly at 15-minute restock slots (e.g., 12:00, 12:15, 12:30, 12:45).

## Features

- ✈️ **Smart Scheduling**: Automatically calculates when to board to land at the next 15-minute slot
- 🏝️ **Private Island Support**: 30% travel time reduction for users with private islands
- 🔔 **Dual Notifications**: Alerts sent both X seconds before departure and at departure time
- 👁️ **Watch Items**: Track up to 3 items per destination
- 📦 **Auto-Buy Support**: Generates Torn shop URLs with your watch items
- 🌍 **Multi-Country**: Set up notifications for all foreign countries

## Commands

### `/notifytravel`

Set up or update a travel notification for a specific country.

**Parameters:**
- `country` (required) - Destination country (e.g., Mexico, Canada, Japan)
- `notifybeforeseconds` (optional) - Seconds before departure to notify (default: 10, min: 1, max: 300)
- `hasprivateisland` (optional) - Do you have a private island? (reduces travel time by 30%)
- `watchitem1` (optional) - First item ID to watch
- `watchitem2` (optional) - Second item ID to watch
- `watchitem3` (optional) - Third item ID to watch
- `itemstobuy` (optional) - Number of items to buy (default: 19, max: 19)

**Examples:**
```
/notifytravel Mexico
/notifytravel Mexico 10 true 1429 258 259
/notifytravel Japan 30 false 1429
```

**Persistent Settings:**
- `hasPrivateIsland` - Stored globally across all destinations
- `itemsToBuy` - Stored globally across all destinations
- `watchItems` - Stored per destination

When you update a notification, only the parameters you provide will be changed. Other settings remain unchanged.

### `/listtravelnotifications`

List all your travel notifications and their settings.

**Example:**
```
/listtravelnotifications
```

### `/disabletravelnotification`

Disable a travel notification for a specific country without deleting it.

**Parameters:**
- `country` (required) - Destination country to disable notifications for

**Example:**
```
/disabletravelnotification Mexico
```

## How It Works

### 1. Initial Setup

Users must first register their Torn API key using `/setkey` before setting up travel notifications.

### 2. Calculation Logic

When you ask for a notification (e.g., Mexico at 13:00):

1. **Current Time**: 13:00
2. **Travel Time**: 18 minutes (without private island) or ~13 minutes (with private island)
3. **Landing Time if Board Now**: 13:18 (or 13:13 with island)
4. **Next 15-min Slot**: 13:30 (or 13:15 with island)
5. **Board at**: 13:12 (or 13:02 with island)
6. **Notify**: 13:11:50 and 13:12:00 (10 seconds before and on the dot)

### 3. Background Service

The background service runs every 10 seconds to:
- Check if it's time to send boarding notifications
- Monitor users who should be arriving soon
- Send shop URLs when users land (if watch items are configured)

### 4. Shop URLs

When you land (or are about to land), the bot sends you a URL like:
```
https://www.torn.com/page.php?sid=travel&item1=1429&item2=258&item3=259&amount=19&arrival=1759933865
```

This URL includes:
- Your watch items (item1, item2, item3)
- Number of items to buy (amount)
- Arrival timestamp (arrival) - retrieved from Torn API travel status

## Database Schema

### TravelNotification Model

```typescript
{
  discordUserId: string;           // Discord user ID
  countryCode: string;             // e.g., 'mex', 'can', 'jap'
  notifyBeforeSeconds: number;     // Default: 10
  hasPrivateIsland: boolean;       // Default: false
  watchItems: number[];            // Up to 3 item IDs
  itemsToBuy: number;              // Default: 19
  enabled: boolean;                // Default: true
  lastNotificationSent?: Date;     // Last notification timestamp
  scheduledDepartureTime?: Date;   // When to depart
  scheduledArrivalTime?: Date;     // When to arrive
  createdAt: Date;
  updatedAt: Date;
}
```

## Supported Countries

- Mexico (mex)
- Canada (can)
- Hawaii (haw)
- Japan (jap)
- China (chi)
- Argentina (arg)
- United Kingdom (uni)
- UAE (uae)
- South Africa (sou)
- Cayman Islands (cay)
- Switzerland (swi)

## Technical Implementation

### Files Created

1. **API/src/models/TravelNotification.ts** - Database model
2. **API/src/discord/commands/notifyTravel.ts** - Main command
3. **API/src/discord/commands/listTravelNotifications.ts** - List command
4. **API/src/discord/commands/disableTravelNotification.ts** - Disable command
5. **API/src/services/travelNotificationService.ts** - Background service
6. **API/src/utils/discord.ts** - Added `sendDirectMessage` function

### Files Modified

1. **API/src/index.ts** - Added service startup
2. **API/src/utils/discord.ts** - Added DM support

## Example Workflow

### Scenario 1: First Time Setup

```
User: /notifytravel Mexico 10 true 1429 258 259
Bot: ✅ Created travel notification for Mexico

     🏝️ Private Island: Yes (-30% travel time)
     ⏱️ Travel Time: 13 minutes
     📦 Items to Buy: 19
     👁️ Watch Items: 1429, 258, 259
     🔔 Notify: 10s before departure

     Next scheduled landing:
     📍 Arrival: 13:15
     🛫 Board at: 13:02

     The bot will monitor your travel and provide URLs when you land.
```

### Scenario 2: Update Watch Items Only

```
User: /notifytravel Mexico 1 2 3
Bot: ✅ Updated travel notification for Mexico

     🏝️ Private Island: Yes (-30% travel time)
     ⏱️ Travel Time: 13 minutes
     📦 Items to Buy: 19
     👁️ Watch Items: 1, 2, 3
     🔔 Notify: 10s before departure
     ...
```

### Scenario 3: Getting Notifications

At 13:01:50 (10 seconds before):
```
Bot DM: 🛫 Travel Alert - 10s Warning

        Prepare to board for Mexico!
        Board in 10 seconds to land at 13:15

        Travel Time: 13 minutes
        Landing Slot: 13:15
```

At 13:02:00 (on the dot):
```
Bot DM: 🛫 Travel Alert - BOARD NOW!

        Board now for Mexico!
        You will land at 13:15 (next 15-min restock slot)

        Travel Time: 13 minutes
        Landing Slot: 13:15

        https://www.torn.com/page.php?sid=travel&destination=mex
```

At 13:15:00 (arrival):
```
Bot DM: ✈️ Welcome to Mexico!

        You've arrived! Here's your shop URL:

        https://www.torn.com/page.php?sid=travel&item1=1429&item2=258&item3=259&amount=19&arrival=1759933865

        Watch Items: 1429, 258, 259
        Items to Buy: 19
```

## Configuration

The feature uses existing environment variables:
- `DISCORD_TOKEN` - Discord bot token
- `DISCORD_CLIENT_ID` - Discord application client ID
- `MONGO_URI` - MongoDB connection string

No additional configuration is required.

## Testing

Run the calculation test:
```bash
node /tmp/test-travel-calculation.js
```

This will verify the travel time calculations for various scenarios.

## Monitoring

The service logs all activities:
- Travel notifications sent
- Arrival URLs sent
- Errors and failures

Check the application logs for monitoring.
