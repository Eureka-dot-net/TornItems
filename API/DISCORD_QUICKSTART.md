# Discord Bot Implementation - Quick Start

## What Was Implemented

A new Discord bot API endpoint has been added to allow Discord users to link their Torn accounts.

### Endpoint
```
POST /api/discord/setkey
```

### Request
```json
{
  "discordId": "123456789",
  "apiKey": "your_torn_api_key"
}
```

### Response
```json
{
  "success": true,
  "message": "API key set successfully",
  "data": {
    "discordId": "123456789",
    "tornId": 3926388,
    "name": "Muppett",
    "level": 15
  }
}
```

## What Gets Stored

### DiscordUser Collection
- Discord ID (unique)
- Torn ID (from API)
- Name (from API)
- Level (from API)
- **API Key (encrypted with AES-256-GCM)**

### BattleStats Collection
- Torn ID
- Strength, Defense, Speed, Dexterity
- Total battle stats
- Timestamp

## Security

API keys are **encrypted** before storage using AES-256-GCM encryption. You must set an encryption secret in your environment:

```bash
# .env
ENCRYPTION_SECRET=your_strong_random_secret_here
```

Generate a secure key:
```bash
openssl rand -base64 32
```

## Files Added

### Models
- `API/src/models/DiscordUser.ts` - Discord user data model
- `API/src/models/BattleStats.ts` - Battle stats tracking model

### Routes
- `API/src/routes/discord.ts` - Discord API endpoint

### Utilities
- `API/src/utils/encryption.ts` - AES-256-GCM encryption/decryption
- `API/src/utils/tornApi.ts` - Helper to fetch battle stats

### Tests
- `API/tests/discord.test.ts` - Comprehensive test suite (5 tests, all passing)

### Documentation
- `API/DISCORD_BOT_API.md` - Full API documentation
- `API/test-discord-endpoint.js` - Manual test script

## Modified Files
- `API/src/app.ts` - Added discord route
- `API/.env.example` - Added ENCRYPTION_SECRET

## Testing

Run the test suite:
```bash
npm test -- tests/discord.test.ts
```

## Usage Example

```bash
curl -X POST http://localhost:3000/api/discord/setkey \
  -H "Content-Type: application/json" \
  -d '{
    "discordId": "123456789",
    "apiKey": "your_torn_api_key"
  }'
```

## Future Enhancements

The helper function `fetchAndStoreBattleStats` can be called periodically (e.g., daily) to track user progression:

```typescript
import { DiscordUser } from './models/DiscordUser';
import { decrypt } from './utils/encryption';
import { fetchAndStoreBattleStats } from './utils/tornApi';

// Fetch stats for all users (run daily)
const users = await DiscordUser.find();
for (const user of users) {
  const apiKey = decrypt(user.apiKey);
  await fetchAndStoreBattleStats(user.tornId, apiKey);
}
```

## Notes

- The endpoint validates the API key by calling Torn API v2 before storing
- Battle stats are fetched immediately when a user registers/updates their key
- If battle stats fetch fails, the user is still saved (graceful degradation)
- API keys are never logged or exposed in responses
- All sensitive data is sanitized in logs using the existing logger utility
