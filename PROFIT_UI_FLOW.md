# Profit Page UI Flow with Travel Status

## Visual Layout Examples

### Example 1: Foreign Tab (Always Shows Multiply Checkbox)

```
┌────────────────────────────────────────────────────────────────┐
│ Profit Analysis                                                │
│ Total Items: 100 | Countries: 12                               │
├────────────────────────────────────────────────────────────────┤
│ [Torn] [Foreign] [Mexico] [Canada] [Hawaii] ...               │
├────────────────────────────────────────────────────────────────┤
│ ☑ Multiply by 15                                              │
│                                                                │
│ Name       Country   Buy Price   Avg Sold   Sold Profit ...  │
│ ───────────────────────────────────────────────────────────── │
│ Xanax      Mexico    $15,000     $830,000   $12,225,000       │
│ Erotic DVD Canada    $69,000     $4,600,000 $67,965,000       │
└────────────────────────────────────────────────────────────────┘

* Buy Price and Sold Profit are multiplied by 15
* No checkboxes or Watch button (Foreign tab shows all countries)
```

### Example 2: Mexico Tab (NOT Travelling) 

```
┌────────────────────────────────────────────────────────────────┐
│ Profit Analysis                                                │
│ Total Items: 100 | Countries: 12                               │
├────────────────────────────────────────────────────────────────┤
│ [Torn] [Foreign] →[Mexico]← [Canada] [Hawaii] ...             │
├────────────────────────────────────────────────────────────────┤
│ ☑ Multiply by 15                                              │
│                                                                │
│ Name       Country   Buy Price   Avg Sold   Sold Profit ...  │
│ ───────────────────────────────────────────────────────────── │
│ Xanax      Mexico    $15,000     $830,000   $12,225,000       │
│ Plushie    Mexico    $45,000     $2,100,000 $30,825,000       │
└────────────────────────────────────────────────────────────────┘

* Shows multiply checkbox (checked by default)
* NO checkboxes next to items (not travelling)
* NO Watch button (not travelling)
```

### Example 3: Mexico Tab (TRAVELLING TO MEXICO) ⭐

```
┌────────────────────────────────────────────────────────────────┐
│ Profit Analysis                                                │
│ Total Items: 100 | Countries: 12                               │
├────────────────────────────────────────────────────────────────┤
│ [Torn] [Foreign] →[Mexico]← [Canada] [Hawaii] ...             │
├────────────────────────────────────────────────────────────────┤
│ ☑ Multiply by 15        [Watch (2/3)] ← Button enabled        │
│                                                                │
│ Select Name       Country   Buy Price   Avg Sold   Sold Profit│
│ ────────────────────────────────────────────────────────────── │
│ ☑ #1   Xanax      Mexico    $15,000     $830,000   $12,225,000│
│ ☐      Plushie    Mexico    $45,000     $2,100,000 $30,825,000│
│ ☑ #2   DVD        Mexico    $69,000     $4,600,000 $67,965,000│
└────────────────────────────────────────────────────────────────┘

* Shows multiply checkbox (checked by default)
* Shows item checkboxes with position numbers (#1, #2, #3)
* Shows "Watch" button (enabled when items selected)
* Watch URL: https://www.torn.com/index.php?item1=18&item2=23&amount=15&arrival=1759913103
```

### Example 4: Mexico Tab - Multiply Unchecked

```
┌────────────────────────────────────────────────────────────────┐
│ ☐ Multiply by 15        [Watch (2/3)]                         │
│                                                                │
│ Select Name       Country   Buy Price   Avg Sold   Sold Profit│
│ ────────────────────────────────────────────────────────────── │
│ ☑ #1   Xanax      Mexico    $1,000      $830,000   $815,000   │
│ ☐      Plushie    Mexico    $3,000      $2,100,000 $2,055,000 │
│ ☑ #2   DVD        Mexico    $4,600      $4,600,000 $4,530,000 │
└────────────────────────────────────────────────────────────────┘

* Buy Price and Sold Profit now show PER-ITEM values (÷15)
* Watch button still works (uses item IDs, not prices)
```

### Example 5: Canada Tab (Travelling to MEXICO, not Canada)

