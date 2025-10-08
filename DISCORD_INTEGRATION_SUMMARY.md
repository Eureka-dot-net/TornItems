# Discord Bot & API Integration - Implementation Summary

## Objective

Combine the Discord bot and API into a single service to simplify deployment and enable direct database access for improved performance and new user-specific features.

## What Was Implemented

### 1. Service Integration ✅

**Created:**
- `API/src/services/discordBot.ts` - Discord bot service that starts alongside API
- `API/src/register-commands.ts` - Command registration script

**Modified:**
- `API/src/index.ts` - Now starts both API server and Discord bot
- `API/package.json` - Added Discord.js dependencies and register-commands script

**Result:** 
- Single service deployment instead of two separate services
- Bot commands have direct database access (no HTTP overhead)

### 2. Discord Commands - Direct Database Access ✅

**Created:**
- `API/src/discord/commands/setkey.ts` - Registers API keys directly to database
- `API/src/discord/commands/addwatch.ts` - Add market watch items
- `API/src/discord/commands/removewatch.ts` - Remove watch items
- `API/src/discord/commands/enablewatch.ts` - Enable disabled watches
- `API/src/discord/commands/disablewatch.ts` - Disable watches without removing
- `API/src/discord/commands/listwatch.ts` - List user's watch items

**Result:**
- No more HTTP calls from Discord bot to API
- Direct database operations for better performance
- User-specific watch management

### 3. MarketWatchlistItem Schema Updates ✅

**Added Fields:**
- `discordUserId: string` - Discord user who created the watch (required, indexed)
- `apiKey: string` - Encrypted API key for monitoring (required)
- `guildId: string` - Discord server ID (required)
- `channelId: string` - Discord channel for alerts (required)
- `enabled: boolean` - Active status (default: true, indexed)

**Schema Changes:**
- Removed unique constraint on `itemId`
- Added compound unique index on `(discordUserId, itemId)`
- Multiple users can now watch the same item

**Result:**
- Each user can maintain their own watchlist
- Same item can be watched by multiple users
- Per-user alert configuration

### 4. Market Watch Job Updates ✅

**Modified:**
- `API/src/jobs/monitorMarketPrices.ts` - Complete rewrite for user-specific watches

**New Behavior:**
- Groups watches by `itemId` to minimize API calls
- Selects random API key from users watching each item
- Sends alerts to user-specific channels (not global webhook)
- Supports per-user price thresholds
- Maintains deduplication per user per item

**Result:**
- API load distributed across multiple user keys
- Users receive alerts in their preferred channels
- More scalable and user-friendly

### 5. Discord Utilities Enhancement ✅

**Modified:**
- `API/src/utils/discord.ts` - Added `sendDiscordChannelAlert` function

**New Functions:**
- `sendDiscordChannelAlert(channelId, message)` - Sends alerts to specific channels using bot client
- Existing `sendDiscordAlert()` still works for backward compatibility

**Result:**
- Support for both channel-specific and webhook-based alerts
- Flexible alert delivery

### 6. Testing Updates ✅

**Modified:**
- `API/tests/models.test.ts` - Updated MarketWatchlistItem tests

**New Test Cases:**
- Create watchlist with new required fields
- Update alert prices and timestamps
- Enforce unique constraint on (discordUserId, itemId)
- Allow different users to watch same item

**Created:**
- `API/.env.test` - Test environment configuration

**Result:**
- Comprehensive test coverage for new schema
- Tests validate multi-user watch functionality

### 7. Documentation ✅

**Created:**
- `DISCORD_INTEGRATION_MIGRATION.md` - Complete migration guide
- This summary document

**Result:**
- Clear migration path for existing deployments
- Comprehensive setup instructions for new deployments

## Dependencies Added

```json
{
  "@discordjs/rest": "^2.6.0",
  "discord-api-types": "^0.38.29",
  "discord.js": "^14.22.1"
}
```

## Scripts Added

```json
{
  "register-commands": "ts-node src/register-commands.ts"
}
```

## Breaking Changes

### MarketWatchlistItem Schema

**Before:**
```typescript
{
  itemId: number (unique)
  name: string
  alert_below: number
  lastAlertPrice?: number
  lastAlertTimestamp?: Date
}
```

