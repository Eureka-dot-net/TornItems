# /minmax Command - Visual Examples

## Command Examples

### Example 1: Checking Your Own Stats (All Tasks Complete)

**User Input:**
```
/minmax
```

**Bot Response:**
```
**Daily Task Completion:**

✅ **City Items Bought:** 150/100
✅ **Xanax Taken:** 3/3
✅ **Energy Refill:** 1/1
```

---

### Example 2: Checking Your Own Stats (Partial Progress)

**User Input:**
```
/minmax
```

**Bot Response:**
```
**Daily Task Completion:**

❌ **City Items Bought:** 45/100
✅ **Xanax Taken:** 3/3
❌ **Energy Refill:** 0/1
```

---

### Example 3: Checking Another User's Stats

**User Input:**
```
/minmax userid:3926388
```

**Bot Response:**
```
**Daily Task Completion for User ID 3926388:**

✅ **City Items Bought:** 100/100
❌ **Xanax Taken:** 2/3
✅ **Energy Refill:** 1/1
```

---

### Example 4: User Without API Key

**User Input:**
```
/minmax
```

**Bot Response:**
```
❌ You need to set your API key first.
Use `/setkey` to store your Torn API key.
```

---

### Example 5: Invalid User ID or API Error

**User Input:**
```
/minmax userid:99999999
```

**Bot Response:**
```
❌ Failed to fetch personal stats from Torn API. Please check your API key and user ID.
```

---

## Command Flow Diagram

```
┌─────────────────────────────────────────┐
│  User types: /minmax                    │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│  Bot: "📊 Fetching daily task status...│
│       (ephemeral message)              │
└───────────────┬─────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────┐
│  Check: Does user have API key?         │
└───────────────┬─────────────────────────┘
                │
        ┌───────┴───────┐
        │               │
        ▼               ▼
    [NO]            [YES]
        │               │
        ▼               ▼
┌──────────────┐  ┌──────────────────────┐
│ Error:       │  │ Fetch current stats  │
│ Set API key  │  │ from Torn API        │
│ first        │  └──────────┬───────────┘
└──────────────┘             │
                             ▼
                    ┌──────────────────────┐
                    │ Fetch midnight stats │
                    │ from Torn API        │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Calculate daily      │
                    │ progress:            │
                    │ current - midnight   │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Format response with │
                    │ ✅/❌ indicators     │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │ Display results to   │
                    │ user (ephemeral)     │
                    └──────────────────────┘
```

---

## API Data Flow

### Step 1: Fetch Current Stats
```
Request:
GET https://api.torn.com/v2/user/3926388/personalstats?
    cat=all&
    key=YOUR_API_KEY

Response (partial):
{
  "personalstats": {
    "trading": {
      "items": {
        "bought": {
          "market": 636,
          "shops": 2856
        }
      }
    },
    "drugs": {
      "xanax": 40
    },
    "other": {
      "refills": {
        "energy": 12
      }
    }
  }
}
```

### Step 2: Fetch Midnight Stats (Baseline)
```
Request:
GET https://api.torn.com/v2/user/3926388/personalstats?
    stat=cityitemsbought,xantaken,refills&
    key=YOUR_API_KEY

Response:
{
  "personalstats": [
    { "name": "cityitemsbought", "value": 2706, "timestamp": 1760832000 },
    { "name": "xantaken", "value": 37, "timestamp": 1760832000 },
    { "name": "refills", "value": 11, "timestamp": 1760832000 }
  ]
}
```

### Step 3: Calculate Daily Progress
```javascript
// Extract current values from nested structure
currentShops = 2856  // from personalstats.trading.items.bought.shops
currentXanax = 40    // from personalstats.drugs.xanax
currentRefills = 12  // from personalstats.other.refills.energy

// Extract midnight values from flat array
midnightShops = 2706    // from personalstats array where name='cityitemsbought'
midnightXanax = 37      // from personalstats array where name='xantaken'
midnightRefills = 11    // from personalstats array where name='refills'

// Calculate daily progress
itemsBoughtToday = 2856 - 2706 = 150 ✅ (>= 100)
xanTakenToday = 40 - 37 = 3 ✅ (>= 3)
refillsToday = 12 - 11 = 1 ✅ (>= 1)
```

---

## Integration Points

### Discord Bot → API Server
```
POST https://your-api-server.com/api/discord/minmax
Headers:
  Content-Type: application/json
  Authorization: Bearer YOUR_BOT_SECRET

Body:
{
  "discordId": "123456789012345678",
  "userId": 3926388  // optional
}

Response:
{
  "success": true,
  "data": {
    "userId": 3926388,
    "cityItemsBought": {
      "current": 150,
      "target": 100,
      "completed": true
    },
    "xanaxTaken": {
      "current": 3,
      "target": 3,
      "completed": true
    },
    "energyRefill": {
      "current": 1,
      "target": 1,
      "completed": true
    }
  }
}
```

---

## Usage Scenarios

### Scenario A: Faction Leader Checking Members
A faction leader wants to verify their members are completing daily tasks:
```
/minmax userid:1234567
/minmax userid:7654321
/minmax userid:9876543
```

### Scenario B: Personal Progress Tracking
A player checks their progress throughout the day:
```
Morning:   /minmax → Shows 0/100, 0/3, 0/1
Afternoon: /minmax → Shows 50/100, 2/3, 0/1
Evening:   /minmax → Shows 120/100, 3/3, 1/1 ✅ All complete!
```

### Scenario C: New User Setup
A new user first interaction:
```
1. /minmax → Error: Need API key
2. /setkey key:ABC123XYZ → Success: Linked to PlayerName
3. /minmax → Shows current daily progress
```

---

## Benefits

1. **Quick Status Check** - See all daily task progress in one command
2. **Visual Feedback** - Checkmarks and X marks make status immediately clear
3. **Privacy** - Ephemeral responses keep your stats private
4. **Flexibility** - Check your own stats or others' (using your API key)
5. **Accurate** - Direct calculation from Torn API data