```
┌────────────────────────────────────────────────────────────────┐
│ [Torn] [Foreign] [Mexico] →[Canada]← [Hawaii] ...             │
├────────────────────────────────────────────────────────────────┤
│ ☑ Multiply by 15                                              │
│                                                                │
│ Name       Country   Buy Price   Avg Sold   Sold Profit ...  │
│ ───────────────────────────────────────────────────────────── │
│ Item 1     Canada    $30,000     $1,500,000 $22,050,000       │
│ Item 2     Canada    $45,000     $2,200,000 $32,325,000       │
└────────────────────────────────────────────────────────────────┘

* Shows multiply checkbox (checked by default)
* NO checkboxes (travelling to different country)
* NO Watch button (travelling to different country)
```

## State-Based Behavior Matrix

| Scenario | Foreign Tab | Mexico Tab | Other Country Tab |
|----------|------------|------------|-------------------|
| **Not Travelling** | ✅ Multiply checkbox<br>❌ Item checkboxes<br>❌ Watch button | ✅ Multiply checkbox<br>❌ Item checkboxes<br>❌ Watch button | ✅ Multiply checkbox<br>❌ Item checkboxes<br>❌ Watch button |
| **Travelling to Mexico** | ✅ Multiply checkbox<br>❌ Item checkboxes<br>❌ Watch button | ✅ Multiply checkbox<br>✅ Item checkboxes<br>✅ Watch button | ✅ Multiply checkbox<br>❌ Item checkboxes<br>❌ Watch button |
| **Travelling to Torn** | ✅ Multiply checkbox<br>❌ Item checkboxes<br>❌ Watch button | ✅ Multiply checkbox<br>❌ Item checkboxes<br>❌ Watch button | ✅ Multiply checkbox<br>❌ Item checkboxes<br>❌ Watch button |

## Watch URL Format

When 2 items are selected (Xanax #1, DVD #2) and travelling to Mexico with arrival at 1759913103:

```
https://www.torn.com/index.php?item1=18&item2=23&amount=15&arrival=1759913103
```

Breaking down the URL:
- `item1=18` - First selected item (Xanax, position #1)
- `item2=23` - Second selected item (DVD, position #2)
- `amount=15` - Value from `max_foreign_items`
- `arrival=1759913103` - Unix timestamp from `travel_status.arrival_at`

## Multiplication Logic

### Values that ARE multiplied (when checkbox checked):
- ✅ Buy Price
- ✅ Profit Per 1
- ✅ Sold Profit
- ✅ Estimated Market Value Profit
- ✅ Lowest 50 Profit
- ✅ Profit/Min

### Values that are NOT multiplied:
- ❌ Market Price (single item market value)
- ❌ Avg Sold Price (market data)
- ❌ 24h Sales (count, not price)
- ❌ In Stock (count, not price)
- ❌ Travel Time (time, not price)

### Calculation Example:
```
Base Values (per 1 item):
- Buy Price: $1,000
- Sold Profit: $815,000

With "Multiply by 15" CHECKED:
- Buy Price: $1,000 × 15 = $15,000
- Sold Profit: $815,000 × 15 = $12,225,000

With "Multiply by 15" UNCHECKED:
- Buy Price: $1,000
- Sold Profit: $815,000
```

## Item Selection Logic

1. User clicks checkbox next to first item → Gets position #1
2. User clicks checkbox next to second item → Gets position #2
3. User clicks checkbox next to third item → Gets position #3
4. User tries to click checkbox next to fourth item → **Disabled** (max 3 items)
5. User unchecks second item (#2):
   - Position #2 is freed up
   - Other items keep their positions (#1 stays #1, #3 stays #3)
6. User clicks checkbox next to fourth item → Gets position #2 (first available)

The position number (#1, #2, #3) is displayed next to each checked checkbox so users know which item is which in the Watch URL.

## Travel Status States

### State 1: Not Travelling
```json
{
  "travel_status": null
}
```
**UI Behavior:** Only multiply checkbox shown

### State 2: Travelling to Foreign Country
```json
{
  "travel_status": {
    "destination": "Mexico",
    "method": "Airstrip",
    "departed_at": 1759912083,
    "arrival_at": 1759913103,
    "time_left": 916
  }
}
```
**UI Behavior:** Multiply checkbox + item checkboxes + Watch button (on Mexico tab only)

### State 3: Travelling Back Home
```json
{
  "travel_status": {
    "destination": "Torn",
    "method": "Airstrip",
    "departed_at": 1759913124,
    "arrival_at": 1759914264,
    "time_left": 0
  }
}
```
**UI Behavior:** Only multiply checkbox shown (treated as "not travelling")
