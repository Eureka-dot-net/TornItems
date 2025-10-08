# Quick Testing Guide - Foreign Items & Travel Status Features

## Quick Verification Checklist

### Backend API Testing

**1. Check API Response Structure**
```bash
# Call the profit API endpoint
curl http://localhost:3000/api/profit

# Verify response includes:
# ✓ "max_foreign_items": 15
# ✓ "travel_status": {...} or null
```

**Expected Response Structure:**
```json
{
  "count": 100,
  "countries": 12,
  "max_foreign_items": 15,
  "travel_status": {
    "destination": "Mexico",
    "method": "Airstrip",
    "departed_at": 1759912083,
    "arrival_at": 1759913103,
    "time_left": 916
  },
  "results": { ... }
}
```

**2. Test Travel Status Scenarios**

**Not Travelling:**
- `travel_status` should be `null`

**Travelling to Foreign Country:**
- `travel_status.destination` should be country name (e.g., "Mexico")
- `travel_status.arrival_at` should be Unix timestamp
- `travel_status.time_left` should be seconds remaining

**Travelling Back Home:**
- `travel_status.destination` should be "Torn"
- UI should treat this as "not travelling"

### Frontend UI Testing

**3. Foreign Tab**
1. Navigate to Profit page
2. Click "Foreign" tab
3. ✓ "Multiply by 15" checkbox is visible and CHECKED
4. ✓ Buy prices show multiplied values
5. ✓ Profit values show multiplied values
6. Uncheck the checkbox
7. ✓ Values divide by 15
8. ✓ NO item checkboxes visible
9. ✓ NO "Watch" button visible

**4. Individual Country Tab (NOT Travelling)**
1. Click any country tab (e.g., "Mexico")
2. ✓ "Multiply by 15" checkbox is visible and CHECKED
3. ✓ Buy prices and profits show multiplied values
4. ✓ NO item checkboxes visible
5. ✓ NO "Watch" button visible

**5. Individual Country Tab (TRAVELLING to that country)**

*Prerequisites: Start travel to Mexico in Torn game first*

1. Click "Mexico" tab
2. ✓ "Multiply by 15" checkbox is visible and CHECKED
3. ✓ "Watch (0/3)" button is visible but DISABLED
4. ✓ "Select" column header appears
5. ✓ Each item has a checkbox

**6. Item Selection**
1. Click checkbox next to first item (e.g., Xanax)
   - ✓ Checkbox gets checked with "#1" label
   - ✓ Watch button shows "Watch (1/3)" and is ENABLED
2. Click checkbox next to second item
   - ✓ Checkbox gets checked with "#2" label
   - ✓ Watch button shows "Watch (2/3)"
3. Click checkbox next to third item
   - ✓ Checkbox gets checked with "#3" label
   - ✓ Watch button shows "Watch (3/3)"
4. Try to click checkbox next to fourth item
   - ✓ Checkbox is DISABLED (greyed out)

**7. Watch Button Functionality**
1. With items selected, click "Watch" button
2. ✓ Opens new tab with URL like:
   ```
   https://www.torn.com/index.php?item1=18&item2=159&item3=132&amount=15&arrival=1738941300
   ```
3. ✓ item1, item2, item3 match selected item IDs in order
4. ✓ amount equals max_foreign_items (15)
5. ✓ arrival matches travel_status.arrival_at

**8. Multiply Checkbox with Selections**
1. Select 2 items
2. Note the buy price (e.g., $15,000)
3. Uncheck "Multiply by 15"
4. ✓ Buy price changes to $1,000 (÷15)
5. ✓ Selected items remain selected
6. ✓ Watch button still works
7. Re-check "Multiply by 15"
8. ✓ Buy price changes back to $15,000 (×15)

**9. Different Country Tab (While Travelling to Mexico)**
1. While travelling to Mexico, click "Canada" tab
2. ✓ "Multiply by 15" checkbox is visible
3. ✓ NO item checkboxes (not travelling to Canada)
4. ✓ NO "Watch" button (not travelling to Canada)

**10. Item Row Interaction**
1. Click on an item row (not on checkbox)
2. ✓ Row expands to show details
3. ✓ Details show multiplied values (if checkbox checked)
4. Click checkbox on item
5. ✓ Checkbox changes state
6. ✓ Row does NOT collapse

## Values to Verify

### When "Multiply by 15" is CHECKED ✅

**Example: Xanax in Mexico**
- Single item buy price: $1,000
- Single item sold profit: $815,000

**Displayed Values (×15):**
- Buy Price: **$15,000** ✓
- Profit Per 1: **$12,225,000** ✓
- Sold Profit: **$12,225,000** ✓
- Profit/Min: **$458,437** ✓

**Not Multiplied:**
- Avg Sold Price: $830,000 (market price)
- 24h Sales: 42 (count)
- In Stock: 15 (count)
- Travel Time: 63m (time)

### When "Multiply by 15" is UNCHECKED ☐

