import request from 'supertest';
import { app } from '../src/app';
import { DiscordUser } from '../src/models/DiscordUser';
import { BattleStats } from '../src/models/BattleStats';
import { decrypt } from '../src/utils/encryption';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Set up test environment variables
const TEST_BOT_SECRET = 'test-bot-secret-12345';
process.env.BOT_SECRET = TEST_BOT_SECRET;

describe('Discord API Endpoints', () => {
  beforeEach(async () => {
    // Clear the database before each test
    await DiscordUser.deleteMany({});
    await BattleStats.deleteMany({});
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Clean up after all tests
    await DiscordUser.deleteMany({});
    await BattleStats.deleteMany({});
  });

  describe('POST /api/discord/minmax', () => {
    describe('Authentication', () => {
      it('should return 401 when Authorization header is missing', async () => {
        const response = await request(app)
          .post('/api/discord/minmax')
          .send({
            discordId: '123456789'
          });

        expect(response.status).toBe(401);
        expect(response.body.error).toContain('Authorization');
      });

      it('should return 401 when Bearer token is invalid', async () => {
        const response = await request(app)
          .post('/api/discord/minmax')
          .set('Authorization', 'Bearer invalid-token')
          .send({
            discordId: '123456789'
          });

        expect(response.status).toBe(401);
        expect(response.body.error).toContain('Invalid token');
      });
    });

    it('should return error when user has no API key', async () => {
      const response = await request(app)
        .post('/api/discord/minmax')
        .set('Authorization', `Bearer ${TEST_BOT_SECRET}`)
        .send({
          discordId: '123456789'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('set your API key');
    });

    it('should return daily task completion status for user', async () => {
      // First, create a user with API key
      const mockUserData = {
        profile: {
          id: 3926388,
          name: 'TestUser',
          level: 15,
          gender: 'Female',
          status: {
            description: 'Idle',
            details: null,
            state: 'Okay',
            color: 'green',
            until: null
          }
        }
      };

      const mockBattleStats = {
        battlestats: {
          strength: { value: 3308, modifier: -32 },
          defense: { value: 3245, modifier: -35 },
          speed: { value: 3203, modifier: -34 },
          dexterity: { value: 3204, modifier: -35 },
          total: 12960
        }
      };

      mockedAxios.get
        .mockResolvedValueOnce({ data: mockUserData })
        .mockResolvedValueOnce({ data: mockBattleStats });

      await request(app)
        .post('/api/discord/setkey')
        .set('Authorization', `Bearer ${TEST_BOT_SECRET}`)
        .send({
          discordId: '123456789',
          apiKey: 'test-api-key'
        });

      // Now mock the personal stats responses
      const mockCurrentStats = {
        personalstats: {
          trading: {
            items: {
              bought: {
                market: 636,
                shops: 250
              }
            }
          },
          drugs: {
            xanax: 40
          },
          other: {
            refills: {
              energy: 12
            }
          }
        }
      };

      const mockMidnightStats = {
        personalstats: {
          trading: {
            items: {
              bought: {
                market: 636,
                shops: 100
              }
            }
          },
          drugs: {
            xanax: 37
          },
          other: {
            refills: {
              energy: 11
            }
          }
        }
      };

      mockedAxios.get
        .mockResolvedValueOnce({ data: mockCurrentStats })
        .mockResolvedValueOnce({ data: mockMidnightStats });

      const response = await request(app)
        .post('/api/discord/minmax')
        .set('Authorization', `Bearer ${TEST_BOT_SECRET}`)
        .send({
          discordId: '123456789'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        userId: 3926388,
        cityItemsBought: {
          current: 150,
          target: 100,
          completed: true
        },
        xanaxTaken: {
          current: 3,
          target: 3,
          completed: true
        },
        energyRefill: {
          current: 1,
          target: 1,
          completed: true
        }
      });
    });

    it('should check other user status when userId is provided', async () => {
      // First, create a user with API key
      const mockUserData = {
        profile: {
          id: 3926388,
          name: 'TestUser',
          level: 15,
          gender: 'Female',
          status: {
            description: 'Idle',
            details: null,
            state: 'Okay',
            color: 'green',
            until: null
          }
        }
      };

      const mockBattleStats = {
        battlestats: {
          strength: { value: 3308, modifier: -32 },
          defense: { value: 3245, modifier: -35 },
          speed: { value: 3203, modifier: -34 },
          dexterity: { value: 3204, modifier: -35 },
          total: 12960
        }
      };

      mockedAxios.get
        .mockResolvedValueOnce({ data: mockUserData })
        .mockResolvedValueOnce({ data: mockBattleStats });

      await request(app)
        .post('/api/discord/setkey')
        .set('Authorization', `Bearer ${TEST_BOT_SECRET}`)
        .send({
          discordId: '123456789',
          apiKey: 'test-api-key'
        });

      // Now mock the personal stats responses for a different user
      const mockCurrentStats = {
        personalstats: {
          trading: {
            items: {
              bought: {
                market: 0,
                shops: 50
              }
            }
          },
          drugs: {
            xanax: 38
          },
          other: {
            refills: {
              energy: 11
            }
          }
        }
      };

      const mockMidnightStats = {
        personalstats: {
          trading: {
            items: {
              bought: {
                market: 0,
                shops: 0
              }
            }
          },
          drugs: {
            xanax: 37
          },
          other: {
            refills: {
              energy: 11
            }
          }
        }
      };

      mockedAxios.get
        .mockResolvedValueOnce({ data: mockCurrentStats })
        .mockResolvedValueOnce({ data: mockMidnightStats });

      const response = await request(app)
        .post('/api/discord/minmax')
        .set('Authorization', `Bearer ${TEST_BOT_SECRET}`)
        .send({
          discordId: '123456789',
          userId: 1234567
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        userId: 1234567,
        cityItemsBought: {
          current: 50,
          target: 100,
          completed: false
        },
        xanaxTaken: {
          current: 1,
          target: 3,
          completed: false
        },
        energyRefill: {
          current: 0,
          target: 1,
          completed: false
        }
      });
    });

    it('should return error when API call fails', async () => {
      // First, create a user with API key
      const mockUserData = {
        profile: {
          id: 3926388,
          name: 'TestUser',
          level: 15,
          gender: 'Female',
          status: {
            description: 'Idle',
            details: null,
            state: 'Okay',
            color: 'green',
            until: null
          }
        }
      };

      const mockBattleStats = {
        battlestats: {
          strength: { value: 3308, modifier: -32 },
          defense: { value: 3245, modifier: -35 },
          speed: { value: 3203, modifier: -34 },
          dexterity: { value: 3204, modifier: -35 },
          total: 12960
        }
      };

      mockedAxios.get
        .mockResolvedValueOnce({ data: mockUserData })
        .mockResolvedValueOnce({ data: mockBattleStats });

      await request(app)
        .post('/api/discord/setkey')
        .set('Authorization', `Bearer ${TEST_BOT_SECRET}`)
        .send({
          discordId: '123456789',
          apiKey: 'test-api-key'
        });

      // Mock API failure
      const axiosError = Object.assign(new Error('Request failed'), {
        isAxiosError: true,
        response: {
          status: 403,
          data: { error: 'Invalid API key' }
        }
      });

      mockedAxios.get.mockRejectedValueOnce(axiosError);

      const response = await request(app)
        .post('/api/discord/minmax')
        .set('Authorization', `Bearer ${TEST_BOT_SECRET}`)
        .send({
          discordId: '123456789'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Failed to fetch');
    });
  });

  describe('POST /api/discord/setkey', () => {
    describe('Authentication', () => {
      it('should return 401 when Authorization header is missing', async () => {
        const response = await request(app)
          .post('/api/discord/setkey')
          .send({
            discordId: '123456789',
            apiKey: 'test-api-key'
          });

        expect(response.status).toBe(401);
        expect(response.body.error).toContain('Authorization');
      });

      it('should return 401 when Authorization header has invalid format', async () => {
        const response = await request(app)
          .post('/api/discord/setkey')
          .set('Authorization', 'InvalidFormat')
          .send({
            discordId: '123456789',
            apiKey: 'test-api-key'
          });

        expect(response.status).toBe(401);
        expect(response.body.error).toContain('Invalid');
      });

      it('should return 401 when Bearer token is invalid', async () => {
        const response = await request(app)
          .post('/api/discord/setkey')
          .set('Authorization', 'Bearer invalid-token')
          .send({
            discordId: '123456789',
            apiKey: 'test-api-key'
          });

        expect(response.status).toBe(401);
        expect(response.body.error).toContain('Invalid token');
      });
    });

    it('should create a new Discord user with valid API key', async () => {
      const mockUserData = {
        profile: {
          id: 3926388,
          name: 'Muppett',
          level: 15,
          gender: 'Female',
          status: {
            description: 'Returning to Torn from Switzerland',
            details: null,
            state: 'Traveling',
            color: 'blue',
            until: null
          }
        }
      };

      const mockBattleStats = {
        battlestats: {
          strength: { value: 3308, modifier: -32 },
          defense: { value: 3245, modifier: -35 },
          speed: { value: 3203, modifier: -34 },
          dexterity: { value: 3204, modifier: -35 },
          total: 12960
        }
      };

      // Mock both API calls
      mockedAxios.get
        .mockResolvedValueOnce({ data: mockUserData })
        .mockResolvedValueOnce({ data: mockBattleStats });

      const response = await request(app)
        .post('/api/discord/setkey')
        .set('Authorization', `Bearer ${TEST_BOT_SECRET}`)
        .send({
          discordId: '123456789',
          apiKey: 'test-api-key'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        discordId: '123456789',
        tornId: 3926388,
        name: 'Muppett',
        level: 15
      });

      // Verify user was saved to database
      const savedUser = await DiscordUser.findOne({ discordId: '123456789' });
      expect(savedUser).toBeTruthy();
      expect(savedUser?.tornId).toBe(3926388);
      expect(savedUser?.name).toBe('Muppett');
      expect(savedUser?.level).toBe(15);

      // Verify API key is encrypted
      expect(savedUser?.apiKey).not.toBe('test-api-key');
      const decryptedKey = decrypt(savedUser!.apiKey);
      expect(decryptedKey).toBe('test-api-key');

      // Verify battle stats were saved
      const savedStats = await BattleStats.findOne({ tornId: 3926388 });
      expect(savedStats).toBeTruthy();
      expect(savedStats?.strength).toBe(3308);
      expect(savedStats?.defense).toBe(3245);
      expect(savedStats?.speed).toBe(3203);
      expect(savedStats?.dexterity).toBe(3204);
      expect(savedStats?.total).toBe(12960);
    });

    it('should update existing Discord user when called again', async () => {
      const mockUserData1 = {
        profile: {
          id: 3926388,
          name: 'Muppett',
          level: 15,
          gender: 'Female',
          status: {
            description: 'Idle',
            details: null,
            state: 'Okay',
            color: 'green',
            until: null
          }
        }
      };

      const mockUserData2 = {
        profile: {
          id: 3926388,
          name: 'Muppett',
          level: 16, // Level increased
          gender: 'Female',
          status: {
            description: 'Idle',
            details: null,
            state: 'Okay',
            color: 'green',
            until: null
          }
        }
      };

      const mockBattleStats = {
        battlestats: {
          strength: { value: 3308, modifier: -32 },
          defense: { value: 3245, modifier: -35 },
          speed: { value: 3203, modifier: -34 },
          dexterity: { value: 3204, modifier: -35 },
          total: 12960
        }
      };

      // First call
      mockedAxios.get
        .mockResolvedValueOnce({ data: mockUserData1 })
        .mockResolvedValueOnce({ data: mockBattleStats });

      await request(app)
        .post('/api/discord/setkey')
        .set('Authorization', `Bearer ${TEST_BOT_SECRET}`)
        .send({
          discordId: '123456789',
          apiKey: 'test-api-key-1'
        });

      // Second call with updated data
      mockedAxios.get
        .mockResolvedValueOnce({ data: mockUserData2 })
        .mockResolvedValueOnce({ data: mockBattleStats });

      const response = await request(app)
        .post('/api/discord/setkey')
        .set('Authorization', `Bearer ${TEST_BOT_SECRET}`)
        .send({
          discordId: '123456789',
          apiKey: 'test-api-key-2'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.level).toBe(16);

      // Verify only one user exists in database
      const users = await DiscordUser.find({ discordId: '123456789' });
      expect(users.length).toBe(1);
      expect(users[0].level).toBe(16);

      // Verify API key was updated
      const decryptedKey = decrypt(users[0].apiKey);
      expect(decryptedKey).toBe('test-api-key-2');
    });

    it('should return 400 error when API key is invalid', async () => {
      const axiosError = Object.assign(new Error('Request failed'), {
        isAxiosError: true,
        response: {
          status: 403,
          data: { error: 'Invalid API key' }
        }
      });
      
      mockedAxios.get.mockRejectedValueOnce(axiosError);

      const response = await request(app)
        .post('/api/discord/setkey')
        .set('Authorization', `Bearer ${TEST_BOT_SECRET}`)
        .send({
          discordId: '123456789',
          apiKey: 'invalid-key'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid API key');

      // Verify user was NOT saved
      const savedUser = await DiscordUser.findOne({ discordId: '123456789' });
      expect(savedUser).toBeNull();
    });

    it('should return 400 error when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/discord/setkey')
        .set('Authorization', `Bearer ${TEST_BOT_SECRET}`)
        .send({
          discordId: '123456789'
          // Missing apiKey
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    it('should return 400 error when API returns invalid response structure', async () => {
      // Mock API response with missing profile data
      const invalidResponse = {
        error: {
          code: 2,
          error: 'Incorrect ID'
        }
      };
      
      mockedAxios.get.mockResolvedValueOnce({ data: invalidResponse });

      const response = await request(app)
        .post('/api/discord/setkey')
        .set('Authorization', `Bearer ${TEST_BOT_SECRET}`)
        .send({
          discordId: '123456789',
          apiKey: 'test-api-key'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid API key');

      // Verify user was NOT saved
      const savedUser = await DiscordUser.findOne({ discordId: '123456789' });
      expect(savedUser).toBeNull();
    });

    it('should still save user even if battle stats fetch fails', async () => {
      const mockUserData = {
        profile: {
          id: 3926388,
          name: 'Muppett',
          level: 15,
          gender: 'Female',
          status: {
            description: 'Idle',
            details: null,
            state: 'Okay',
            color: 'green',
            until: null
          }
        }
      };

      const axiosError = Object.assign(new Error('Request failed'), {
        isAxiosError: true,
        response: {
          status: 500,
          data: { error: 'Server error' }
        }
      });

      // First call succeeds, second call (battle stats) fails
      mockedAxios.get
        .mockResolvedValueOnce({ data: mockUserData })
        .mockRejectedValueOnce(axiosError);

      const response = await request(app)
        .post('/api/discord/setkey')
        .set('Authorization', `Bearer ${TEST_BOT_SECRET}`)
        .send({
          discordId: '123456789',
          apiKey: 'test-api-key'
        });

      // Request should still succeed
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // User should be saved
      const savedUser = await DiscordUser.findOne({ discordId: '123456789' });
      expect(savedUser).toBeTruthy();

      // Battle stats should NOT be saved
      const savedStats = await BattleStats.findOne({ tornId: 3926388 });
      expect(savedStats).toBeNull();
    });
  });
});
