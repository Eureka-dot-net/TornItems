# Stock Recommendations UI Changes - Visual Guide

## Overview
This document shows the changes made to the Stock Recommendations page based on the requirements.

## Original UI (Before Changes)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Stock Recommendations                                                        │
│ Total Stocks: 32                                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ Ticker │ Name │ Price │ 7d Chg │ Vol │ Score │ Rec │ Owned │ Profit $ │ Profit % │
├────────┼──────┼───────┼────────┼─────┼───────┼─────┼───────┼──────────┼──────────┤
│ ASS    │ ... │ $350  │ +2.5%  │ 3.2 │ 1.5   │ BUY │ 0     │ -        │ -        │
│ BAG    │ ... │ $850  │ -1.2%  │ 2.8 │ -0.5  │HOLD │ 0     │ -        │ -        │
└────────┴──────┴───────┴────────┴─────┴───────┴─────┴───────┴──────────┴──────────┘
```

## New UI (After Changes)

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ Stock Recommendations                                                                        │
│ Total Stocks: 35                                                                            │
│                                                                                             │
│ Extra Money Available: [$ 50,000,000 ] ← New input box!                                   │
│                       Helper text: Enter extra money to highlight affordable stock blocks   │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│Ticker│Name│Price│7d Chg│Score│ Rec │Owned│Benefit          │Days │Yearly ROI│Daily Income│Profit$│Profit%│
├──────┼────┼─────┼──────┼─────┼─────┼─────┼─────────────────┼─────┼──────────┼────────────┼───────┼───────┤
│ ASS  │... │$350 │+2.5% │1.5  │ BUY │ 0   │1x Six Pack...   │7d   │ -        │ -          │ -     │ -     │
├──────┼────┼─────┼──────┼─────┼─────┼─────┼─────────────────┼─────┼──────────┼────────────┼───────┼───────┤
│█ CNC █│...█│$150█│-1.2% █ -0.5█│HOLD█│7.5M █│$80,000,000     █│31d █│ 25.3%   █│ $2,580,645█│+$5M  █│+15% █ │ ← GREEN (can afford!)
├──────┼────┼─────┼──────┼─────┼─────┼─────┼─────────────────┼─────┼──────────┼────────────┼───────┼───────┤
│ GRN  │... │$180 │+0.5% │0.2  │HOLD │500K │$4,000,000       │31d  │ 12.8%    │ $129,032   │-$10K  │-2%    │
├──────┼────┼─────┼──────┼─────┼─────┼─────┼─────────────────┼─────┼──────────┼────────────┼───────┼───────┤
│ IIL  │... │$220 │-2.1% │-1.1 │SELL │ 0   │50% Virus Coding │Pass │ -        │ -          │ -     │ -     │
└──────┴────┴─────┴──────┴─────┴─────┴─────┴─────────────────┴─────┴──────────┴────────────┴───────┴───────┘
```

## Key Changes

### 1. ✅ REMOVED Column
- **Vol (Volatility)** - Removed as requested

### 2. ✅ ADDED Columns
- **Benefit** - Shows what you get from the stock benefit
  - Examples: "1x Six Pack of Alcohol", "$80,000,000", "50% Virus Coding..."
  
- **Days (Benefit Day Count)** - Shows benefit frequency
  - "7d" for 7-day benefits
  - "31d" for 31-day benefits  
  - "Passive" for passive benefits (no frequency)
  
- **Yearly ROI** - Shows annual return on investment
  - Calculated as: (daily_income * 365) / total_investment * 100
  - Green text when positive
  - Shows "-" for passive benefits or stocks without income
  
- **Daily Income** - Shows daily income from benefits
  - Calculated as: (benefit_value * blocks_owned) / frequency_days
  - Green text and bold for positive values
  - Uses market price for item benefits
  - Shows "-" for passive benefits

### 3. ✅ ADDED Input Box
- **Extra Money Available** input at top of page
- User can enter an amount (e.g., $50,000,000)
- Updates highlighting in real-time

### 4. ✅ ROW HIGHLIGHTING
Rows are highlighted with a green background when:
- User has enough extra money to buy the NEXT stock block
- Calculation accounts for the 2x rule:
  - Block 1: 1x requirement
  - Block 2: 2x requirement (additional)
  - Block 3: 4x requirement (additional)
  - Block 4: 8x requirement (additional)

