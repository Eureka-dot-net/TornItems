import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Switch,
  Alert,
} from '@mui/material';
import { calculateDailyEnergy } from '../../../lib/utils/gymProgressionCalculator';

/**
 * EnergySourcesWizardStep Component
 * 
 * This wizard step helps users configure their energy sources in a simplified way.
 * Questions are phrased for basic users to understand easily.
 */

export default function EnergySourcesWizardStep() {
  // Load saved preferences from localStorage
  const loadSavedValue = <T,>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(`gymWizard_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [isSubscriber, setIsSubscriber] = useState<'yes' | 'no' | null>(() => 
    loadSavedValue<'yes' | 'no' | null>('isSubscriber', null)
  );
  const [hoursPlayedPerDay, setHoursPlayedPerDay] = useState<number>(() => 
    loadSavedValue('hoursPlayedPerDay', 16)
  );
  const [daysSkippedPerMonth, setDaysSkippedPerMonth] = useState<number>(() => 
    loadSavedValue('daysSkippedPerMonth', 0)
  );
  const [hasPointsRefill, setHasPointsRefill] = useState<boolean>(() => 
    loadSavedValue('hasPointsRefill', true)
  );
  const [xanaxPerDay, setXanaxPerDay] = useState<number>(() => 
    loadSavedValue('xanaxPerDay', 3)
  );

  // Calculate maxEnergy based on subscriber status
  const maxEnergy = isSubscriber === 'yes' ? 150 : 100;

  // Save values to localStorage
  useEffect(() => {
    localStorage.setItem('gymWizard_isSubscriber', JSON.stringify(isSubscriber));
  }, [isSubscriber]);

  useEffect(() => {
    localStorage.setItem('gymWizard_hoursPlayedPerDay', JSON.stringify(hoursPlayedPerDay));
  }, [hoursPlayedPerDay]);

  useEffect(() => {
    localStorage.setItem('gymWizard_daysSkippedPerMonth', JSON.stringify(daysSkippedPerMonth));
  }, [daysSkippedPerMonth]);

  useEffect(() => {
    localStorage.setItem('gymWizard_hasPointsRefill', JSON.stringify(hasPointsRefill));
  }, [hasPointsRefill]);

  useEffect(() => {
    localStorage.setItem('gymWizard_xanaxPerDay', JSON.stringify(xanaxPerDay));
  }, [xanaxPerDay]);

  useEffect(() => {
    localStorage.setItem('gymWizard_maxEnergy', JSON.stringify(maxEnergy));
  }, [maxEnergy]);

  // Calculate daily energy for display
  const dailyEnergy = isSubscriber !== null 
    ? calculateDailyEnergy(hoursPlayedPerDay, xanaxPerDay, hasPointsRefill, 0, maxEnergy)
    : 0;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Configure Your Energy Sources
      </Typography>
      
      <Typography variant="body1" paragraph>
        Let's set up how much energy you have available for training each day. This helps us 
        calculate realistic gym gains based on your playing style.
      </Typography>

      {/* Subscriber Question */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Are you a Torn subscriber?
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Subscribers have a 150 energy bar, while non-subscribers have 100.
        </Typography>
        <RadioGroup
          value={isSubscriber || ''}
          onChange={(e) => setIsSubscriber(e.target.value as 'yes' | 'no')}
        >
          <FormControlLabel 
            value="yes" 
            control={<Radio />} 
            label="Yes, I'm a subscriber (150 energy bar)" 
          />
          <FormControlLabel 
            value="no" 
            control={<Radio />} 
            label="No, I'm not a subscriber (100 energy bar)" 
          />
        </RadioGroup>
      </Box>

      {/* Show remaining questions only after subscriber choice */}
      {isSubscriber !== null && (
        <>
          {/* Hours per day */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              How many hours do you play Torn per day?
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              This doesn't need to be continuous - just roughly how many hours total you log in 
              throughout the day (between 1-24).
            </Typography>
            <TextField
              type="number"
              value={hoursPlayedPerDay}
              onChange={(e) => {
                const value = Number(e.target.value);
                setHoursPlayedPerDay(Math.max(1, Math.min(24, value)));
              }}
              fullWidth
              size="small"
              inputProps={{ min: 1, max: 24, step: 1 }}
              helperText="Enter a value between 1 and 24"
            />
          </Box>

          {/* Days skipped */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              How many days per month do you skip training?
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              This could be due to faction wars, chains, or personal reasons. Enter 0 if you 
              train every day.
            </Typography>
            <TextField
              type="number"
              value={daysSkippedPerMonth}
              onChange={(e) => {
                const value = Number(e.target.value);
                setDaysSkippedPerMonth(Math.max(0, Math.min(30, value)));
              }}
              fullWidth
              size="small"
              inputProps={{ min: 0, max: 30, step: 1 }}
              helperText="Enter a value between 0 and 30"
            />
          </Box>

          {/* Points refill */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Do you use a points refill daily?
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              A points refill instantly refills your energy bar once per day. This provides a 
              significant boost to your daily training capacity.
            </Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={hasPointsRefill}
                  onChange={(e) => setHasPointsRefill(e.target.checked)}
                />
              }
              label={hasPointsRefill ? 'Yes, I use a daily points refill' : 'No, I don\'t use points refills'}
            />
          </Box>

          {/* Xanax per day */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              How many Xanax do you use per day?
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Each Xanax provides 250 additional energy (it doesn't refill your bar, but adds to it). 
              Enter 0 if you don't use Xanax for training.
            </Typography>
            <TextField
              type="number"
              value={xanaxPerDay}
              onChange={(e) => {
                const value = Number(e.target.value);
                setXanaxPerDay(Math.max(0, value));
              }}
              fullWidth
              size="small"
              inputProps={{ min: 0, step: 1 }}
              helperText="Enter 0 or more"
            />
          </Box>

          {/* Summary */}
          <Alert severity="success" sx={{ mt: 3 }}>
            <Typography variant="body2" fontWeight="bold">
              Your Daily Energy Summary
            </Typography>
            <Typography variant="body2">
              Based on your settings, you'll have approximately{' '}
              <strong>{dailyEnergy.toLocaleString()} energy</strong> available for training each day.
            </Typography>
            {daysSkippedPerMonth > 0 && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                With {daysSkippedPerMonth} day(s) skipped per month, you'll train approximately{' '}
                <strong>{30 - daysSkippedPerMonth} days</strong> each month.
              </Typography>
            )}
          </Alert>
        </>
      )}
    </Box>
  );
}
