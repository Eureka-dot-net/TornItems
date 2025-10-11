# DiscordUserManager Service

## Overview
The `DiscordUserManager` is a centralized service for managing Discord user data fetched from the Torn API. It provides type-safe methods for retrieving user information and ensures consistent error handling across the application.

## Location
`API/src/services/DiscordUserManager.ts`

## Purpose
- **Single Source of Truth**: All user data fetching goes through this manager
- **Reusability**: Methods can be used across commands, routes, and services
- **Type Safety**: Exported interfaces for all Torn API responses
- **Consistent Error Handling**: Centralized logging and error management

## Available Methods

### 1. `getUserApiKey(discordId: string): Promise<string | null>`
Retrieves and decrypts a user's Torn API key from the database.

**Returns**: Decrypted API key or `null` if user not found

**Example:**
```typescript
const apiKey = await DiscordUserManager.getUserApiKey(discordId);
if (!apiKey) {
  // User hasn't set their API key
}
```

### 2. `getUserBars(discordId: string): Promise<UserBars | null>`
Fetches user's current bars (energy, happy, nerve, life) from Torn API.

**Returns**: Object with current and maximum values for each bar

**Example:**
```typescript
const bars = await DiscordUserManager.getUserBars(discordId);
console.log(`Energy: ${bars.energy.current}/${bars.energy.maximum}`);
console.log(`Happy: ${bars.happy.current}/${bars.happy.maximum}`);
```

### 3. `getUserBattleStats(discordId: string): Promise<UserBattleStats | null>`
Fetches user's current battle stats from Torn API.

**Returns**: Object with strength, defense, speed, dexterity, and total

**Example:**
```typescript
const stats = await DiscordUserManager.getUserBattleStats(discordId);
console.log(`Total: ${stats.total}`);
console.log(`Strength: ${stats.strength}`);
```

### 4. `fetchAndStoreBattleStats(discordId: string): Promise<void>`
Fetches battle stats from Torn API and stores them in the database.

**Use Case**: Called after user sets their API key or for periodic updates

**Example:**
```typescript
await DiscordUserManager.fetchAndStoreBattleStats(discordId);
// Stats are now saved in BattleStats collection
```

### 5. `getUserPerks(discordId: string): Promise<TornPerksResponse | null>`
Fetches all user perks from Torn API.

**Returns**: Object with 8 perk categories (faction, property, merit, etc.)

**Example:**
```typescript
const perks = await DiscordUserManager.getUserPerks(discordId);
console.log('Property perks:', perks.property_perks);
console.log('Merit perks:', perks.merit_perks);
```

### 6. `getUserGymInfo(discordId: string): Promise<UserGymInfo | null>`
Fetches user's active gym ID and full gym details from Torn API.

**Returns**: Object with `activeGymId` and `gymDetails`

**Example:**
```typescript
const gymInfo = await DiscordUserManager.getUserGymInfo(discordId);
console.log(`Active gym: ${gymInfo.gymDetails.name}`);
console.log(`Energy per train: ${gymInfo.gymDetails.energy}`);
```

### 7. `getUserStatGainData(discordId: string): Promise<{...} | null>`
Fetches all data needed for stat gain calculations in a single call.

**Returns**: Object containing bars, battleStats, perks, and gymInfo

**Use Case**: Primary method for `/mystatgain` command

**Example:**
```typescript
const data = await DiscordUserManager.getUserStatGainData(discordId);
if (!data) {
  return 'User not found or API key invalid';
}

const { bars, battleStats, perks, gymInfo } = data;
// All data available for calculations
```

## Exported Types

### Torn API Response Types
- `TornBarsResponse` - Full bars API response
- `TornBattleStatsResponse` - Full battle stats API response
- `TornPerksResponse` - Perks API response (8 perk categories)
- `TornGymResponse` - Active gym ID response
- `TornGymsResponse` - All gyms data response
- `TornGymData` - Individual gym details

### Simplified User Data Types
- `UserBars` - Simplified bars (current/maximum only)
- `UserBattleStats` - Simplified battle stats (values only)
- `UserGymInfo` - Active gym ID + details

## Usage Examples

### Example 1: Get User's Current Energy
```typescript
import { DiscordUserManager } from '../services/DiscordUserManager';

async function checkUserEnergy(discordId: string) {
  const bars = await DiscordUserManager.getUserBars(discordId);
  if (!bars) {
    return 'User not found';
  }
  
  return `You have ${bars.energy.current} energy`;
}
```

### Example 2: Calculate Stat Gains
```typescript
import { DiscordUserManager } from '../services/DiscordUserManager';

async function calculateGains(discordId: string, stat: string) {
  const data = await DiscordUserManager.getUserStatGainData(discordId);
  if (!data) {
    return null;
  }
  
  const { bars, battleStats, perks, gymInfo } = data;
  
  // Use data for calculations
  const statValue = battleStats[stat];
  const happy = bars.happy.current;
  const gymDots = gymInfo.gymDetails[stat] / 10;
  
  // ... perform calculations
}
```

### Example 3: Update User Stats
```typescript
import { DiscordUserManager } from '../services/DiscordUserManager';

async function updateUserStats(discordId: string) {
  try {
    await DiscordUserManager.fetchAndStoreBattleStats(discordId);
    console.log('Stats updated successfully');
  } catch (error) {
    console.error('Failed to update stats:', error);
  }
}
```

## Error Handling

All methods:
- Return `null` if user not found or API key missing
- Throw errors for API failures or invalid responses
- Log errors using the centralized logger
- Include context (discordId) in error logs

**Example:**
```typescript
try {
  const bars = await DiscordUserManager.getUserBars(discordId);
  if (!bars) {
    // User doesn't exist or hasn't set API key
    return 'Please set your API key first';
  }
  // Process bars...
} catch (error) {
  // API error or network issue
  return 'Failed to fetch data from Torn API';
}
```

## Files Using DiscordUserManager

1. **`API/src/discord/commands/mystatgain.ts`**
   - Uses `getUserStatGainData()` to fetch all required data
   - Replaced direct API calls with manager method

2. **`API/src/discord/commands/setkey.ts`**
   - Uses `fetchAndStoreBattleStats()` after user sets API key
   - Replaced `fetchAndStoreBattleStats` from tornApi

3. **`API/src/routes/discord.ts`**
   - Uses `fetchAndStoreBattleStats()` in setkey endpoint
   - Replaced `fetchAndStoreBattleStats` from tornApi

## Migration Guide

### Before (Old Way)
```typescript
import { fetchAndStoreBattleStats } from '../utils/tornApi';

await fetchAndStoreBattleStats(tornId, apiKey);
```

### After (New Way)
```typescript
import { DiscordUserManager } from '../services/DiscordUserManager';

await DiscordUserManager.fetchAndStoreBattleStats(discordId);
```

**Key Differences:**
- Old: Required `tornId` and `apiKey` as parameters
- New: Only requires `discordId`, manager handles the rest
- Old: Direct API calls in command files
- New: Centralized in manager service

## Benefits

1. **Maintainability**: Single place to update Torn API calls
2. **Testing**: Easier to mock manager methods than scattered API calls
3. **Type Safety**: Shared interfaces prevent type mismatches
4. **Error Handling**: Consistent logging and error messages
5. **Reusability**: Any command can use these methods
6. **Future Proofing**: Easy to add caching or rate limiting later

## Future Enhancements

Potential additions:
- Caching layer to reduce API calls
- Rate limiting for Torn API requests
- Batch data fetching for multiple users
- Data validation and sanitization
- Automatic retry logic for failed requests
