import request from 'supertest';
import { app } from '../src/app';
import { DiscordUser } from '../src/models/DiscordUser';
import { MinMaxSubscription } from '../src/models/MinMaxSubscription';
import { BattleStats } from '../src/models/BattleStats';
import { UserActivityCache } from '../src/models/UserActivityCache';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Set up test environment variables
const TEST_BOT_SECRET = 'test-bot-secret-12345';
process.env.BOT_SECRET = TEST_BOT_SECRET;

describe('Discord MinMax Subscription Endpoints', () => {
  beforeEach(async () => {
    // Clear the database before each test
    await DiscordUser.deleteMany({});
    await MinMaxSubscription.deleteMany({});
    await BattleStats.deleteMany({});
    await UserActivityCache.deleteMany({});
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Clean up after all tests
    await DiscordUser.deleteMany({});
    await MinMaxSubscription.deleteMany({});
    await BattleStats.deleteMany({});
    await UserActivityCache.deleteMany({});
  });

  describe('POST /api/discord/minmaxsub', () => {
    describe('Authentication', () => {
      it('should return 401 when Authorization header is missing', async () => {
        const response = await request(app)
          .post('/api/discord/minmaxsub')
          .send({
            discordId: '123456789',
            channelId: '987654321',
            hoursBeforeReset: 4
          });

        expect(response.status).toBe(401);
        expect(response.body.error).toContain('Authorization');
      });

      it('should return 401 when Bearer token is invalid', async () => {
        const response = await request(app)
          .post('/api/discord/minmaxsub')
          .set('Authorization', 'Bearer invalid-token')
          .send({
            discordId: '123456789',
            channelId: '987654321',
            hoursBeforeReset: 4
          });

        expect(response.status).toBe(401);
        expect(response.body.error).toContain('Invalid token');
      });
    });

    it('should return error when user has no API key', async () => {
      const response = await request(app)
        .post('/api/discord/minmaxsub')
        .set('Authorization', `Bearer ${TEST_BOT_SECRET}`)
        .send({
          discordId: '123456789',
          channelId: '987654321',
          hoursBeforeReset: 4
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('set your API key');
    });

    it('should return error when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/discord/minmaxsub')
        .set('Authorization', `Bearer ${TEST_BOT_SECRET}`)
        .send({
          discordId: '123456789'
          // Missing channelId and hoursBeforeReset
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    it('should return error when hoursBeforeReset is out of range', async () => {
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

      const response = await request(app)
        .post('/api/discord/minmaxsub')
        .set('Authorization', `Bearer ${TEST_BOT_SECRET}`)
        .send({
          discordId: '123456789',
          channelId: '987654321',
          hoursBeforeReset: 25 // Out of range
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('between 1 and 23');
    });

    it('should create a new minmax subscription', async () => {
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

      const response = await request(app)
        .post('/api/discord/minmaxsub')
        .set('Authorization', `Bearer ${TEST_BOT_SECRET}`)
        .send({
          discordId: '123456789',
          channelId: '987654321',
          hoursBeforeReset: 4,
          notifyEducation: true,
          notifyInvestment: false,
          notifyVirus: true
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        discordId: '123456789',
        channelId: '987654321',
        hoursBeforeReset: 4,
        notifyEducation: true,
        notifyInvestment: false,
        notifyVirus: true
      });

      // Verify subscription was saved to database
      const savedSubscription = await MinMaxSubscription.findOne({ discordUserId: '123456789' });
      expect(savedSubscription).toBeTruthy();
      expect(savedSubscription?.hoursBeforeReset).toBe(4);
      expect(savedSubscription?.notifyEducation).toBe(true);
      expect(savedSubscription?.notifyInvestment).toBe(false);
      expect(savedSubscription?.notifyVirus).toBe(true);
    });

    it('should update existing minmax subscription', async () => {
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

      // Create initial subscription
      await request(app)
        .post('/api/discord/minmaxsub')
        .set('Authorization', `Bearer ${TEST_BOT_SECRET}`)
        .send({
          discordId: '123456789',
          channelId: '987654321',
          hoursBeforeReset: 4
        });

      // Update subscription
      const response = await request(app)
        .post('/api/discord/minmaxsub')
        .set('Authorization', `Bearer ${TEST_BOT_SECRET}`)
        .send({
          discordId: '123456789',
          channelId: '111222333',
          hoursBeforeReset: 6,
          notifyEducation: false
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        discordId: '123456789',
        channelId: '111222333',
        hoursBeforeReset: 6,
        notifyEducation: false
      });

      // Verify only one subscription exists
      const subscriptions = await MinMaxSubscription.find({ discordUserId: '123456789' });
      expect(subscriptions.length).toBe(1);
      expect(subscriptions[0].hoursBeforeReset).toBe(6);
      expect(subscriptions[0].channelId).toBe('111222333');
    });

    it('should use default values for optional notification flags', async () => {
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

      const response = await request(app)
        .post('/api/discord/minmaxsub')
        .set('Authorization', `Bearer ${TEST_BOT_SECRET}`)
        .send({
          discordId: '123456789',
          channelId: '987654321',
          hoursBeforeReset: 4
          // No notification flags provided
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.notifyEducation).toBe(true);
      expect(response.body.data.notifyInvestment).toBe(true);
      expect(response.body.data.notifyVirus).toBe(true);
    });
  });

  describe('POST /api/discord/minmaxunsub', () => {
    describe('Authentication', () => {
      it('should return 401 when Authorization header is missing', async () => {
        const response = await request(app)
          .post('/api/discord/minmaxunsub')
          .send({
            discordId: '123456789'
          });

        expect(response.status).toBe(401);
        expect(response.body.error).toContain('Authorization');
      });

      it('should return 401 when Bearer token is invalid', async () => {
        const response = await request(app)
          .post('/api/discord/minmaxunsub')
          .set('Authorization', 'Bearer invalid-token')
          .send({
            discordId: '123456789'
          });

        expect(response.status).toBe(401);
        expect(response.body.error).toContain('Invalid token');
      });
    });

    it('should return error when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/discord/minmaxunsub')
        .set('Authorization', `Bearer ${TEST_BOT_SECRET}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    it('should return 404 when subscription does not exist', async () => {
      const response = await request(app)
        .post('/api/discord/minmaxunsub')
        .set('Authorization', `Bearer ${TEST_BOT_SECRET}`)
        .send({
          discordId: '123456789'
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('No minmax subscription');
    });

    it('should delete an existing subscription', async () => {
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

      // Create subscription
      await request(app)
        .post('/api/discord/minmaxsub')
        .set('Authorization', `Bearer ${TEST_BOT_SECRET}`)
        .send({
          discordId: '123456789',
          channelId: '987654321',
          hoursBeforeReset: 4
        });

      // Verify subscription exists
      let subscription = await MinMaxSubscription.findOne({ discordUserId: '123456789' });
      expect(subscription).toBeTruthy();

      // Delete subscription
      const response = await request(app)
        .post('/api/discord/minmaxunsub')
        .set('Authorization', `Bearer ${TEST_BOT_SECRET}`)
        .send({
          discordId: '123456789'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('removed');

      // Verify subscription no longer exists
      subscription = await MinMaxSubscription.findOne({ discordUserId: '123456789' });
      expect(subscription).toBeNull();
    });
  });
});