Example:
```
Stock CNC has benefit_requirement = 7,500,000 shares @ $150/share

User owns 7.5M shares (1 block)
Next block needs: 7,500,000 * 2 = 15M additional shares
Cost: 15M * $150 = $2,250,000,000

If user enters $2,250,000,000 or more in "Extra Money" input:
→ CNC row will be highlighted in green!
```

## Multiple Stock Blocks Example

### Understanding the 2x Rule

```
Stock ASS has benefit_requirement = 1,000,000 shares @ $350/share

Block Structure:
┌───────┬──────────────────┬─────────────────┬─────────────────┐
│ Block │ Additional Shares│ Cumulative Total│ Cost            │
├───────┼──────────────────┼─────────────────┼─────────────────┤
│   1   │ 1,000,000 (1x)   │ 1,000,000       │ $350,000,000    │
│   2   │ 2,000,000 (2x)   │ 3,000,000       │ $1,050,000,000  │
│   3   │ 4,000,000 (4x)   │ 7,000,000       │ $2,450,000,000  │
│   4   │ 8,000,000 (8x)   │15,000,000       │ $5,250,000,000  │
└───────┴──────────────────┴─────────────────┴─────────────────┘

Formula: total_shares_for_n_blocks = requirement * (2^n - 1)

If user owns 3,000,000 shares:
→ They own 2 blocks
→ They get benefits 2x as often
→ Daily income = (benefit_value * 2) / 7
```

## Sell Protection

When selling stocks, the system now protects ALL owned blocks:

**Before (Old Logic):**
```
User owns 3,000,000 shares of ASS (2 blocks)
System only protected 1,000,000 shares (Block 1)
User could accidentally sell 2,000,001 shares, losing Block 2! ❌
```

**After (New Logic):**
```
User owns 3,000,000 shares of ASS (2 blocks)
System protects 3,000,000 shares (Blocks 1+2)
User can only sell 0 shares (no excess shares) ✅

If user owns 3,500,000 shares:
System protects 3,000,000 shares (Blocks 1+2)
User can sell up to 500,000 shares (excess) ✅
```

## Benefits by Type

### Active Benefits (Recurring Income)
These provide income on a schedule:

**7-Day Benefits:**
- ASS: 1x Six Pack of Alcohol (Item ID: 817)
- EWM: 1x Box of Grenades (Item ID: 364)
- FHG: 1x Feathery Hotel Coupon (Item ID: 367)
- LSC: 1x Lottery Voucher (Item ID: 369)
- MUN: 1x Six Pack of Energy Drink (Item ID: 818)
- PRN: 1x Erotic DVD (Item ID: 366)
- SYM: 1x Drug Pack (Item ID: 370)
- THS: 1x Box of Medical Supplies (Item ID: 365)
- EVL: 1000 Happy (not monetized)
- CBD: 50 Nerve (not monetized)
- MCS: 100 Energy (not monetized)
- PTS: 100 Points (not monetized)

**31-Day Benefits:**
- CNC: $80,000,000
- GRN: $4,000,000
- IOU: $12,000,000
- TMI: $25,000,000
- TCT: $1,000,000
- TSB: $50,000,000

### Passive Benefits (No Income)
These provide permanent effects but no calculable income:
- ELT: 10% Home Upgrade Discount
- IIL: 50% Virus Coding Time Reduction
- IST: Free Education Courses
- LOS: 25% Mission Credits Boost
- And 10+ more...

## Column Widths (Approximate)

The new layout is compact to fit all columns:

```
Ticker: 0.6   (6% width)
Name:   1.2   (12% width)
Price:  0.8   (8% width)
7d Chg: 0.8   (8% width)
Score:  0.6   (6% width)
Rec:    1.0   (10% width)
Owned:  0.6   (6% width)
Benefit:1.8   (18% width) - Widest column for long descriptions
Days:   0.8   (8% width)
Yearly ROI:  0.8 (8% width)
Daily Income:0.9 (9% width)
Profit $:    1.0 (10% width)
Profit %:    0.8 (8% width)
```

## Color Coding

- **Green background**: Row is affordable with current extra money
- **Green text**: Positive values (ROI, daily income, profit)
- **Red text**: Negative values (7d change, profit loss)
- **Bold text**: Important metrics (score, ticker, income values)

## Responsive Design

The UI uses Material-UI Grid with responsive breakpoints:
- Mobile (xs): Stacked columns, scrollable
- Desktop (sm+): Full table layout with all columns visible
- Font sizes reduced to 0.75rem for compact display
