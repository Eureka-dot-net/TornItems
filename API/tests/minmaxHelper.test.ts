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

  describe('Skimmers Detection', () => {
    it('should detect active skimmers and mark as completed when >= 20', async () => {
      // Create user
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
            organizedCrime: null
          }
        })
        .mockResolvedValueOnce({
          data: {
            crimes: {
              miscellaneous: {
                skimmers: {
                  active: 20,
                  most_lucrative: 257,
                  oldest_recovered: 1799909,
                  lost: 14
                }
              }
            }
          }
        });

      const status = await fetchMinMaxStatus(testDiscordId, undefined, true);

      expect(status.skimmers).toBeDefined();
      expect(status.skimmers?.active).toBe(20);
      expect(status.skimmers?.target).toBe(20);
      expect(status.skimmers?.completed).toBe(true);
    });

    it('should detect active skimmers and mark as incomplete when < 20', async () => {
      // Create user
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
            organizedCrime: null
          }
        })
        .mockResolvedValueOnce({
          data: {
            crimes: {
              miscellaneous: {
                skimmers: {
                  active: 15,
                  most_lucrative: 257,
                  oldest_recovered: 1799909,
                  lost: 14
                }
              }
            }
          }
        });

      const status = await fetchMinMaxStatus(testDiscordId, undefined, true);

      expect(status.skimmers).toBeDefined();
      expect(status.skimmers?.active).toBe(15);
      expect(status.skimmers?.target).toBe(20);
      expect(status.skimmers?.completed).toBe(false);
    });
  });

  describe('Energy Refill Display Limit', () => {
    it('should limit energy refill display to max of 1 even when 2 refills done', async () => {
      // Create user
      const user = new DiscordUser({
        discordId: testDiscordId,
        tornId: testTornId,
        name: 'TestUser',
        apiKey: encrypt(testApiKey),
        apiKeyType: 'full',
        level: 50
      });
      await user.save();

      // Mock API responses with 2 refills
      mockedAxios.get
        .mockResolvedValueOnce({
          data: {
            personalstats: {
              trading: { items: { bought: { shops: 100 } } },
              drugs: { xanax: 3 },
              other: { refills: { energy: 2 } } // User did 2 refills
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
        });

      const status = await fetchMinMaxStatus(testDiscordId, undefined, false);

      expect(status.energyRefill).toBeDefined();
      expect(status.energyRefill.current).toBe(1); // Should be limited to 1, not 2
      expect(status.energyRefill.target).toBe(1);
      expect(status.energyRefill.completed).toBe(true);
    });

    it('should show 0/1 when no refills done', async () => {
      // Create user
      const user = new DiscordUser({
        discordId: testDiscordId,
        tornId: testTornId,
        name: 'TestUser',
        apiKey: encrypt(testApiKey),
        apiKeyType: 'full',
        level: 50
      });
      await user.save();

      // Mock API responses with 0 refills
      mockedAxios.get
        .mockResolvedValueOnce({
          data: {
            personalstats: {
              trading: { items: { bought: { shops: 100 } } },
              drugs: { xanax: 3 },
              other: { refills: { energy: 0 } } // No refills
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
        });

      const status = await fetchMinMaxStatus(testDiscordId, undefined, false);

      expect(status.energyRefill).toBeDefined();
      expect(status.energyRefill.current).toBe(0);
      expect(status.energyRefill.target).toBe(1);
      expect(status.energyRefill.completed).toBe(false);
    });

    it('should show 1/1 when exactly 1 refill done', async () => {
      // Create user
      const user = new DiscordUser({
        discordId: testDiscordId,
        tornId: testTornId,
        name: 'TestUser',
        apiKey: encrypt(testApiKey),
        apiKeyType: 'full',
        level: 50
      });
      await user.save();

      // Mock API responses with 1 refill
      mockedAxios.get
        .mockResolvedValueOnce({
          data: {
            personalstats: {
              trading: { items: { bought: { shops: 100 } } },
              drugs: { xanax: 3 },
              other: { refills: { energy: 1 } } // 1 refill
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
        });

      const status = await fetchMinMaxStatus(testDiscordId, undefined, false);

      expect(status.energyRefill).toBeDefined();
      expect(status.energyRefill.current).toBe(1);
      expect(status.energyRefill.target).toBe(1);
      expect(status.energyRefill.completed).toBe(true);
    });
  });
});
