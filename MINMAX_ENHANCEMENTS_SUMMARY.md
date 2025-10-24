# MinMax Command Enhancements - Implementation Summary

## Overview
This document summarizes the enhancements made to the minmax command system to support additional daily task tracking as requested.

## New Features

### 1. Full vs Limited API Key Detection
- **Implementation**: When users set their API key using `/minmaxsetkey`, the system now tests access to the log API endpoint to determine if the key is full or limited.
- **Storage**: API key type is stored in the `DiscordUser` model as `apiKeyType` field (`'full'` or `'limited'`)
- **User Feedback**: Users are informed of their key type after setting it
- **Impact**: Casino tickets and wheel spins only fetch data for users with full API keys

### 2. Faction OC (Organized Crime) Tracking
- **API Endpoint**: `https://api.torn.com/v2/user/organizedcrime?key={key}`
- **Display**: Shows "Yes/No" in the minmax command under "Active Activities"
- **Detection Logic**: Checks if user's Torn ID appears in any slot of the current OC
- **Caching**: Cached for 1 hour when active (similar to education/investment/virus)
- **Notifications**: Optional alert in minmaxsub (can be enabled/disabled with `notifyoc` parameter)

### 3. Casino Tickets (75/day)
- **API Endpoint**: `https://api.torn.com/v2/user/log?log=&cat=185&limit=75&from={utc00:00}&key={key}`
- **Display**: Shows "X/75" in the minmax command under "Casino Activities"
- **Detection Logic**: Counts entries with `details.title === 'Casino lottery bet'` from today (UTC)
- **Caching**: Cached for the entire day once 75/75 is reached
- **Reset Time**: Resets at 00:00 UTC daily
- **Notifications**: Non-optional alert (always checked if user has full API key)
- **Requirements**: Full API key required

### 4. Wheel Spins (3 wheels)
- **API Endpoint**: `https://api.torn.com/v2/user/log?log=&cat=192&limit=75&from={utc00:00}&key={key}`
- **Wheels Tracked**:
  - Wheel of Lame
  - Wheel of Mediocre
  - Wheel of Awesomeness
- **Display**: Shows "Yes/No" for each wheel in the minmax command under "Casino Activities"
- **Detection Logic**: Checks for wheel spin entries in the casino log where `data.wheel` contains the wheel name
- **Caching**: Cached for the entire day once spun
- **Reset Time**: Resets at 00:00 UTC daily
- **Notifications**: Each wheel can be individually enabled/disabled in minmaxsub:
  - `notifywheellame`
  - `notifywheelmediocre`
  - `notifywheelawesomeness`
- **Requirements**: Full API key required

## Technical Details

### Models Updated

#### DiscordUser
```typescript
apiKeyType?: 'full' | 'limited'; // New field
```

#### UserActivityCache
```typescript
factionOC: {
  active: boolean;
  lastFetched: Date | null;
} | null;

casinoTickets: {
  used: number;
  lastFetched: Date | null;
  completedToday: boolean;
} | null;

wheels: {
  lame: { spun: boolean; lastFetched: Date | null };
  mediocre: { spun: boolean; lastFetched: Date | null };
  awesomeness: { spun: boolean; lastFetched: Date | null };
} | null;
```

#### MinMaxSubscription
```typescript
notifyOC: boolean; // Default: true
notifyWheelLame: boolean; // Default: true
notifyWheelMediocre: boolean; // Default: true
notifyWheelAwesomeness: boolean; // Default: true
```

### Caching Strategy

1. **Faction OC**: Similar to education/investment/virus - cached for 1 hour when active, always refreshed when inactive
2. **Casino Tickets**: Smart daily caching:
   - If completedToday is true and still same UTC day, use cached value
   - Otherwise, fetch fresh data
3. **Wheel Spins**: Smart daily caching:
   - If wheel was spun and still same UTC day, use cached value
   - Otherwise, fetch fresh data

### API Call Protection

All new features that require the log API (casino tickets and wheels) check the user's `apiKeyType` before making API calls:
```typescript
const hasFullKey = user.apiKeyType === 'full';
const fetchCasinoTickets = hasFullKey && (!cachedData || needsRefreshDaily(...));
const fetchWheels = hasFullKey && (!cachedData || needsRefreshWheel(...));
```

## Command Updates

### /minmaxsetkey
- Now detects and displays API key type (full/limited)
- Informs users about feature availability based on key type

### /minmax
- Displays new sections:
  - Faction OC under "Active Activities"
  - Casino Tickets under "Casino Activities" 
  - Wheel spins under "Casino Activities"

### /minmaxsub
- Added parameters:
  - `notifyoc`: Whether to notify about missing faction OC (default: false, must explicitly enable)
  - `notifywheellame`: Whether to notify about Wheel of Lame not spun (default: false)
  - `notifywheelmediocre`: Whether to notify about Wheel of Mediocre not spun (default: false)
  - `notifywheelawesomeness`: Whether to notify about Wheel of Awesomeness not spun (default: false)
- Casino tickets notification is non-optional (always included if user has full key)

## Testing

Comprehensive unit tests have been created in `tests/minmaxHelper.test.ts` covering:
- Faction OC detection (active/inactive states)
- Casino ticket counting (partial and complete at 75)
- Wheel spin detection for all three wheels
- Limited vs full API key behavior
- Caching behavior

## Deployment Notes

1. Existing users will need to re-run `/minmaxsetkey` to have their API key type detected
2. Until they do, their `apiKeyType` will be undefined, and the system will default to `'limited'` behavior
3. All new fields in models have appropriate defaults, so no database migration is strictly necessary
4. The notification service will automatically start checking new items for subscribed users

## Future Enhancements

Potential improvements for future consideration:
- Add dashboard/web interface to view all minmax stats at once
- Add historical tracking of completion rates
- Add reminders at specific times for wheels/casino tickets
- Add notifications when faction OC becomes available
