# Channel Permission Management for Market Watch

## Overview

Market watch commands can now be restricted to specific channels to prevent users from adding watches in inappropriate channels (e.g., main chat, war channels).

## How It Works

By default, users can add market watches in **any** channel. Server administrators can control this by:

1. **Allowing specific channels** - Use `/allowchannel` to explicitly allow a channel
2. **Disallowing channels** - Use `/disallowchannel` to block a channel

Once you start managing channels, **only explicitly allowed channels** can be used for market watch commands.

## Administrator Commands

### `/allowchannel`

**Permission Required:** Manage Channels

Enables market watch commands in the current channel.

```
Usage: /allowchannel
```

**Example:**
```
Admin uses /allowchannel in #market-alerts
→ Users can now use /addwatch in #market-alerts
```

### `/disallowchannel`

**Permission Required:** Manage Channels

Disables market watch commands in the current channel.

```
Usage: /disallowchannel
```

**Example:**
```
Admin uses /disallowchannel in #general
→ Users can no longer use /addwatch in #general
```

## User Experience

When a user tries to use `/addwatch` in a disallowed channel:

```
❌ Market watch commands are not allowed in this channel.
Please ask an administrator to use `/allowchannel` to enable this channel.
```

## Implementation Details

### Database Model

A new `AllowedChannel` model tracks channel permissions:

```typescript
{
  guildId: string;        // Discord server ID
  channelId: string;      // Discord channel ID
  enabled: boolean;       // Whether channel is allowed
  configuredBy: string;   // User who configured it
  configuredAt: Date;     // When it was configured
}
```

### Permission Checks

The `/addwatch` command checks if the channel is allowed before creating a watch:

1. If no `AllowedChannel` record exists → **Block** (channel not explicitly allowed)
2. If `AllowedChannel` exists with `enabled: false` → **Block**
3. If `AllowedChannel` exists with `enabled: true` → **Allow**

### Backend Implementation

No changes needed on the backend/frontend for this feature. It's entirely managed through Discord commands.

## Recommended Setup

For a typical server, you might want to:

1. Create a dedicated `#market-alerts` channel
2. Run `/allowchannel` in that channel
3. Users add their watches there
4. All alerts go to that channel (where the watch was created)

## Important Notes

- Each user's watches are tied to the channel where they were created
- Alerts are sent to the channel where the watch was added
- This means users can have different watches in different channels
- Disabling a channel doesn't delete existing watches, it just prevents new ones

## Migration from Old System

If you were using the old global webhook system:

1. Run `/allowchannel` in your desired alert channel(s)
2. Users re-add their watches with `/addwatch`
3. Each user's watches will now alert in their chosen channel

## Example Workflow

**Scenario:** You want market watches only in #trading

1. Admin runs `/allowchannel` in #trading
2. User goes to #trading
3. User runs `/addwatch itemid:18 name:Xanax price:830000`
4. When Xanax drops below $830k, alert sent to #trading
5. User tries `/addwatch` in #general → ❌ Blocked

## Troubleshooting

**Problem:** Users can't add watches anywhere

**Solution:** Make sure at least one channel is allowed with `/allowchannel`

**Problem:** Want to allow all channels again

**Solution:** Currently need to `/allowchannel` in each desired channel. Future enhancement could add a "allow all" option.

**Problem:** User added watch in wrong channel

**Solution:** User can `/removewatch itemid:X` and re-add in correct channel
