# Quick Start - Combined Discord Bot & API

This guide helps you quickly set up and run the combined Discord bot and API service.

## Prerequisites

- Node.js 18+ installed
- MongoDB (local, Docker, or MongoDB Atlas)
- Discord bot created in Discord Developer Portal
- Torn API key

## Setup Steps

### 1. Install Dependencies

```bash
cd API
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and configure the following **required** values:

```bash
# Database
MONGO_URI=mongodb://localhost:27017/wasteland_rpg

# Torn API
TORN_API_KEY=your_torn_api_key_here

# Encryption (generate with: openssl rand -base64 32)
ENCRYPTION_SECRET=your_strong_random_secret_here

# Discord Bot
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_GUILD_ID=your_guild_id  # Optional but recommended for testing
```

### 3. Register Discord Commands

```bash
npm run register-commands
```

You should see output like:
```
✅ Loaded command: setkey
✅ Loaded command: addwatch
✅ Loaded command: removewatch
✅ Loaded command: enablewatch
✅ Loaded command: disablewatch
✅ Loaded command: listwatch
📡 Registering 6 slash commands...
✅ Registered guild commands for 123456789
```

### 4. Start the Service

```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm run build
npm start
```

You should see:
```
✅ MongoDB connected to external database
✅ Server started successfully
Starting Discord bot...
Discord bot logged in as YourBot#1234
✅ Discord bot started successfully
```

## Using the Discord Bot

### 1. Register Your API Key

In Discord, run:
```
/setkey key:YOUR_TORN_API_KEY
```

The bot will respond with:
```
✅ Your Torn API key was saved successfully.
Linked to YourName (ID: 1234567)
```

### 2. Add Items to Watch

```
/addwatch itemid:18 name:Xanax price:830000
```

This will alert you when Xanax drops below $830,000.

### 3. Manage Your Watchlist

```
/listwatch                    # View all your watches
/disablewatch itemid:18       # Temporarily disable
/enablewatch itemid:18        # Re-enable
/removewatch itemid:18        # Permanently remove
```

## Market Watch Alerts

When an item you're watching drops below your alert price, you'll receive a message in the channel where you added the watch:

```
🚨 Cheap item found!
💊 5x Xanax at $819,000 each (below $830,000)
@YourName
https://www.torn.com/page.php?sid=ItemMarket#/market/view=search&itemID=18

💰 Click here to sell stocks to buy:
1x (score: 8.45) - $819,000 - https://www.torn.com/page.php?sid=stocks...
2x (score: 7.23) - $1,638,000 - https://www.torn.com/page.php?sid=stocks...
```

## Troubleshooting

### Commands Not Appearing

1. Make sure you ran `npm run register-commands`
2. If using global commands (no DISCORD_GUILD_ID), wait up to 1 hour
3. For instant updates, set DISCORD_GUILD_ID in .env and re-register

### Bot Not Starting

1. Check DISCORD_TOKEN is correct
2. Ensure bot has proper permissions in your server
3. Check the console for error messages

### Database Connection Failed

1. Make sure MongoDB is running
2. Check MONGO_URI is correct in .env
3. For MongoDB Atlas, ensure your IP is whitelisted

### Market Watch Not Working

1. Make sure you registered your API key with `/setkey`
2. Check that watches are enabled with `/listwatch`
3. Look for error messages in the server console

## Getting Help

- Check `DISCORD_INTEGRATION_MIGRATION.md` for detailed migration info
- Check `DISCORD_INTEGRATION_SUMMARY.md` for implementation details
- Create an issue on GitHub for bugs or questions

## Advanced Configuration

### Optional Environment Variables

```bash
# Rate Limiting
TORN_RATE_LIMIT=60                    # API requests per minute

# Background Jobs
ENABLE_BACKGROUND_JOBS=true           # Enable/disable all background jobs
CURIOSITY_RATE=0.05                   # Percentage for random item checks

# Market History
HISTORY_AGGREGATION_CRON=0 * * * *    # Hourly aggregation schedule

# Legacy Discord (still supported)
DISCORD_WEBHOOK_URL=webhook_url       # Global webhook for alerts
MY_DISCORD_USER_ID=user_id            # User to mention in webhook alerts
```

### Command Registration Options

**Guild Commands (Instant, for Testing):**
```bash
# Set in .env
DISCORD_GUILD_ID=your_guild_id

# Register
npm run register-commands
```

**Global Commands (1 hour delay, for Production):**
```bash
# Remove or comment out DISCORD_GUILD_ID in .env
# DISCORD_GUILD_ID=

# Register
npm run register-commands
```

## What's Running

When you start the service, the following components are active:

1. **API Server** (Port 3000 by default)
   - REST endpoints for data access
   - CORS enabled for client apps

2. **Discord Bot**
   - Listening for slash commands
   - Managing user watchlists

3. **Background Jobs**
   - Market price monitoring (every 30 seconds)
   - Stock price fetching (every minute)
   - City shop stock updates (every minute)
   - Foreign stock updates (every minute)
   - Item catalog refresh (daily)

4. **Database Connection**
   - MongoDB for persistent storage
   - Collections for items, stocks, users, and watches

## Next Steps

- Add more items to your watchlist
- Explore the API endpoints at `http://localhost:3000/api/`
- Check the client app at `http://localhost:5173/` (if running)
- Monitor logs for market activity

Enjoy your automated market monitoring! 🎉
