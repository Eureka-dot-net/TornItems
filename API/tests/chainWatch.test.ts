import { DiscordUser } from '../src/models/DiscordUser';
import { ChainWatch } from '../src/models/ChainWatch';
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

// Mock discord utilities
jest.mock('../src/utils/discord', () => ({
  sendDiscordChannelAlert: jest.fn()
}));

describe('Chain Watch', () => {
  const testDiscordId = 'test-discord-chain-123';
  const testTornId = 3926388;
  const testFactionId = 48443;
  const testApiKey = 'test-api-key-chain-123';

  beforeEach(async () => {
    // Clear the database before each test
    await DiscordUser.deleteMany({});
    await ChainWatch.deleteMany({});
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Clean up after all tests
    await DiscordUser.deleteMany({});
    await ChainWatch.deleteMany({});
  });

  describe('ChainWatch Model', () => {
    it('should create a chain watch with required fields', async () => {
      const chainWatch = new ChainWatch({
        discordId: testDiscordId,
        channelId: 'test-channel-123',
        secondsBeforeFail: 120,
        factionId: testFactionId,
        enabled: true
      });

      await chainWatch.save();

      const savedWatch = await ChainWatch.findOne({ discordId: testDiscordId });
      expect(savedWatch).toBeDefined();
      expect(savedWatch?.discordId).toBe(testDiscordId);
      expect(savedWatch?.channelId).toBe('test-channel-123');
      expect(savedWatch?.secondsBeforeFail).toBe(120);
      expect(savedWatch?.factionId).toBe(testFactionId);
      expect(savedWatch?.enabled).toBe(true);
    });

    it('should store notification tracking fields', async () => {
      const chainWatch = new ChainWatch({
        discordId: testDiscordId,
        channelId: 'test-channel-123',
        secondsBeforeFail: 120,
        factionId: testFactionId,
        enabled: true,
        lastNotificationTimestamp: Date.now(),
        lastNotificationChainCurrent: 42
      });

      await chainWatch.save();

      const savedWatch = await ChainWatch.findOne({ discordId: testDiscordId });
      expect(savedWatch).toBeDefined();
      expect(savedWatch?.lastNotificationTimestamp).toBeDefined();
      expect(savedWatch?.lastNotificationChainCurrent).toBe(42);
    });

    it('should store lastUsedKeyIndex field', async () => {
      const chainWatch = new ChainWatch({
        discordId: testDiscordId,
        channelId: 'test-channel-123',
        secondsBeforeFail: 120,
        factionId: testFactionId,
        enabled: true,
        lastUsedKeyIndex: 1
      });

      await chainWatch.save();

      const savedWatch = await ChainWatch.findOne({ discordId: testDiscordId });
      expect(savedWatch).toBeDefined();
      expect(savedWatch?.lastUsedKeyIndex).toBe(1);
    });

    it('should not allow negative secondsBeforeFail', async () => {
      const chainWatch = new ChainWatch({
        discordId: testDiscordId,
        channelId: 'test-channel-123',
        secondsBeforeFail: -10,
        factionId: testFactionId,
        enabled: true
      });

      await expect(chainWatch.save()).rejects.toThrow();
    });

    it('should update existing chain watch', async () => {
      // Create initial watch
      const chainWatch = new ChainWatch({
        discordId: testDiscordId,
        channelId: 'test-channel-123',
        secondsBeforeFail: 120,
        factionId: testFactionId,
        enabled: true
      });
      await chainWatch.save();

      // Update the watch
      chainWatch.secondsBeforeFail = 180;
      chainWatch.enabled = false;
      await chainWatch.save();

      const updatedWatch = await ChainWatch.findOne({ discordId: testDiscordId });
      expect(updatedWatch?.secondsBeforeFail).toBe(180);
      expect(updatedWatch?.enabled).toBe(false);
    });
  });

  describe('DiscordUser Model - factionId', () => {
    it('should store factionId on DiscordUser', async () => {
      const user = new DiscordUser({
        discordId: testDiscordId,
        tornId: testTornId,
        name: 'TestUser',
        apiKey: encrypt(testApiKey),
        apiKeyType: 'full',
        level: 50,
        factionId: testFactionId
      });

      await user.save();

      const savedUser = await DiscordUser.findOne({ discordId: testDiscordId });
      expect(savedUser).toBeDefined();
      expect(savedUser?.factionId).toBe(testFactionId);
    });

    it('should allow factionId to be optional', async () => {
      const user = new DiscordUser({
        discordId: testDiscordId,
        tornId: testTornId,
        name: 'TestUser',
        apiKey: encrypt(testApiKey),
        apiKeyType: 'full',
        level: 50
      });

      await user.save();

      const savedUser = await DiscordUser.findOne({ discordId: testDiscordId });
      expect(savedUser).toBeDefined();
      expect(savedUser?.factionId).toBeUndefined();
    });
  });

  describe('Chain Watch Service Integration', () => {
    it('should group users by faction for API efficiency', async () => {
      // Create multiple users in same faction
      const user1 = new DiscordUser({
        discordId: 'user1',
        tornId: 1001,
        name: 'User1',
        apiKey: encrypt('key1'),
        apiKeyType: 'full',
        level: 50,
        factionId: testFactionId
      });
      const user2 = new DiscordUser({
        discordId: 'user2',
        tornId: 1002,
        name: 'User2',
        apiKey: encrypt('key2'),
        apiKeyType: 'full',
        level: 50,
        factionId: testFactionId
      });
      await user1.save();
      await user2.save();

      // Create chain watches for both users
      const watch1 = new ChainWatch({
        discordId: 'user1',
        channelId: 'channel1',
        secondsBeforeFail: 120,
        factionId: testFactionId,
        enabled: true
      });
      const watch2 = new ChainWatch({
        discordId: 'user2',
        channelId: 'channel2',
        secondsBeforeFail: 180,
        factionId: testFactionId,
        enabled: true
      });
      await watch1.save();
      await watch2.save();

      // Verify both watches exist
      const watches = await ChainWatch.find({ factionId: testFactionId, enabled: true });
      expect(watches).toHaveLength(2);
      expect(watches.map(w => w.discordId).sort()).toEqual(['user1', 'user2']);
    });
  });
});