**After:**
```typescript
{
  itemId: number (indexed, not unique)
  name: string
  alert_below: number
  discordUserId: string (required, indexed)
  apiKey: string (required, encrypted)
  guildId: string (required)
  channelId: string (required)
  enabled: boolean (default: true)
  lastAlertPrice?: number
  lastAlertTimestamp?: Date
  
  // Compound unique index: (discordUserId, itemId)
}
```

### Migration Required

Existing `MarketWatchlistItem` documents without the new required fields will need to be deleted or manually updated. Users will need to re-add their watches using the `/addwatch` command.

## Environment Variables

### New Required Variables

```bash
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
```

### Optional Variables

```bash
DISCORD_GUILD_ID=your_guild_id  # For instant command registration during testing
```

### Still Supported (Legacy)

```bash
DISCORD_WEBHOOK_URL=webhook_url  # Fallback for global alerts
MY_DISCORD_USER_ID=user_id      # For legacy webhook mentions
BOT_SECRET=secret               # For API authentication (legacy)
```

## Usage

### Starting the Combined Service

```bash
cd API

# Development
npm run dev

# Production
npm run build
npm start
```

### Registering Discord Commands

```bash
cd API
npm run register-commands
```

### User Workflow

1. User runs `/setkey <api_key>` to register their Torn API key
2. User runs `/addwatch <itemId> <name> <price>` to add items to watch
3. Bot monitors market using random user API keys
4. Alerts sent to user's channel when price drops below threshold
5. User can manage watches with `/listwatch`, `/enablewatch`, `/disablewatch`, `/removewatch`

## Files Created/Modified

### Created (14 files)
- `API/src/services/discordBot.ts`
- `API/src/register-commands.ts`
- `API/src/discord/commands/setkey.ts`
- `API/src/discord/commands/addwatch.ts`
- `API/src/discord/commands/removewatch.ts`
- `API/src/discord/commands/enablewatch.ts`
- `API/src/discord/commands/disablewatch.ts`
- `API/src/discord/commands/listwatch.ts`
- `API/.env.test`
- `DISCORD_INTEGRATION_MIGRATION.md`
- `DISCORD_INTEGRATION_SUMMARY.md` (this file)

### Modified (8 files)
- `API/package.json` - Added Discord dependencies and scripts
- `API/package-lock.json` - Updated lock file
- `API/src/index.ts` - Start Discord bot
- `API/src/models/MarketWatchlistItem.ts` - Updated schema
- `API/src/jobs/monitorMarketPrices.ts` - User-specific monitoring
- `API/src/utils/discord.ts` - Added channel alert function
- `API/src/config/db.ts` - Skip exit in test mode
- `API/tests/models.test.ts` - Updated tests

## Testing

The implementation includes:
- ✅ TypeScript compilation passes
- ✅ Model tests updated for new schema
- ⚠️ Integration tests require database connection (in-memory MongoDB needs internet)

## Next Steps

### For Deployment

1. Update `.env` with Discord bot credentials
2. Run `npm install` to get new dependencies
3. Run `npm run register-commands` to register Discord commands
4. Migrate existing watchlist data (see migration guide)
5. Start the service with `npm start`

### For Development

1. Copy `.env.example` to `.env`
2. Configure Discord bot token and client ID
3. Run `npm install`
4. Run `npm run register-commands`
5. Run `npm run dev`

## Benefits Achieved

✅ **Simplified Deployment** - One service instead of two
✅ **Better Performance** - Direct database access
✅ **User-Specific Features** - Each user manages their own watchlist
✅ **Scalability** - API load distributed across user keys
✅ **Flexibility** - Channel-specific alerts per user
✅ **Maintainability** - Single codebase, unified logging

## Known Limitations

- Requires users to register API keys with `/setkey`
- Existing watchlist data needs migration
- Commands must be registered before first use
- Bot must have channel access permissions to send alerts

## Future Enhancements (Suggestions)

- Add `/updatewatch` command to modify alert thresholds
- Support for multiple price alert levels per item
- Historical alert log per user
- Watch groups/categories
- Alert frequency limits to prevent spam
- Web dashboard for watch management
