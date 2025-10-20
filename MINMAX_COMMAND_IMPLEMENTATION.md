# /minmax Command Implementation

## Overview
The `/minmax` command allows Discord users to check their daily task completion status for Torn City activities.

## Features
- **Daily Task Tracking**: Monitors completion of three daily tasks:
  1. City Items Bought (target: 100 items)
  2. Xanax Taken (target: 3)
  3. Energy Refill (target: 1)
  
- **User-Specific or Other User Lookup**: Can check your own stats or another user's stats by providing their Torn user ID.

- **API Key Requirement**: Users must first set their API key using `/setkey` command.

## Implementation Details

### Files Modified/Created

#### Discord Bot Commands
1. **Discord/src/commands/minmax.ts** (NEW)
   - Discord bot command handler
   - Sends requests to API endpoint
   - Formats response with checkmarks/x marks for completion status

2. **Discord/src/register-commands.ts** (MODIFIED)
   - Added minmax command to registration list

#### API Server
3. **API/src/routes/discord.ts** (MODIFIED)
   - Added POST `/api/discord/minmax` endpoint
   - Implements dual API call pattern:
     - First call: Get current stats
     - Second call: Get stats at midnight UTC
     - Calculates daily progress by subtraction

4. **API/src/discord/commands/minmax.ts** (NEW)
   - Server-side command handler (for inline bot execution)
   - Mirrors functionality of Discord bot command

#### Tests
5. **API/tests/discord.test.ts** (MODIFIED)
   - Added comprehensive test suite for minmax endpoint
   - Tests include:
     - Authentication checks
     - API key requirement
     - Daily task calculation
     - Other user lookup
     - Error handling

## Usage

### Command Syntax
```
/minmax [userId]
```

**Parameters:**
- `userId` (optional): Torn user ID to check. If omitted, checks your own stats.

### Examples
```
/minmax              # Check your own daily tasks
/minmax 3926388      # Check user 3926388's daily tasks
```

### Response Format
```
**Daily Task Completion:**

✅ **City Items Bought:** 150/100
✅ **Xanax Taken:** 3/3
❌ **Energy Refill:** 0/1
```

## API Integration

### Torn API v2 Endpoints Used
1. **Current Stats:**
   ```
   GET https://api.torn.com/v2/user/{userId}/personalstats?stat=cityitemsbought,xantaken,refills&key={apiKey}
   ```

2. **Historical Stats (Midnight UTC):**
   ```
   GET https://api.torn.com/v2/user/{userId}/personalstats?stat=cityitemsbought,xantaken,refills&timestamp={midnightTimestamp}&key={apiKey}
   ```

### Calculation Logic
Daily progress is calculated by subtracting midnight values from current values:
- `itemsBoughtToday = currentItemsBought - midnightItemsBought`
- `xanTakenToday = currentXanTaken - midnightXanTaken`
- `refillsToday = currentRefills - midnightRefills`

## Error Handling

### User-Facing Errors
1. **No API Key:** "You need to set your API key first. Use `/setkey` to store your Torn API key."
2. **Invalid API Key:** "Failed to fetch personal stats from Torn API. Please check your API key and user ID."
3. **API Failure:** "Failed to fetch daily task status. Please try again later."

### Internal Error Logging
All errors are logged with context including:
- Discord ID
- Target user ID
- Timestamp information
- API response status codes

## Testing Status

✅ TypeScript compilation passes
✅ ESLint passes for new files
✅ Test cases written (6 new test cases)
⚠️ Integration tests require MongoDB (not run in sandboxed environment)

## Security Considerations

1. **API Key Encryption:** User API keys are stored encrypted in the database
2. **Authentication Required:** All endpoints require Discord bot authentication token
3. **User Authorization:** Users can only use their own API keys to fetch stats

## Future Enhancements

Potential improvements for future iterations:
- Add more daily tasks (e.g., crimes committed, attacks made)
- Weekly/monthly progress tracking
- Notification system for incomplete daily tasks
- Leaderboard for task completion
