import { DiscordUser } from '../src/models/DiscordUser';
import { UserActivityCache } from '../src/models/UserActivityCache';
import { fetchMinMaxStatus } from '../src/utils/minmaxHelper';
import { encrypt } from '../src/utils/encryption';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock the logger and API call logger
jest.mock('../src/utils/logger', () => ({
  logInfo: jest.fn(),
  logError: jest.fn(),
  logWarn: jest.fn()
}));

jest.mock('../src/utils/apiCallLogger', () => ({
  logApiCall: jest.fn()
}));

describe('MinMax Helper - New Features', () => {
  const testDiscordId = 'test-discord-123';
  const testTornId = 3926388;
  const testApiKey = 'test-api-key-123';

  beforeEach(async () => {
    // Clear the database before each test
    await DiscordUser.deleteMany({});
    await UserActivityCache.deleteMany({});
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Clean up after all tests
    await DiscordUser.deleteMany({});
    await UserActivityCache.deleteMany({});
  });

  describe('Faction OC Detection', () => {
    it('should detect active faction OC when user is in slots', async () => {
      // Create user with full API key
      const user = new DiscordUser({
        discordId: testDiscordId,
        tornId: testTornId,
        name: 'TestUser',
        apiKey: encrypt(testApiKey),
        apiKeyType: 'full',
        level: 50
      });
      await user.save();

      // Mock API responses
      mockedAxios.get
        .mockResolvedValueOnce({
          data: {
            personalstats: {
              trading: { items: { bought: { shops: 50 } } },
              drugs: { xanax: 2 },
              other: { refills: { energy: 1 } }
            }
          }
        })
        .mockResolvedValueOnce({
          data: {
            personalstats: [
              { name: 'cityitemsbought', value: 0, timestamp: 0 },
              { name: 'xantaken', value: 0, timestamp: 0 },
              { name: 'refills', value: 0, timestamp: 0 }
            ]
          }
        })
        .mockResolvedValueOnce({
          data: {
            education: { current: null, complete: [] }
          }
        })
        .mockResolvedValueOnce({
          data: {
            money: { city_bank: null }
          }
        })
        .mockResolvedValueOnce({
          data: {
            virus: null
          }
        })
        .mockResolvedValueOnce({
          data: {
            organizedCrime: {
              id: 123456,
              name: 'Test OC',
              status: 'Planning',
              slots: [
                { user: { id: testTornId } },
                { user: { id: 9999999 } }
              ]
            }
          }
        });

      const status = await fetchMinMaxStatus(testDiscordId, undefined, true);

      expect(status.factionOC).toBeDefined();
      expect(status.factionOC?.active).toBe(true);
    });

    it('should detect inactive faction OC when user is not in slots', async () => {
      // Create user with full API key
      const user = new DiscordUser({
        discordId: testDiscordId,
        tornId: testTornId,
        name: 'TestUser',
        apiKey: encrypt(testApiKey),
        apiKeyType: 'full',
        level: 50
      });
      await user.save();

      // Mock API responses
      mockedAxios.get
        .mockResolvedValueOnce({
          data: {
            personalstats: {
              trading: { items: { bought: { shops: 50 } } },
              drugs: { xanax: 2 },
              other: { refills: { energy: 1 } }
            }
          }
        })
        .mockResolvedValueOnce({
          data: {
            personalstats: [
              { name: 'cityitemsbought', value: 0, timestamp: 0 },
              { name: 'xantaken', value: 0, timestamp: 0 },
              { name: 'refills', value: 0, timestamp: 0 }
            ]
          }
        })
        .mockResolvedValueOnce({
          data: {
            education: { current: null, complete: [] }
          }
        })
        .mockResolvedValueOnce({
          data: {
            money: { city_bank: null }
          }
        })
        .mockResolvedValueOnce({
          data: {
            virus: null
          }
        })
        .mockResolvedValueOnce({
          data: {
            organizedCrime: {
              id: 123456,
              name: 'Test OC',
              status: 'Planning',
              slots: [
                { user: { id: 9999998 } },
                { user: { id: 9999999 } }
              ]
            }
          }
        });

      const status = await fetchMinMaxStatus(testDiscordId, undefined, true);

      expect(status.factionOC).toBeDefined();
      expect(status.factionOC?.active).toBe(false);
    });
  });

  describe('Casino Tickets Detection', () => {
    it('should count casino tickets used today', async () => {
      // Create user with full API key
      const user = new DiscordUser({
        discordId: testDiscordId,
        tornId: testTornId,
        name: 'TestUser',
        apiKey: encrypt(testApiKey),
        apiKeyType: 'full',
        level: 50
      });
      await user.save();

      const now = new Date();
      const startOfDay = Math.floor(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
      ) / 1000);

      // Mock API responses
      mockedAxios.get
        .mockResolvedValueOnce({
          data: {
            personalstats: {
              trading: { items: { bought: { shops: 50 } } },
              drugs: { xanax: 2 },
              other: { refills: { energy: 1 } }
            }
          }
        })
        .mockResolvedValueOnce({
          data: {
            personalstats: [
              { name: 'cityitemsbought', value: 0, timestamp: 0 },
              { name: 'xantaken', value: 0, timestamp: 0 },
              { name: 'refills', value: 0, timestamp: 0 }
            ]
          }
        })
        .mockResolvedValueOnce({
          data: {
            education: { current: null, complete: [] }
          }
        })
        .mockResolvedValueOnce({
          data: {
            money: { city_bank: null }
          }
        })
        .mockResolvedValueOnce({
          data: {
            virus: null
          }
        })
        .mockResolvedValueOnce({
          data: {
            organizedCrime: null
          }
        })
        .mockResolvedValueOnce({
          data: {
            log: [
              {
                id: 'log1',
                timestamp: startOfDay + 3600,
                details: { id: 8340, title: 'Casino lottery bet', category: 'Casino' },
                data: { lottery: 'Daily Dime', cost: 100 },
                params: {}
              },
              {
                id: 'log2',
                timestamp: startOfDay + 7200,
                details: { id: 8340, title: 'Casino lottery bet', category: 'Casino' },
                data: { lottery: 'Daily Dime', cost: 100 },
                params: {}
              }
            ]
          }
        });

      const status = await fetchMinMaxStatus(testDiscordId, undefined, true);

      expect(status.casinoTickets).toBeDefined();
      expect(status.casinoTickets?.used).toBe(2);
      expect(status.casinoTickets?.target).toBe(75);
      expect(status.casinoTickets?.completed).toBe(false);
    });

    it('should mark casino tickets as completed when 75 used', async () => {
      // Create user with full API key
      const user = new DiscordUser({
        discordId: testDiscordId,
        tornId: testTornId,
        name: 'TestUser',
        apiKey: encrypt(testApiKey),
        apiKeyType: 'full',
        level: 50
      });
      await user.save();

      const now = new Date();
      const startOfDay = Math.floor(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
      ) / 1000);

      // Create 75 log entries
      const logEntries = Array.from({ length: 75 }, (_, i) => ({
        id: `log${i}`,
        timestamp: startOfDay + (i * 60),
        details: { id: 8340, title: 'Casino lottery bet', category: 'Casino' },
        data: { lottery: 'Daily Dime', cost: 100 },
        params: {}
      }));

      // Mock API responses
      mockedAxios.get
        .mockResolvedValueOnce({
          data: {
            personalstats: {
              trading: { items: { bought: { shops: 50 } } },
              drugs: { xanax: 2 },
              other: { refills: { energy: 1 } }
            }
          }
        })
        .mockResolvedValueOnce({
          data: {
            personalstats: [
              { name: 'cityitemsbought', value: 0, timestamp: 0 },
              { name: 'xantaken', value: 0, timestamp: 0 },
              { name: 'refills', value: 0, timestamp: 0 }
            ]
          }
        })
        .mockResolvedValueOnce({
          data: {
            education: { current: null, complete: [] }
          }
        })
        .mockResolvedValueOnce({
          data: {
            money: { city_bank: null }
          }
        })
        .mockResolvedValueOnce({
          data: {
            virus: null
          }
        })
        .mockResolvedValueOnce({
          data: {
            organizedCrime: null
          }
        })
        .mockResolvedValueOnce({
          data: {
            log: logEntries
          }
        });

      const status = await fetchMinMaxStatus(testDiscordId, undefined, true);

      expect(status.casinoTickets).toBeDefined();
      expect(status.casinoTickets?.used).toBe(75);
      expect(status.casinoTickets?.target).toBe(75);
      expect(status.casinoTickets?.completed).toBe(true);
    });

    it('should not fetch casino tickets for limited API key', async () => {
      // Create user with limited API key
      const user = new DiscordUser({
        discordId: testDiscordId,
        tornId: testTornId,
        name: 'TestUser',
        apiKey: encrypt(testApiKey),
        apiKeyType: 'limited',
        level: 50
      });
      await user.save();

      // Mock API responses (should not include casino tickets call)
      mockedAxios.get
        .mockResolvedValueOnce({
          data: {
            personalstats: {
              trading: { items: { bought: { shops: 50 } } },
              drugs: { xanax: 2 },
              other: { refills: { energy: 1 } }
            }
          }
        })
        .mockResolvedValueOnce({
          data: {
            personalstats: [
              { name: 'cityitemsbought', value: 0, timestamp: 0 },
              { name: 'xantaken', value: 0, timestamp: 0 },
              { name: 'refills', value: 0, timestamp: 0 }
            ]
          }
        })
        .mockResolvedValueOnce({
          data: {
            education: { current: null, complete: [] }
          }
        })
        .mockResolvedValueOnce({
          data: {
            money: { city_bank: null }
          }
        })
        .mockResolvedValueOnce({
          data: {
            virus: null
          }
        })
        .mockResolvedValueOnce({
          data: {
            organizedCrime: null
          }
        });

      const status = await fetchMinMaxStatus(testDiscordId, undefined, true);

      // Should not have casino tickets data for limited key
      expect(status.casinoTickets).toBeUndefined();
      expect(status.wheels).toBeUndefined();
    });
  });

  describe('Wheel Spins Detection', () => {
    it('should detect which wheels have been spun today', async () => {
      // Create user with full API key
      const user = new DiscordUser({
        discordId: testDiscordId,
        tornId: testTornId,
        name: 'TestUser',
        apiKey: encrypt(testApiKey),
        apiKeyType: 'full',
        level: 50
      });
      await user.save();

      const now = new Date();
      const startOfDay = Math.floor(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
      ) / 1000);

      // Mock API responses
      mockedAxios.get
        .mockResolvedValueOnce({
          data: {
            personalstats: {
              trading: { items: { bought: { shops: 50 } } },
              drugs: { xanax: 2 },
              other: { refills: { energy: 1 } }
            }
          }
        })
        .mockResolvedValueOnce({
          data: {
            personalstats: [
              { name: 'cityitemsbought', value: 0, timestamp: 0 },
              { name: 'xantaken', value: 0, timestamp: 0 },
              { name: 'refills', value: 0, timestamp: 0 }
            ]
          }
        })
        .mockResolvedValueOnce({
          data: {
            education: { current: null, complete: [] }
          }
        })
        .mockResolvedValueOnce({
          data: {
            money: { city_bank: null }
          }
        })
        .mockResolvedValueOnce({
          data: {
            virus: null
          }
        })
        .mockResolvedValueOnce({
          data: {
            organizedCrime: null
          }
        })
        .mockResolvedValueOnce({
          data: {
            log: []
          }
        })
        .mockResolvedValueOnce({
          data: {
            log: [
              {
                id: 'log1',
                timestamp: startOfDay + 3600,
                details: { id: 8375, title: 'Casino spin the wheel win points', category: 'Casino' },
                data: { wheel: 'the Wheel of Awesome', points: 5 },
                params: { color: 'green' }
              },
              {
                id: 'log2',
                timestamp: startOfDay + 7200,
                details: { id: 8375, title: 'Casino spin the wheel win points', category: 'Casino' },
                data: { wheel: 'the Wheel of Lame', points: 1 },
                params: { color: 'green' }
              }
            ]
          }
        });

      const status = await fetchMinMaxStatus(testDiscordId, undefined, true);

      expect(status.wheels).toBeDefined();
      expect(status.wheels?.lame.spun).toBe(true);
      expect(status.wheels?.mediocre.spun).toBe(false);
      expect(status.wheels?.awesomeness.spun).toBe(true);
    });
  });
});
