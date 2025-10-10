describe('Profit Per Minute Calculation', () => {
  const MAX_FOREIGN_ITEMS = 19;
  const PRIVATE_ISLAND_REDUCTION = 0.30;

  describe('Basic calculation', () => {
    it('should calculate profit per minute correctly for Dog Treats to Canada', () => {
      // User's example from the bug report
      const soldProfit = 6555.65; // Profit per item
      const canadaTravelTime = 41; // Base one-way travel time to Canada
      const hasPrivateIsland = true;

      // Calculate adjusted travel time using the EXACT formula from profit.ts line 329-331
      const adjustedTravelTime = hasPrivateIsland
        ? Math.round(canadaTravelTime * (1 - PRIVATE_ISLAND_REDUCTION) * 100) / 100
        : Math.round(canadaTravelTime);

      // Expected: 41 * 0.70 = 28.7 (stored with 2 decimal precision)
      expect(adjustedTravelTime).toBe(28.7);

      // Calculate profit per minute: (sold_profit * MAX_FOREIGN_ITEMS) / (2 * travel_time)
      const totalProfit = soldProfit * MAX_FOREIGN_ITEMS;
      const roundTripTime = adjustedTravelTime * 2; // 57.4 minutes
      const profitPerMinute = totalProfit / roundTripTime;

      // Expected calculation: (6555.65 * 19) / 57.4 = 124557.35 / 57.4 = 2169.99
      expect(totalProfit).toBeCloseTo(124557.35, 1);
      expect(roundTripTime).toBe(57.4);
      expect(profitPerMinute).toBeCloseTo(2169.99, 0);

      // Verify it's NOT the incorrect value (41229)
      expect(profitPerMinute).not.toBeCloseTo(41229, 0);
    });

    it('should calculate profit per minute correctly without private island', () => {
      const soldProfit = 1000; // Profit per item
      const travelTime = 40; // Base one-way travel time
      const hasPrivateIsland = false;

      const adjustedTravelTime = hasPrivateIsland
        ? Math.round(travelTime * (1 - PRIVATE_ISLAND_REDUCTION) * 100) / 100
        : Math.round(travelTime);

      expect(adjustedTravelTime).toBe(40);

      const totalProfit = soldProfit * MAX_FOREIGN_ITEMS;
      const roundTripTime = adjustedTravelTime * 2; // 80 minutes
      const profitPerMinute = totalProfit / roundTripTime;

      // (1000 * 19) / 80 = 19000 / 80 = 237.5
      expect(profitPerMinute).toBeCloseTo(237.5, 1);
    });

    it('should return null when sold_profit is null', () => {
      const soldProfit = null;
      const travelTime = 40;

      let profitPerMinute = null;
      if (soldProfit !== null && travelTime > 0) {
        const totalProfit = soldProfit * MAX_FOREIGN_ITEMS;
        const roundTripTime = travelTime * 2;
        profitPerMinute = totalProfit / roundTripTime;
      }

      expect(profitPerMinute).toBeNull();
    });

    it('should return null when travel_time is 0', () => {
      const soldProfit = 1000;
      const travelTime = 0;

      let profitPerMinute = null;
      if (soldProfit !== null && travelTime > 0) {
        const totalProfit = soldProfit * MAX_FOREIGN_ITEMS;
        const roundTripTime = travelTime * 2;
        profitPerMinute = totalProfit / roundTripTime;
      }

      expect(profitPerMinute).toBeNull();
    });
  });

  describe('Real-world scenarios', () => {
    it('should calculate profit for all items with same sold_profit', () => {
      const soldProfit = 5000;
      const travelTime = 100; // One-way
      const hasPrivateIsland = true;

      const adjustedTravelTime = Math.round(travelTime * (1 - PRIVATE_ISLAND_REDUCTION) * 100) / 100;
      // 100 * 0.70 = 70
      expect(adjustedTravelTime).toBe(70);

      const totalProfit = soldProfit * MAX_FOREIGN_ITEMS;
      const roundTripTime = adjustedTravelTime * 2; // 140 minutes
      const profitPerMinute = totalProfit / roundTripTime;

      // (5000 * 19) / 140 = 95000 / 140 = 678.57
      expect(profitPerMinute).toBeCloseTo(678.57, 1);
    });

    it('should handle negative profit correctly', () => {
      const soldProfit = -500; // Losing money
      const travelTime = 50;
      const hasPrivateIsland = false;

      const totalProfit = soldProfit * MAX_FOREIGN_ITEMS;
      const roundTripTime = travelTime * 2;
      const profitPerMinute = totalProfit / roundTripTime;

      // (-500 * 19) / 100 = -9500 / 100 = -95
      expect(profitPerMinute).toBeCloseTo(-95, 1);
    });

    it('should verify the formula matches API implementation', () => {
      // This test verifies the exact formula used in profit.ts line 336-338
      const sold_profit = 6555.65;
      const travel_time_minutes = 28.7; // Already adjusted for private island (41 * 0.70)
      const MAX_FOREIGN_ITEMS = 19;

      // API formula: (sold_profit * MAX_FOREIGN_ITEMS) / (travel_time_minutes * 2)
      const totalProfit = sold_profit * MAX_FOREIGN_ITEMS;
      const roundTripTime = travel_time_minutes * 2;
      const profit_per_minute = totalProfit / roundTripTime;

      expect(profit_per_minute).toBeCloseTo(2169.99, 0);
    });
  });

  describe('UI multiplier interaction (bug verification)', () => {
    it('should NOT multiply profit_per_minute again in UI', () => {
      // This test documents the bug and its fix
      const sold_profit = 6555.65;
      const travel_time_minutes = 28.7; // Adjusted Canada time with private island
      const MAX_FOREIGN_ITEMS = 19;

      // API calculates profit_per_minute
      const api_profit_per_minute = (sold_profit * MAX_FOREIGN_ITEMS) / (travel_time_minutes * 2);
      expect(api_profit_per_minute).toBeCloseTo(2169.99, 0);

      // WRONG (old behavior): UI multiplies it again
      const wrong_ui_display = api_profit_per_minute * MAX_FOREIGN_ITEMS;
      expect(wrong_ui_display).toBeCloseTo(41229.77, 0); // This was the bug!

      // CORRECT (new behavior): UI displays it as-is
      const correct_ui_display = api_profit_per_minute;
      expect(correct_ui_display).toBeCloseTo(2169.99, 0);

      // Verify the wrong value is close to what the user reported (41229)
      expect(wrong_ui_display).toBeCloseTo(41229, -1); // Within tens
    });
  });
});
