# Discord Bot and API Integration - Migration Guide

## Overview

The Discord bot has been integrated into the API service to simplify deployment and enable direct database access for better performance.

## Changes Made

### 1. Combined Services

The Discord bot now runs alongside the API server in a single process. Both services start when you run the API:

```bash
cd API
npm run dev   # Starts both API and Discord bot
```

### 2. Market Watch Enhancements

The `MarketWatchlistItem` model has been updated to support per-user watchlists:

**New Fields:**
- `discordUserId` - Discord user ID who created the watch
- `apiKey` - Encrypted API key for monitoring (from user's account)
- `guildId` - Discord server/guild ID
- `channelId` - Discord channel ID for alerts
- `enabled` - Whether the watch is active

**Breaking Changes:**
- Removed unique constraint on `itemId` (multiple users can watch the same item)
- Added compound unique index on `(discordUserId, itemId)` (each user can only watch an item once)

### 3. New Discord Commands

The following commands are now available:

- `/setkey <key>` - Register your Torn API key (now makes direct DB calls)
- `/addwatch <itemid> <name> <price>` - Add an item to your watch list
- `/removewatch <itemid>` - Remove an item from your watch list
- `/enablewatch <itemid>` - Enable a disabled watch
- `/disablewatch <itemid>` - Temporarily disable a watch
- `/listwatch` - List all your watched items

### 4. Market Price Monitoring Updates

The market price monitoring job now:
- Uses a random API key from users watching each item
- Sends alerts to user-specific channels instead of a global webhook
- Supports per-user watch configurations

## Migration Steps

### For Existing Deployments

1. **Update Environment Variables**

Add Discord bot configuration to your `.env`:

```bash
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_GUILD_ID=your_discord_guild_id  # Optional, for faster command registration
```

2. **Register Commands**

Run the command registration script to register the new Discord commands:

```bash
cd API
npm run register-commands
```

3. **Migrate Existing Watch Items**

If you have existing `MarketWatchlistItem` documents without the new required fields, you'll need to migrate them. Here's a migration script:

```javascript
// migrate-watchlist.js
const mongoose = require('mongoose');
require('dotenv').config();

async function migrate() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const MarketWatchlistItem = mongoose.model('MarketWatchlistItem');
  
  // Delete old watch items that don't have the new fields
  // (They were global watches, not user-specific)
  const result = await MarketWatchlistItem.deleteMany({
    discordUserId: { $exists: false }
  });
  
  console.log(`Deleted ${result.deletedCount} old watch items`);
  console.log('Users will need to re-add their watches using /addwatch');
  
  await mongoose.disconnect();
}

migrate();
```

4. **Start the Combined Service**

The API will now automatically start the Discord bot:

```bash
npm run dev   # Development
npm start     # Production
```

### For New Deployments

1. Copy `.env.example` to `.env` and configure all values
2. Run `npm install` to install dependencies (now includes Discord.js)
3. Run `npm run register-commands` to register Discord commands
4. Run `npm run dev` or `npm start` to start both services

## Configuration

### Required Environment Variables

```bash
# Database
MONGO_URI=mongodb://localhost:27017/wasteland_rpg

# API
TORN_API_KEY=your_torn_api_key
PORT=3000

# Encryption
ENCRYPTION_SECRET=strong_random_secret

# Discord Bot
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_GUILD_ID=your_guild_id  # Optional
BOT_SECRET=your_bot_secret  # For API authentication (legacy)
```

### Optional Environment Variables

The old global webhook configuration is still supported as a fallback:

```bash
DISCORD_WEBHOOK_URL=your_webhook_url
MY_DISCORD_USER_ID=your_user_id
```

## Architecture

### Before
```
┌─────────────┐         ┌─────────┐
│ Discord Bot │ ──HTTP──→ │   API   │
└─────────────┘         └─────────┘
                              │
                              ▼
                        ┌──────────┐
                        │ Database │
                        └──────────┘
```

### After
```
┌─────────────────────────────┐
│    Combined Service         │
│  ┌──────────┐ ┌──────────┐ │
│  │ API      │ │ Discord  │ │
│  │ Server   │ │ Bot      │ │
│  └──────────┘ └──────────┘ │
└─────────────────────────────┘
              │
              ▼
        ┌──────────┐
        │ Database │
        └──────────┘
```

## Benefits

1. **Simplified Deployment** - Only one service to deploy and manage
2. **Better Performance** - Direct database access eliminates HTTP overhead
3. **User-Specific Watches** - Each user can customize their own watchlist
4. **Random API Key Usage** - Distributes API load across multiple users
5. **Channel-Specific Alerts** - Alerts sent to user's preferred channel

## Troubleshooting

### Discord Bot Not Starting

If the Discord bot doesn't start, check:
- `DISCORD_TOKEN` is set correctly in `.env`
- Bot has proper permissions in your Discord server
- Commands are registered (`npm run register-commands`)

### Market Watch Not Working

Check:
- Users have registered their API keys with `/setkey`
- Watch items are enabled (use `/listwatch` to check)
- The monitoring job is running (check logs)

### Commands Not Appearing

Run the registration script:
```bash
npm run register-commands
```

For instant updates during testing, make sure `DISCORD_GUILD_ID` is set (commands register instantly in a specific guild, vs. globally which takes up to 1 hour).

## Support

For issues or questions, please create an issue in the GitHub repository.