**Displayed Values (÷15):**
- Buy Price: **$1,000** ✓
- Profit Per 1: **$815,000** ✓
- Sold Profit: **$815,000** ✓
- Profit/Min: **$30,562** ✓

## Watch URL Validation

**Format:**
```
https://www.torn.com/index.php?item1={id}&item2={id}&item3={id}&amount={max}&arrival={timestamp}
```

**Example with 3 items selected:**
```
https://www.torn.com/index.php?item1=18&item2=159&item3=132&amount=15&arrival=1738941300
```

**Verify:**
- ✓ item1 = ID of first selected item (#1)
- ✓ item2 = ID of second selected item (#2)
- ✓ item3 = ID of third selected item (#3)
- ✓ amount = max_foreign_items (15)
- ✓ arrival = travel_status.arrival_at (Unix timestamp)

**With 2 items:**
```
https://www.torn.com/index.php?item1=18&item2=159&amount=15&arrival=1738941300
```

**With 1 item:**
```
https://www.torn.com/index.php?item1=18&amount=15&arrival=1738941300
```

## Common Issues & Solutions

### Issue: "Multiply by 15" checkbox not appearing
**Check:**
- Is the selected tab a foreign country (not Torn)?
- Check browser console for errors

### Issue: Item checkboxes not appearing
**Check:**
- Are you on an individual country tab (not "Foreign")?
- Is travel_status populated in API response?
- Does travel_status.destination match the selected country?
- Is travel_status.destination not "Torn"?

### Issue: Watch button not appearing
**Check:**
- Same checks as item checkboxes above
- Button only appears when travelling to that specific country

### Issue: Watch button is disabled
**Check:**
- Have you selected at least one item?
- Button should show "Watch (0/3)" when disabled

### Issue: Values not multiplying correctly
**Check:**
- Is the checkbox actually checked?
- Clear browser cache and reload
- Check that profitData.max_foreign_items is 15

### Issue: Can't select more than 3 items
**Expected Behavior:**
- Maximum of 3 items can be selected
- 4th checkbox should be disabled
- This is correct behavior per Torn game mechanics

## Browser DevTools Checks

### Console Checks
```javascript
// Should see no errors related to:
// - Missing properties on profitData
// - Undefined travel_status
// - TypeError on applyMultiplier
```

### Network Tab
```
GET /api/profit
Response should include:
{
  "max_foreign_items": 15,
  "travel_status": {...} or null
}
```

### React DevTools (if available)
```
Check Profit component state:
- multiplyByAmount: true (default)
- selectedItems: Map (size: 0 to 3)
```

## Manual API Testing with curl

**Test 1: Basic Response**
```bash
curl -s http://localhost:3000/api/profit | jq '.max_foreign_items'
# Expected: 15

curl -s http://localhost:3000/api/profit | jq '.travel_status'
# Expected: {...} or null
```

**Test 2: Check All Countries**
```bash
curl -s http://localhost:3000/api/profit | jq '.results | keys'
# Expected: ["Argentina", "Canada", "Cayman Islands", "China", ...]
```

**Test 3: Verify Item Structure**
```bash
curl -s http://localhost:3000/api/profit | jq '.results.Mexico[0]'
# Should include: id, name, buy_price, sold_profit, profit_per_minute, etc.
```

## Automated Testing Script

```bash
#!/bin/bash
# Quick smoke test

echo "Testing API endpoint..."
RESPONSE=$(curl -s http://localhost:3000/api/profit)

# Check max_foreign_items
if echo "$RESPONSE" | jq -e '.max_foreign_items == 15' > /dev/null; then
  echo "✓ max_foreign_items present and correct"
else
  echo "✗ max_foreign_items missing or incorrect"
fi

# Check travel_status exists
if echo "$RESPONSE" | jq -e 'has("travel_status")' > /dev/null; then
  echo "✓ travel_status field present"
else
  echo "✗ travel_status field missing"
fi

# Check results
if echo "$RESPONSE" | jq -e '.results | has("Mexico")' > /dev/null; then
  echo "✓ Results include Mexico"
else
  echo "✗ Mexico not found in results"
fi
```

## Performance Checks

**Frontend:**
- Page should load without noticeable delay
- Checkbox toggling should be instant
- Item selection should be instant
- Watch URL should generate instantly

**Backend:**
- API response time should be < 2 seconds
- Travel status fetch adds minimal overhead (~100-200ms)

## Accessibility Checks

- ✓ Checkboxes can be toggled with keyboard (Tab + Space)
- ✓ Watch button is keyboard accessible
- ✓ Screen readers announce checkbox state
- ✓ Position numbers (#1, #2, #3) are visible

## Final Verification

After all tests pass:
1. ✓ All builds succeed (API & Client)
2. ✓ All linting passes
3. ✓ No console errors
4. ✓ UI behaves correctly in all scenarios
5. ✓ Watch URLs open correctly in Torn
6. ✓ Multiply checkbox works as expected
7. ✓ Documentation is accurate

**Status:** Ready for Production! 🚀
