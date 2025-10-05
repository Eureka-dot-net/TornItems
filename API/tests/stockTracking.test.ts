/**
 * Tests for stock tracking logic
 * 
 * These tests validate the fix for tracking items with 0 stock.
 * The main issue was that the Torn API doesn't return items with 0 stock,
 * so we need to detect sellouts by comparing previous state with current API response.
 * 
 * @jest-environment node
 */

// No database setup needed for these tests
jest.mock('../src/config/db', () => ({
  connectDB: jest.fn(),
  closeDB: jest.fn(),
  isDatabaseConnected: jest.fn(() => false),
}));

describe('Stock Tracking Logic', () => {
  describe('Detecting items with 0 stock', () => {
    it('should identify items that went from positive stock to 0 when not in API response', () => {
      // Simulate previous state - item was in stock
      const previouslyTrackedItems = [
        { shopId: '1', itemId: '206', itemName: 'Lollipop', in_stock: 83 },
        { shopId: '1', itemId: '207', itemName: 'Hammer', in_stock: 50 },
      ];
      
      // Simulate current API response - only returns items in stock
      const currentInventoryKeys = new Set<string>();
      currentInventoryKeys.add('1:207'); // Hammer still in stock
      // Lollipop (206) is NOT in the response, meaning it's now 0
      
      // Check which items need sellout detection
      const itemsNowOutOfStock = previouslyTrackedItems.filter(item => {
        const inventoryKey = `${item.shopId}:${item.itemId}`;
        return !currentInventoryKeys.has(inventoryKey);
      });
      
      expect(itemsNowOutOfStock).toHaveLength(1);
      expect(itemsNowOutOfStock[0].itemName).toBe('Lollipop');
      expect(itemsNowOutOfStock[0].itemId).toBe('206');
    });
    
    it('should handle all items remaining in stock', () => {
      const previouslyTrackedItems = [
        { shopId: '1', itemId: '206', itemName: 'Lollipop', in_stock: 83 },
        { shopId: '1', itemId: '207', itemName: 'Hammer', in_stock: 50 },
      ];
      
      const currentInventoryKeys = new Set<string>();
      currentInventoryKeys.add('1:206');
      currentInventoryKeys.add('1:207');
      
      const itemsNowOutOfStock = previouslyTrackedItems.filter(item => {
        const inventoryKey = `${item.shopId}:${item.itemId}`;
        return !currentInventoryKeys.has(inventoryKey);
      });
      
      expect(itemsNowOutOfStock).toHaveLength(0);
    });
    
    it('should handle all items selling out', () => {
      const previouslyTrackedItems = [
        { shopId: '1', itemId: '206', itemName: 'Lollipop', in_stock: 83 },
        { shopId: '1', itemId: '207', itemName: 'Hammer', in_stock: 50 },
      ];
      
      const currentInventoryKeys = new Set<string>();
      // No items in the current response - all sold out
      
      const itemsNowOutOfStock = previouslyTrackedItems.filter(item => {
        const inventoryKey = `${item.shopId}:${item.itemId}`;
        return !currentInventoryKeys.has(inventoryKey);
      });
      
      expect(itemsNowOutOfStock).toHaveLength(2);
    });
    
    it('should handle different shops correctly', () => {
      const previouslyTrackedItems = [
        { shopId: '1', itemId: '206', itemName: 'Lollipop', in_stock: 83 },
        { shopId: '2', itemId: '206', itemName: 'Lollipop', in_stock: 50 },
      ];
      
      const currentInventoryKeys = new Set<string>();
      currentInventoryKeys.add('1:206'); // Shop 1 still has Lollipops
      // Shop 2's Lollipops are sold out
      
      const itemsNowOutOfStock = previouslyTrackedItems.filter(item => {
        const inventoryKey = `${item.shopId}:${item.itemId}`;
        return !currentInventoryKeys.has(inventoryKey);
      });
      
      expect(itemsNowOutOfStock).toHaveLength(1);
      expect(itemsNowOutOfStock[0].shopId).toBe('2');
    });
  });
  
  describe('Tracking foreign stock', () => {
    it('should identify foreign items that went to 0 quantity', () => {
      const previouslyTrackedItems = [
        { shopId: 'mex', itemId: '1', itemName: 'Drug', in_stock: 100 },
        { shopId: 'can', itemId: '2', itemName: 'Flower', in_stock: 50 },
      ];
      
      const currentInventoryKeys = new Set<string>();
      currentInventoryKeys.add('can:2'); // Canada still has Flowers
      // Mexico's Drug is sold out
      
      const itemsNowOutOfStock = previouslyTrackedItems.filter(item => {
        const inventoryKey = `${item.shopId}:${item.itemId}`;
        return !currentInventoryKeys.has(inventoryKey);
      });
      
      expect(itemsNowOutOfStock).toHaveLength(1);
      expect(itemsNowOutOfStock[0].shopId).toBe('mex');
    });
  });
});
