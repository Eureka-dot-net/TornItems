# /minmax Command - Quick Reference

## What is /minmax?
A Discord bot command that tracks your daily Torn City task completion.

## Prerequisites
⚠️ You must set your API key first using `/setkey [your-api-key]`

## Command Usage

### Check Your Own Tasks
```
/minmax
```

### Check Another User's Tasks
```
/minmax userid:3926388
```

## What Does It Track?

| Task | Daily Target | Description |
|------|--------------|-------------|
| City Items Bought | 100 | Items purchased from Torn City shops |
| Xanax Taken | 3 | Xanax consumables used |
| Energy Refill | 1 | Energy refill used |

## Example Output

```
**Daily Task Completion:**

✅ **City Items Bought:** 150/100
✅ **Xanax Taken:** 3/3
❌ **Energy Refill:** 0/1
```

- ✅ = Task completed
- ❌ = Task not yet completed

## Common Errors

### "You need to set your API key first"
**Solution:** Run `/setkey [your-api-key]` to store your Torn API key

### "Failed to fetch personal stats"
**Possible causes:**
- Invalid user ID provided
- API key expired or revoked
- Torn API is temporarily unavailable

**Solution:** 
1. Verify the user ID is correct
2. Update your API key with `/setkey`
3. Try again in a few minutes if Torn API is down

## Privacy & Security

- Responses are **ephemeral** (only visible to you)
- API keys are stored **encrypted** in the database
- Your API key is never shared or exposed
- You can only check public stats using your own API key

## How It Works

1. Fetches your current personal stats from Torn API
2. Fetches your stats from midnight UTC (start of day)
3. Calculates the difference to show daily progress
4. Displays results with completion indicators

## Tips

- Check your progress throughout the day to track tasks
- Use the command to verify you've completed daily requirements
- Can be used to check faction members' progress (if you have their user ID)

## Related Commands

- `/setkey` - Store your Torn API key
- Other bot commands available in the bot's help menu
