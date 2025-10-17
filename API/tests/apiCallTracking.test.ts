import { ApiCall } from '../src/models/ApiCall';
import { logApiCall, getApiCallCount, getApiCallStats } from '../src/utils/apiCallLogger';

describe('API Call Tracking', () => {
  describe('ApiCall Model', () => {
    it('should create an ApiCall entry', async () => {
      const apiCall = await ApiCall.create({
        endpoint: 'user/battlestats',
        timestamp: new Date(),
        source: 'tornApi',
      });

      expect(apiCall.endpoint).toBe('user/battlestats');
      expect(apiCall.source).toBe('tornApi');
      expect(apiCall.timestamp).toBeInstanceOf(Date);
      
      await ApiCall.deleteOne({ _id: apiCall._id });
    });

    it('should have timestamp index', async () => {
      const indexes = await ApiCall.collection.getIndexes();
      expect(indexes['timestamp_1']).toBeTruthy();
    });

    it('should have source index', async () => {
      const indexes = await ApiCall.collection.getIndexes();
      expect(indexes['source_1']).toBeTruthy();
    });
  });

  describe('logApiCall utility', () => {
    it('should log an API call', async () => {
      await logApiCall('user/travel', 'tornApi');

      const count = await ApiCall.countDocuments({
        endpoint: 'user/travel',
        source: 'tornApi',
      });

      expect(count).toBeGreaterThanOrEqual(1);
      
      // Clean up
      await ApiCall.deleteMany({ endpoint: 'user/travel', source: 'tornApi' });
    });

    it('should handle multiple API calls', async () => {
      await logApiCall('torn/items', 'backgroundFetcher');
      await logApiCall('torn/items', 'backgroundFetcher');
      await logApiCall('market/itemmarket', 'backgroundFetcher');

      const count = await ApiCall.countDocuments({
        source: 'backgroundFetcher',
      });

      expect(count).toBeGreaterThanOrEqual(3);
      
      // Clean up
      await ApiCall.deleteMany({ source: 'backgroundFetcher' });
    });
  });

  describe('getApiCallCount utility', () => {
    beforeEach(async () => {
      // Clean up before each test
      await ApiCall.deleteMany({});
    });

    it('should return 0 when no API calls exist', async () => {
      const count = await getApiCallCount(5);
      expect(count).toBe(0);
    });

    it('should count API calls in the last X minutes', async () => {
      const now = new Date();
      
      // Create API calls at different times
      await ApiCall.create({
        endpoint: 'user/battlestats',
        timestamp: new Date(now.getTime() - 2 * 60 * 1000), // 2 minutes ago
        source: 'tornApi',
      });
      
      await ApiCall.create({
        endpoint: 'user/travel',
        timestamp: new Date(now.getTime() - 4 * 60 * 1000), // 4 minutes ago
        source: 'tornApi',
      });
      
      await ApiCall.create({
        endpoint: 'torn/items',
        timestamp: new Date(now.getTime() - 10 * 60 * 1000), // 10 minutes ago
        source: 'backgroundFetcher',
      });

      // Count calls in last 5 minutes (should get 2)
      const count5 = await getApiCallCount(5);
      expect(count5).toBe(2);

      // Count calls in last 15 minutes (should get 3)
      const count15 = await getApiCallCount(15);
      expect(count15).toBe(3);
    });
  });

  describe('getApiCallStats utility', () => {
    beforeEach(async () => {
      // Clean up before each test
      await ApiCall.deleteMany({});
    });

    it('should return empty stats when no API calls exist', async () => {
      const stats = await getApiCallStats(5);
      
      expect(stats.total).toBe(0);
      expect(Object.keys(stats.bySource)).toHaveLength(0);
      expect(Object.keys(stats.byEndpoint)).toHaveLength(0);
    });

    it('should aggregate stats by source and endpoint', async () => {
      const now = new Date();
      
      // Create multiple API calls with different sources and endpoints
      await ApiCall.create([
        {
          endpoint: 'user/battlestats',
          timestamp: new Date(now.getTime() - 2 * 60 * 1000),
          source: 'tornApi',
        },
        {
          endpoint: 'user/battlestats',
          timestamp: new Date(now.getTime() - 3 * 60 * 1000),
          source: 'tornApi',
        },
        {
          endpoint: 'user/travel',
          timestamp: new Date(now.getTime() - 4 * 60 * 1000),
          source: 'tornApi',
        },
        {
          endpoint: 'torn/items',
          timestamp: new Date(now.getTime() - 1 * 60 * 1000),
          source: 'backgroundFetcher',
        },
        {
          endpoint: 'market/itemmarket',
          timestamp: new Date(now.getTime() - 2 * 60 * 1000),
          source: 'backgroundFetcher',
        },
        {
          endpoint: 'market/itemmarket',
          timestamp: new Date(now.getTime() - 3 * 60 * 1000),
          source: 'backgroundFetcher',
        },
      ]);

      const stats = await getApiCallStats(10);
      
      expect(stats.total).toBe(6);
      
      // Check by source
      expect(stats.bySource['tornApi']).toBe(3);
      expect(stats.bySource['backgroundFetcher']).toBe(3);
      
      // Check by endpoint
      expect(stats.byEndpoint['user/battlestats']).toBe(2);
      expect(stats.byEndpoint['user/travel']).toBe(1);
      expect(stats.byEndpoint['torn/items']).toBe(1);
      expect(stats.byEndpoint['market/itemmarket']).toBe(2);
    });

    it('should filter by time window correctly', async () => {
      const now = new Date();
      
      // Create API calls inside and outside the time window
      await ApiCall.create([
        {
          endpoint: 'user/battlestats',
          timestamp: new Date(now.getTime() - 2 * 60 * 1000), // Inside
          source: 'tornApi',
        },
        {
          endpoint: 'user/travel',
          timestamp: new Date(now.getTime() - 10 * 60 * 1000), // Outside for 5 min window
          source: 'tornApi',
        },
      ]);

      const stats5 = await getApiCallStats(5);
      expect(stats5.total).toBe(1);
      expect(stats5.byEndpoint['user/battlestats']).toBe(1);
      expect(stats5.byEndpoint['user/travel']).toBeUndefined();

      const stats15 = await getApiCallStats(15);
      expect(stats15.total).toBe(2);
      expect(stats15.byEndpoint['user/battlestats']).toBe(1);
      expect(stats15.byEndpoint['user/travel']).toBe(1);
    });
  });
});
