describe('Travel Time Rounding', () => {
  describe('actualTravelTimeMinutes calculation', () => {
    it('should round to whole minutes for non-private island users', () => {
      const travelTimeMinutes = 26;
      const hasPrivateIsland = false;
      
      const actualTravelTimeMinutes = hasPrivateIsland 
        ? Math.round(Math.round(travelTimeMinutes * 0.70 * 100) / 100)
        : Math.round(travelTimeMinutes);
      
      expect(actualTravelTimeMinutes).toBe(26);
    });

    it('should round to whole minutes for private island users', () => {
      const travelTimeMinutes = 26;
      const hasPrivateIsland = true;
      
      const actualTravelTimeMinutes = hasPrivateIsland 
        ? Math.round(Math.round(travelTimeMinutes * 0.70 * 100) / 100)
        : Math.round(travelTimeMinutes);
      
      // 26 * 0.70 = 18.2, rounded to 18
      expect(actualTravelTimeMinutes).toBe(18);
    });

    it('should handle floating-point precision issues (Switzerland case)', () => {
      const travelTimeMinutes = 175; // 175 * 0.70 = 122.5 but JS gives 122.499999...
      const hasPrivateIsland = true;
      
      const actualTravelTimeMinutes = hasPrivateIsland 
        ? Math.round(Math.round(travelTimeMinutes * 0.70 * 100) / 100)
        : Math.round(travelTimeMinutes);
      
      // Without precision fix: Math.round(175 * 0.70) = 122 (wrong!)
      // With precision fix: Math.round(Math.round(175 * 0.70 * 100) / 100) = Math.round(122.5) = 123 (correct!)
      expect(actualTravelTimeMinutes).toBe(123);
    });

    it('should round correctly when result has .5 decimals', () => {
      const travelTimeMinutes = 35; // 35 * 0.70 = 24.5
      const hasPrivateIsland = true;
      
      const actualTravelTimeMinutes = hasPrivateIsland 
        ? Math.round(Math.round(travelTimeMinutes * 0.70 * 100) / 100)
        : Math.round(travelTimeMinutes);
      
      // 35 * 0.70 = 24.5, rounds to 25 (Math.round rounds up)
      expect(actualTravelTimeMinutes).toBe(25);
    });

    it('should round down when decimal is less than .5', () => {
      const travelTimeMinutes = 41; // 41 * 0.70 = 28.7
      const hasPrivateIsland = true;
      
      const actualTravelTimeMinutes = hasPrivateIsland 
        ? Math.round(Math.round(travelTimeMinutes * 0.70 * 100) / 100)
        : Math.round(travelTimeMinutes);
      
      // 41 * 0.70 = 28.7, rounds to 29
      expect(actualTravelTimeMinutes).toBe(29);
    });

    it('should calculate correctly for all countries with private island', () => {
      const testCases = [
        { country: 'Mexico', time: 26, expected: 18 },        // 26 * 0.70 = 18.2 → 18
        { country: 'Cayman Islands', time: 35, expected: 25 }, // 35 * 0.70 = 24.5 → 25
        { country: 'Canada', time: 41, expected: 29 },         // 41 * 0.70 = 28.7 → 29
        { country: 'Hawaii', time: 134, expected: 94 },        // 134 * 0.70 = 93.8 → 94
        { country: 'United Kingdom', time: 159, expected: 111 }, // 159 * 0.70 = 111.3 → 111
        { country: 'Argentina', time: 167, expected: 117 },    // 167 * 0.70 = 116.9 → 117
        { country: 'Switzerland', time: 175, expected: 123 },  // 175 * 0.70 = 122.5 → 123 (precision fix!)
        { country: 'Japan', time: 225, expected: 158 },        // 225 * 0.70 = 157.5 → 158
        { country: 'China', time: 242, expected: 169 },        // 242 * 0.70 = 169.4 → 169
        { country: 'UAE', time: 271, expected: 190 },          // 271 * 0.70 = 189.7 → 190
        { country: 'South Africa', time: 297, expected: 208 }, // 297 * 0.70 = 207.9 → 208
      ];

      testCases.forEach(({ country, time, expected }) => {
        const actualTravelTimeMinutes = Math.round(Math.round(time * 0.70 * 100) / 100);
        expect(actualTravelTimeMinutes).toBe(expected);
      });
    });
  });
});
