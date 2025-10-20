# /minmax Command Testing Guide

## Automated Testing Status

### ✅ Completed Tests
- TypeScript compilation passes
- ESLint linting passes for all new files
- Unit tests written (6 test cases)

### ⚠️ Tests Requiring Manual Verification
The following tests require a live environment with MongoDB and Torn API access:

## Manual Testing Checklist

### Prerequisites Setup
- [ ] Discord bot is running and connected
- [ ] API server is running
- [ ] MongoDB is accessible
- [ ] Environment variables are set:
  - `DISCORD_TOKEN`
  - `DISCORD_CLIENT_ID`
  - `DISCORD_GUILD_ID`
  - `BOT_SECRET`
  - `API_BASE_URL`
  - `ENCRYPTION_SECRET`
  - `MONGO_URI`

### Test Scenarios

#### 1. New User (No API Key)
**Steps:**
1. Run `/minmax` without having set an API key
2. **Expected:** Error message: "You need to set your API key first. Use `/setkey` to store your Torn API key."

#### 2. Set API Key
**Steps:**
1. Run `/setkey key:YOUR_TORN_API_KEY`
2. **Expected:** Success message with user name and Torn ID

#### 3. Check Own Stats (First Time)
**Steps:**
1. Run `/minmax`
2. **Expected:** 
   - Response with three tasks
   - Each task shows current/target format
   - Check marks (✅) for completed tasks
   - X marks (❌) for incomplete tasks

#### 4. Check Another User's Stats
**Steps:**
1. Run `/minmax userid:3926388` (use a valid Torn user ID)
2. **Expected:**
   - Response shows "Daily Task Completion for User ID 3926388:"
   - Stats are for the specified user, not yourself

#### 5. Invalid User ID
**Steps:**
1. Run `/minmax userid:99999999` (use an invalid ID)
2. **Expected:** Error message about failed to fetch stats

#### 6. Verify Daily Calculation
**Steps:**
1. Note current time (relative to UTC midnight)
2. Run `/minmax`
3. Verify the numbers match expected daily progress:
   - If you bought 120 items total and had 20 at midnight, should show 100
   - If you took 5 xanax total and had 2 at midnight, should show 3
   - If you did 2 refills total and had 1 at midnight, should show 1

#### 7. Test at UTC Midnight Boundary
**Steps:**
1. Run `/minmax` just before UTC midnight
2. Note the values
3. Wait until after UTC midnight
4. Run `/minmax` again
5. **Expected:** Values should reset (midnight baseline updates)

#### 8. Privacy Check
**Steps:**
1. Run `/minmax` in a public Discord channel
2. **Expected:** Response is ephemeral (only visible to you)

#### 9. Multiple Users Same Time
**Steps:**
1. Have 2+ users run `/minmax` simultaneously
2. **Expected:** Each user sees their own stats, no cross-contamination

#### 10. Stress Test
**Steps:**
1. Run `/minmax` multiple times in quick succession
2. **Expected:** All requests complete successfully without rate limiting issues

## Integration Test Points

### API Endpoint Tests
- [ ] POST `/api/discord/minmax` returns 401 without auth header
- [ ] POST `/api/discord/minmax` returns 401 with invalid token
- [ ] POST `/api/discord/minmax` returns 400 when user has no API key
- [ ] POST `/api/discord/minmax` returns 200 with valid data for own user
- [ ] POST `/api/discord/minmax` returns 200 with valid data for other user
- [ ] POST `/api/discord/minmax` handles Torn API errors gracefully

### Edge Cases
- [ ] User with 0 items bought today
- [ ] User who exceeded daily targets (e.g., 500 items bought)
- [ ] User with no xanax taken today
- [ ] User with multiple refills (should still show completed)
- [ ] Brand new Torn account with no historical data

## Performance Checks
- [ ] Command responds within 3 seconds under normal conditions
- [ ] No memory leaks after 100+ command invocations
- [ ] API call logging works correctly
- [ ] Error logging captures all failures appropriately

## Security Verification
- [ ] API keys remain encrypted in database
- [ ] No API keys exposed in logs
- [ ] No API keys exposed in error messages
- [ ] Users cannot access other users' API keys
- [ ] Authentication tokens are validated correctly

## Deployment Checklist
Before deploying to production:
- [ ] All manual tests pass
- [ ] Commands registered in Discord (run register-commands script)
- [ ] Monitor logs for first 24 hours after deployment
- [ ] Have rollback plan ready
- [ ] Document any known issues or limitations

## Known Limitations
- Stats are based on Torn API v2 data availability
- Historical data relies on Torn's timestamp parameter accuracy
- Users must have "personalstats" permission in their API key
- Midnight is calculated in UTC, not user's local timezone

## Support Resources
If issues occur:
1. Check Discord bot logs
2. Check API server logs
3. Verify Torn API status: https://www.torn.com/api.html
4. Check database connectivity
5. Verify all environment variables are set correctly
