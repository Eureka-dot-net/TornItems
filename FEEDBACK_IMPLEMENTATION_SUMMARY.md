# User Feedback Implementation Summary

This document summarizes all changes made in response to user feedback on the Discord bot integration PR.

## Changes Implemented

### 1. Flexible Item Lookup in `/addwatch` ✅

**Request:** Allow users to enter either name or ID, look up missing value from TornItem table.

**Implementation:**
- Modified `/addwatch` command to make both `itemid` and `name` optional (but at least one required)
- Added database lookup:
  - If only `itemid` provided → looks up `name` from TornItem table
  - If only `name` provided → looks up `itemid` from TornItem table (case-insensitive search)
  - If both provided → uses supplied values without DB lookup
- Added helpful error messages when item not found:
  ```
  ❌ Item ID 999 not found in the database.
  To find the correct item ID:
  1. Go to https://www.torn.com/page.php?sid=ItemMarket
  2. Search for the item
  3. The item ID will be in the URL (e.g., itemID=123)
  ```

**File Changed:** `API/src/discord/commands/addwatch.ts`

---

### 2. User-Specific Stock Recommendations ✅

**Request:** Update `calculateBestStockToSell` to use the watching user's API key for stock holdings instead of database.

**Implementation:**
- Modified `calculateBestStockToSell()` function signature to accept `userApiKey` parameter
- Changed from querying `UserStockHoldingSnapshot` database to making live Torn API call
- Uses same pattern as `fetchUserStockHoldings()` for consistency
- Each user now gets personalized stock recommendations based on their actual current holdings
- Updated `monitorMarketPrices` job to pass decrypted user API key when calling `calculateBestStockToSell()`

**Benefits:**
- Real-time stock data instead of potentially stale database data
- User-specific recommendations (what stocks THEY own)
- More accurate recommendations since it uses live data

**Files Changed:**
- `API/src/utils/stockSellHelper.ts` - Updated function to fetch from API
- `API/src/jobs/monitorMarketPrices.ts` - Pass user's API key to helper function

---

### 3. Watch Limit Per User ✅

**Request:** Limit users to watching 5 items (configurable).

**Implementation:**
- Added `MAX_WATCHES_PER_USER` environment variable (default: 5)
- `/addwatch` command now checks count before creating watch:
  ```typescript
  const watchCount = await MarketWatchlistItem.countDocuments({ discordUserId });
  if (watchCount >= MAX_WATCHES_PER_USER) {
    // Show error message
  }
  ```
- Success message shows current count:
  ```
  ✅ Added Xanax (ID: 18) to your watch list.
  📊 You have 3 of 5 watches.
  ```
- Configuration in `.env`:
  ```bash
  MAX_WATCHES_PER_USER=5  # Change to any number
  ```

**Files Changed:**
- `API/src/discord/commands/addwatch.ts` - Added limit check
- `API/.env.example` - Documented new variable
- `API/.env.test` - Added for testing

---

### 4. Channel Permissions System ✅

**Request:** Allow enabling/disabling bot per channel, requiring appropriate permissions.

**Implementation:**

#### New Database Model
Created `AllowedChannel` model to track which channels allow market watch commands:
```typescript
{
  guildId: string;        // Discord server ID
  channelId: string;      // Discord channel ID
  enabled: boolean;       // Whether allowed
  configuredBy: string;   // User who configured
  configuredAt: Date;     // When configured
}
```

#### New Admin Commands

**`/allowchannel`**
- Requires: `Manage Channels` permission
- Enables market watch commands in current channel
- Creates or re-enables AllowedChannel record

**`/disallowchannel`**
- Requires: `Manage Channels` permission  
- Disables market watch commands in current channel
- Updates AllowedChannel record to `enabled: false`

#### Protection in `/addwatch`
Before creating a watch, checks if channel is allowed:
```typescript
const allowedChannel = await AllowedChannel.findOne({ guildId, channelId });
if (!allowedChannel || !allowedChannel.enabled) {
  // Show error: channel not allowed
}
```

#### User Experience
```
# Admin allows #market-alerts
Admin: /allowchannel
Bot: ✅ This channel is now allowed for market watch commands.

# User tries in #general (not allowed)
User: /addwatch itemid:18 name:Xanax price:830000
Bot: ❌ Market watch commands are not allowed in this channel.
     Please ask an administrator to use `/allowchannel` to enable this channel.
```

**Files Created:**
- `API/src/models/AllowedChannel.ts` - Database model
- `API/src/discord/commands/allowchannel.ts` - Allow command
- `API/src/discord/commands/disallowchannel.ts` - Disallow command
- `CHANNEL_PERMISSIONS_GUIDE.md` - Comprehensive documentation

**Files Modified:**
- `API/src/discord/commands/addwatch.ts` - Added permission check

---

## Frontend Changes Required

**None.** All changes are backend/Discord-only. Channel management is done entirely through Discord commands by server administrators.

## Environment Variables Added

```bash
# Maximum number of items a user can watch (default: 5)
MAX_WATCHES_PER_USER=5
```

## Documentation Created

1. **CHANNEL_PERMISSIONS_GUIDE.md** - Complete guide for channel permission system
   - How it works
   - Admin commands
   - User experience
   - Setup recommendations
   - Troubleshooting

## Testing Recommendations

### Test Flexible Item Lookup
```
/addwatch itemid:18 price:830000
→ Should look up "Xanax" automatically

/addwatch name:Xanax price:830000
→ Should look up itemid:18 automatically

/addwatch itemid:18 name:Xanax price:830000
→ Should use both values without lookup

/addwatch itemid:99999 price:100000
→ Should show helpful error with instructions
```

### Test Watch Limits
```
/addwatch (create 5 watches)
/addwatch (6th attempt)
→ Should show: "❌ You have reached the maximum limit of 5 watched items"
```

### Test Channel Permissions
```
# As admin in #market-alerts
/allowchannel
→ ✅ Channel allowed

# As user in #market-alerts
/addwatch itemid:18 price:830000
→ ✅ Watch created

# As user in #general (not allowed)
/addwatch itemid:18 price:830000
→ ❌ Channel not allowed error
```

### Test User-Specific Stock Recommendations
```
# User adds watch
/addwatch itemid:18 price:830000

# When price drops, user should receive alert with:
- Stock recommendations based on THEIR portfolio
- Sell URLs with correct stock IDs they own
```

## Migration Notes

### Existing Deployments

1. **Update environment variables** in `.env`:
   ```bash
   MAX_WATCHES_PER_USER=5
   ```

2. **Run command registration** to add new commands:
   ```bash
   npm run register-commands
   ```

3. **Configure allowed channels** in Discord:
   ```
   /allowchannel  # Run in each desired channel
   ```

4. **Inform users** about:
   - Flexible item lookup (can use name or ID)
   - 5 watch limit
   - Allowed channels

### Database

No migrations needed. New `AllowedChannel` collection will be created automatically.

## Commits

- `33853ff` - Main implementation (flexible lookup, stock API calls, limits, permissions)
- `5ca170f` - Documentation (CHANNEL_PERMISSIONS_GUIDE.md)

## Summary

All 5 requested features have been successfully implemented:

1. ✅ Flexible item name/ID lookup with TornItem table
2. ✅ User-specific stock recommendations via API calls  
3. ✅ Configurable watch limit (5 default)
4. ✅ Channel permission system with admin commands
5. ✅ No frontend changes needed

The system is more flexible, secure, and user-friendly while preventing abuse (limits) and maintaining channel organization (permissions).
