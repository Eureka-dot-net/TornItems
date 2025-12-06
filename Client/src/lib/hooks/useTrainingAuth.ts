import { useState, useCallback } from 'react';
import { agent } from '../api/agent';

interface TrainingUser {
  tornUserId: number;
  name: string;
}

interface TrainingAuthState {
  isAuthorized: boolean;
  isLoading: boolean;
  user: TrainingUser | null;
  token: string | null;
  error: string | null;
}

const TRAINING_TOKEN_KEY = 'trainingAuthToken';

export function useTrainingAuth() {
  const [authState, setAuthState] = useState<TrainingAuthState>(() => {
    // Check for existing token in localStorage
    const savedToken = localStorage.getItem(TRAINING_TOKEN_KEY);
    if (savedToken) {
      return {
        isAuthorized: true,
        isLoading: false,
        user: null,
        token: savedToken,
        error: null,
      };
    }
    return {
      isAuthorized: false,
      isLoading: false,
      user: null,
      token: null,
      error: null,
    };
  });

  /**
   * Authenticate user with their Torn user ID and name
   * This is called from GymComparison/Wizard when user fetches their stats
   */
  const authenticateWithUserInfo = useCallback(async (tornUserId: number, tornUserName: string): Promise<boolean> => {
    try {
      // Authenticate with our API
      const authResponse = await agent.post('/auth/training', {
        tornUserId,
        tornUserName,
      });

      if (authResponse.data.authorized) {
        const token = authResponse.data.token;
        localStorage.setItem(TRAINING_TOKEN_KEY, token);

        setAuthState({
          isAuthorized: true,
          isLoading: false,
          user: authResponse.data.user,
          token,
          error: null,
        });

        return true;
      }
      // User not authorized - don't set error, just return false
      return false;
    } catch (err) {
      // User not authorized or API error - silently fail but log for debugging
      console.debug('Training auth check failed (expected for non-authorized users):', err);
      return false;
    }
  }, []);

  const verifyToken = useCallback(async (): Promise<boolean> => {
    const token = localStorage.getItem(TRAINING_TOKEN_KEY);
    if (!token) {
      setAuthState({
        isAuthorized: false,
        isLoading: false,
        user: null,
        token: null,
        error: null,
      });
      return false;
    }

    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await agent.get('/auth/training/verify', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.valid) {
        setAuthState({
          isAuthorized: true,
          isLoading: false,
          user: response.data.user,
          token,
          error: null,
        });
        return true;
      } else {
        throw new Error('Token is no longer valid');
      }
    } catch {
      // Token is invalid, clear it
      localStorage.removeItem(TRAINING_TOKEN_KEY);
      setAuthState({
        isAuthorized: false,
        isLoading: false,
        user: null,
        token: null,
        error: null,
      });
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TRAINING_TOKEN_KEY);
    setAuthState({
      isAuthorized: false,
      isLoading: false,
      user: null,
      token: null,
      error: null,
    });
  }, []);

  /**
   * Check if user is authorized (from localStorage)
   */
  const isAuthorizedFromStorage = useCallback((): boolean => {
    return !!localStorage.getItem(TRAINING_TOKEN_KEY);
  }, []);

  return {
    ...authState,
    authenticateWithUserInfo,
    verifyToken,
    logout,
    isAuthorizedFromStorage,
  };
}
