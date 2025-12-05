import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
} from '@mui/material';
import { useTrainingAuth } from '../../lib/hooks/useTrainingAuth';

export default function TrainingRecommendations() {
  const {
    isAuthorized,
    user,
    verifyToken,
  } = useTrainingAuth();

  const [isVerifying, setIsVerifying] = useState(true);

  // Verify existing token on mount
  useEffect(() => {
    const verify = async () => {
      await verifyToken();
      setIsVerifying(false);
    };
    verify();
  }, [verifyToken]);

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

  // Not authorized - show simple message
  if (!isAuthorized) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Training Recommendations
        </Typography>

        <Paper sx={{ p: 4, textAlign: 'center', mt: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ color: 'warning.main' }}>
            🔒 Access Restricted
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
            This feature is only available to authorized users.
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            If you believe you should have access, please enter your Torn API key
            on the Gym Comparison or Gym Wizard page to authenticate.
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Authorized - show under construction content
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
          <Typography variant="body2" color="text.secondary">
            Welcome, {user.name}!
          </Typography>
        )}
      </Box>

      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h5" gutterBottom sx={{ color: 'primary.main' }}>
          🚧 Under Construction
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
