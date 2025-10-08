import axios from 'axios';
import { fetchTravelStatus } from '../src/utils/tornApi';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock logger to avoid console spam
jest.mock('../src/utils/logger', () => ({
  logInfo: jest.fn(),
  logError: jest.fn()
}));

describe('Torn API Functions', () => {
  describe('fetchTravelStatus', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should return travel status when user is traveling', async () => {
      const mockTravelData = {
        travel: {
          destination: 'Mexico',
          method: 'Airstrip',
          departed_at: 1759912083,
          arrival_at: 1759913103,
          time_left: 916
        }
      };

      mockedAxios.get.mockResolvedValue({ data: mockTravelData });

      const result = await fetchTravelStatus('test-api-key');

      expect(result).toEqual(mockTravelData.travel);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.torn.com/v2/user/travel?key=test-api-key'
      );
    });

    it('should return null when user is not traveling', async () => {
      const mockData = {};

      mockedAxios.get.mockResolvedValue({ data: mockData });

      const result = await fetchTravelStatus('test-api-key');

      expect(result).toBeNull();
    });

    it('should return null when API call fails', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      const result = await fetchTravelStatus('test-api-key');

      expect(result).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      const mockError = {
        response: {
          status: 403,
          data: { error: 'Invalid API key' }
        }
      };

      mockedAxios.get.mockRejectedValue(mockError);

      const result = await fetchTravelStatus('invalid-key');

      expect(result).toBeNull();
    });
  });
});
