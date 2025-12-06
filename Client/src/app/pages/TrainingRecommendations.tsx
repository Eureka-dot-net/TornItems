import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  TextField,
  Button,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { useTrainingAuth } from '../../lib/hooks/useTrainingAuth';

export default function TrainingRecommendations() {
  const {
    isAuthorized,
    user,
    verifyToken,
  } = useTrainingAuth();

  const [isVerifying, setIsVerifying] = useState(true);
  const [hasFilledWizard, setHasFilledWizard] = useState(false);
  const [averageIncomePerDay, setAverageIncomePerDay] = useState<string>(() => {
    const saved = localStorage.getItem('trainingRecommendations_averageIncomePerDay');
    return saved || '';
  });

  // Verify existing token on mount
  useEffect(() => {
    const verify = async () => {
      await verifyToken();
      setIsVerifying(false);
    };
    verify();
  }, [verifyToken]);

  // Check if user has filled wizard
  useEffect(() => {
    // Check if wizard data exists in localStorage
    const apiKey = localStorage.getItem('gymWizard_apiKey');
    const initialStats = localStorage.getItem('gymWizard_initialStats');
    
    if (apiKey || initialStats) {
      setHasFilledWizard(true);
    }
  }, []);

  // Save average income to localStorage
  useEffect(() => {
    localStorage.setItem('trainingRecommendations_averageIncomePerDay', averageIncomePerDay);
  }, [averageIncomePerDay]);

  const handleIncomeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    // Allow only numbers and a single decimal point
    if (value === '' || /^\d*(\.\d*)?$/.test(value)) {
      setAverageIncomePerDay(value);
    }
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

  // Authorized - show content
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

      {/* Check if wizard was filled */}
      {!hasFilledWizard && (
        <Alert 
          severity="info" 
          sx={{ mb: 3 }}
          action={
            <Button 
              component={RouterLink} 
              to="/gymWizard" 
              variant="outlined"
              size="small"
              startIcon={<AutoFixHighIcon />}
            >
              Fill Wizard
            </Button>
          }
        >
          <Typography variant="body1">
            <strong>Get Started:</strong> Please fill in the wizard for your current training setup to receive personalized recommendations.
          </Typography>
        </Alert>
      )}

      {/* Daily Income Input */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Daily Income Information
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Enter your average income per day to help us provide better recommendations.
        </Typography>
        <TextField
          label="Average Income Per Day"
          value={averageIncomePerDay}
          onChange={handleIncomeChange}
          fullWidth
          placeholder="e.g., 1000000"
          helperText="Enter your typical daily income from all sources (crimes, jobs, businesses, etc.)"
          sx={{ maxWidth: 400 }}
          InputProps={{
            startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
          }}
        />
      </Paper>

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
