import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useTrainingAuth } from '../../lib/hooks/useTrainingAuth';

export default function TrainingRecommendations() {
  const {
    isAuthorized,
    isLoading,
    user,
    error,
    authenticateWithApiKey,
    verifyToken,
    logout,
  } = useTrainingAuth();

  const [apiKey, setApiKey] = useState('');
  const [isVerifying, setIsVerifying] = useState(true);

  // Verify existing token on mount
  useEffect(() => {
    const verify = async () => {
      await verifyToken();
      setIsVerifying(false);
    };
    verify();
  }, [verifyToken]);

  const handleAuthenticate = async () => {
    if (!apiKey.trim()) return;
    await authenticateWithApiKey(apiKey);
  };

  const handleLogout = () => {
    logout();
    setApiKey('');
  };

  // Show loading while verifying existing token
  if (isVerifying) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Not authorized - show login form
  if (!isAuthorized) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Training Recommendations
        </Typography>

        <Paper sx={{ p: 4, maxWidth: 500, mx: 'auto', mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Authorization Required
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            This feature is only available to authorized users. Please enter
            your Torn API key to verify your access.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Torn API Key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Torn API key"
            sx={{ mb: 2 }}
            disabled={isLoading}
          />

          <Button
            variant="contained"
            fullWidth
            onClick={handleAuthenticate}
            disabled={isLoading || !apiKey.trim()}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Verify Access'}
          </Button>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 2 }}
          >
            Your API key is only used to verify your Torn user ID. It is not
            stored on our servers.
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Authorized - show the training recommendations content
  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="h4">Training Recommendations</Typography>
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Logged in as: {user.name}
            </Typography>
            <Button variant="outlined" size="small" onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        )}
      </Box>

      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom sx={{ color: 'primary.main' }}>
          🚀 Training Recommendations - Coming Soon!
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          We're working on personalized training recommendations to help you
          optimize your gym gains. Check back soon for exciting new features!
        </Typography>

        <Box sx={{ mt: 4, p: 3, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            This feature is currently under development. Stay tuned for updates!
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
