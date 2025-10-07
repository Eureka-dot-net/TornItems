# Discord Bot API Integration

This document describes the Discord bot API integration that allows Discord users to link their Torn accounts.

## Overview

The Discord bot endpoint allows Discord users to register their Torn API keys, which enables the bot to:
- Verify and store user information (Torn ID, name, level)
- Track battle statistics over time
- Provide personalized features based on user data

## Endpoint

### POST /api/discord/setkey

Registers or updates a Discord user's Torn API key.

#### Request Body

```json
{
  "discordId": "string",  // Required: Discord user ID
  "apiKey": "string"      // Required: Torn API key
}
```

#### Response

**Success (200 OK)**
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

**Error (400 Bad Request)**
```json
{
  "error": "Missing required fields: discordId and apiKey are required"
}
```

or

```json
{
  "error": "Invalid API key or failed to fetch user data from Torn API"
}
```

**Error (500 Internal Server Error)**
```json
{
  "error": "Failed to set API key"
}
```

## How It Works

1. **API Key Validation**: When a user submits their API key, the endpoint first validates it by calling the Torn API (`https://api.torn.com/v2/user?selections=basic&key=<apiKey>`)

2. **User Information Storage**: If the API key is valid, the following information is stored in the database:
   - Discord ID (unique identifier)
   - Torn ID (from API response)
   - User name (from API response)
   - Level (from API response)
   - API key (encrypted using AES-256-GCM)

3. **Battle Stats Recording**: The endpoint also fetches and stores the user's current battle statistics:
   - Strength
   - Defense
   - Speed
   - Dexterity
   - Total

4. **Future Stats Tracking**: Battle stats can be fetched periodically (e.g., once per day) to track user progression over time.

## Database Models

### DiscordUser

Stores Discord user information and their encrypted Torn API key.

```typescript
{
  discordId: string,      // Unique Discord user ID
  tornId: number,         // Unique Torn user ID
  name: string,           // Torn character name
  apiKey: string,         // Encrypted Torn API key
  level: number,          // Current character level
  createdAt: Date,        // When the record was created
  updatedAt: Date         // When the record was last updated
}
```

### BattleStats

Stores historical battle statistics for users.

```typescript
{
  tornId: number,         // Torn user ID
  strength: number,       // Strength stat value
  defense: number,        // Defense stat value
  speed: number,          // Speed stat value
  dexterity: number,      // Dexterity stat value
  total: number,          // Total battle stats
  recordedAt: Date        // When these stats were recorded
}
```

## Security

### API Key Encryption

API keys are encrypted before being stored in the database using AES-256-GCM encryption. The encryption process:

1. Uses a secret key from the `ENCRYPTION_SECRET` environment variable
2. Derives a 32-byte key using PBKDF2 with 100,000 iterations
3. Uses a random initialization vector (IV) for each encryption
4. Stores the encrypted data in the format: `iv:authTag:encryptedData`

To decrypt an API key (only done internally when making API calls on behalf of the user):

```typescript
import { decrypt } from '../utils/encryption';

const decryptedKey = decrypt(user.apiKey);
```

### Environment Configuration

Add to your `.env` file:

```
ENCRYPTION_SECRET=your_strong_random_secret_here
```

**Important**: Use a strong, random secret in production. Generate one using:
```bash
openssl rand -base64 32
```

## Helper Functions

### fetchAndStoreBattleStats

A helper function to fetch and store battle stats for a user. This can be called periodically (e.g., daily) to track progression.

```typescript
import { fetchAndStoreBattleStats } from '../utils/tornApi';
import { decrypt } from '../utils/encryption';

// Get user from database
const user = await DiscordUser.findOne({ discordId: '123456789' });

// Decrypt API key and fetch stats
const apiKey = decrypt(user.apiKey);
await fetchAndStoreBattleStats(user.tornId, apiKey);
```

## Future Enhancements

Potential additions for future development:

1. **Daily Battle Stats Job**: Schedule a background job to fetch battle stats for all registered users once per day
2. **Stats Progression Tracking**: Add endpoints to query and visualize battle stats progression over time
3. **Notifications**: Send Discord notifications when users reach certain milestones
4. **Multiple API Selections**: Expand to fetch and store other user data (e.g., faction info, crimes, gym training)

## Testing

Run the test suite:

```bash
npm test -- tests/discord.test.ts
```

The test suite covers:
- Creating a new Discord user with valid API key
- Updating existing Discord user when called again
- Error handling for invalid API keys
- Error handling for missing required fields
- Graceful handling of battle stats fetch failures

## Example Usage

### Using cURL

```bash
curl -X POST http://localhost:3000/api/discord/setkey \
  -H "Content-Type: application/json" \
  -d '{
    "discordId": "123456789",
    "apiKey": "your_torn_api_key_here"
  }'
```

### Using JavaScript/TypeScript

```typescript
const response = await fetch('http://localhost:3000/api/discord/setkey', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    discordId: '123456789',
    apiKey: 'your_torn_api_key_here'
  })
});

const data = await response.json();
console.log(data);
```

## Torn API Integration

The endpoint makes two calls to the Torn API v2:

1. **Basic Profile** (`/v2/user?selections=basic&key=<apiKey>`)
   - Validates the API key
   - Retrieves user ID, name, level, and status

2. **Battle Stats** (`/v2/user?selections=battlestats&key=<apiKey>`)
   - Retrieves current battle statistics
   - Stores for historical tracking

Both endpoints are documented at: https://www.torn.com/api.html
