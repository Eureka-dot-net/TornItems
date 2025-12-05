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

  const authenticateWithApiKey = useCallback(async (apiKey: string): Promise<boolean> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // First, fetch user info from Torn API
      const tornResponse = await fetch(
        `https://api.torn.com/v2/user/basic?striptags=true&key=${apiKey}`
      );

      if (!tornResponse.ok) {
        throw new Error('Failed to fetch user information from Torn API');
      }

      const tornData = await tornResponse.json();

      if (tornData.error) {
        throw new Error(tornData.error.error || 'Invalid API key');
      }

      const tornUserId = tornData.profile?.id;
      const tornUserName = tornData.profile?.name;

      if (!tornUserId) {
        throw new Error('Could not retrieve user ID from Torn API');
      }

      // Now authenticate with our API
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
      } else {
        throw new Error('User is not authorized for training recommendations');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Authentication failed';
      
      // Check if it's an axios error with response data
      const axiosError = err as { response?: { data?: { error?: string } } };
      const apiError = axiosError?.response?.data?.error;

      setAuthState({
        isAuthorized: false,
        isLoading: false,
        user: null,
        token: null,
        error: apiError || errorMessage,
      });

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

  return {
    ...authState,
    authenticateWithApiKey,
    verifyToken,
    logout,
  };
}
