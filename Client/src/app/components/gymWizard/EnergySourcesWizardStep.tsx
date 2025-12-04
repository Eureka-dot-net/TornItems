import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch,
  Alert,
} from '@mui/material';
import { NumericTextField } from '../../../lib/components';
import { calculateDailyEnergy } from '../../../lib/utils/gymProgressionCalculator';

/**
 * EnergySourcesWizardStep Component
 * 
 * This wizard step helps users configure their energy sources in a simplified way.
 * Questions are phrased for basic users to understand easily.
 * 
 * @param mode - 'current' for current regime configuration, 'comparison' for comparison configuration
 */

export type WizardMode = 'current' | 'comparison';

interface EnergySourcesWizardStepProps {
  mode?: WizardMode;
}

export default function EnergySourcesWizardStep({ mode = 'current' }: EnergySourcesWizardStepProps) {
  const isComparison = mode === 'comparison';
  const storagePrefix = isComparison ? 'gymWizard_comparison_' : 'gymWizard_';
  // Load saved preferences from localStorage
  const loadSavedValue = <T,>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(`${storagePrefix}${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  // For comparison mode, also load current values as defaults
  const loadCurrentValue = <T,>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(`gymWizard_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [isSubscriber, setIsSubscriber] = useState<'yes' | 'no' | null>(() => 
    isComparison 
      ? loadSavedValue<'yes' | 'no' | null>('isSubscriber', loadCurrentValue('isSubscriber', null))
      : loadSavedValue<'yes' | 'no' | null>('isSubscriber', null)
  );
  const [hoursPlayedPerDay, setHoursPlayedPerDay] = useState<number>(() => 
    isComparison
      ? loadSavedValue('hoursPlayedPerDay', loadCurrentValue('hoursPlayedPerDay', 16))
      : loadSavedValue('hoursPlayedPerDay', 16)
  );
  const [daysSkippedPerMonth, setDaysSkippedPerMonth] = useState<number>(() => 
    isComparison
      ? loadSavedValue('daysSkippedPerMonth', loadCurrentValue('daysSkippedPerMonth', 0))
      : loadSavedValue('daysSkippedPerMonth', 0)
  );
  const [hasPointsRefill, setHasPointsRefill] = useState<boolean>(() => 
    isComparison
      ? loadSavedValue('hasPointsRefill', loadCurrentValue('hasPointsRefill', true))
      : loadSavedValue('hasPointsRefill', true)
  );
  const [pointsRefillDaysPerWeek, setPointsRefillDaysPerWeek] = useState<number>(() => 
    isComparison
      ? loadSavedValue('pointsRefillDaysPerWeek', loadCurrentValue('pointsRefillDaysPerWeek', 7))
      : loadSavedValue('pointsRefillDaysPerWeek', 7)
  );
  const [xanaxPerDay, setXanaxPerDay] = useState<number>(() => 
    isComparison
      ? loadSavedValue('xanaxPerDay', loadCurrentValue('xanaxPerDay', 3))
      : loadSavedValue('xanaxPerDay', 3)
  );

  // Calculate maxEnergy based on subscriber status
  const maxEnergy = isSubscriber === 'yes' ? 150 : 100;

  // Save values to localStorage
  useEffect(() => {
    localStorage.setItem(`${storagePrefix}isSubscriber`, JSON.stringify(isSubscriber));
  }, [isSubscriber, storagePrefix]);

  useEffect(() => {
    localStorage.setItem(`${storagePrefix}hoursPlayedPerDay`, JSON.stringify(hoursPlayedPerDay));
  }, [hoursPlayedPerDay, storagePrefix]);

  useEffect(() => {
    localStorage.setItem(`${storagePrefix}daysSkippedPerMonth`, JSON.stringify(daysSkippedPerMonth));
  }, [daysSkippedPerMonth, storagePrefix]);

  useEffect(() => {
    localStorage.setItem(`${storagePrefix}hasPointsRefill`, JSON.stringify(hasPointsRefill));
  }, [hasPointsRefill, storagePrefix]);

  useEffect(() => {
    localStorage.setItem(`${storagePrefix}pointsRefillDaysPerWeek`, JSON.stringify(pointsRefillDaysPerWeek));
  }, [pointsRefillDaysPerWeek, storagePrefix]);

  useEffect(() => {
    localStorage.setItem(`${storagePrefix}xanaxPerDay`, JSON.stringify(xanaxPerDay));
  }, [xanaxPerDay, storagePrefix]);

  useEffect(() => {
    localStorage.setItem(`${storagePrefix}maxEnergy`, JSON.stringify(maxEnergy));
  }, [maxEnergy, storagePrefix]);

  // Calculate daily energy for display
  const dailyEnergy = isSubscriber !== null 
    ? calculateDailyEnergy(hoursPlayedPerDay, xanaxPerDay, hasPointsRefill, 0, maxEnergy)
    : 0;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        {isComparison ? 'Configure Comparison Energy Sources' : 'Configure Your Energy Sources'}
      </Typography>
      
      <Typography variant="body1" paragraph>
        {isComparison 
          ? <>Configure the energy sources for your <strong>comparison scenario</strong>. 
              These settings will be compared against your current training regime to see how 
              changes would affect your gains.</>
          : <>Let's set up how much energy you have available for training each day. This helps us 
              calculate realistic gym gains based on your <strong>current training regime</strong>.</>
        }
      </Typography>

      <Alert severity={isComparison ? 'warning' : 'info'} sx={{ mb: 3 }}>
        <Typography variant="body2">
          {isComparison 
            ? <>These settings are for your <strong>comparison scenario</strong>. Adjust any values 
                you want to differ from your current regime to see the impact on your gains.</>
            : <>Note: We're asking about your <strong>current approach</strong> to training, not what you're 
                planning to do in the future. The simulator will help you compare different strategies later.</>
          }
        </Typography>
      </Alert>

      {/* Subscriber Question */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {isComparison 
            ? 'Would your comparison scenario use a subscriber account?'
            : 'Are you a Torn subscriber?'
          }
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
            label={isComparison 
              ? 'Yes, compare with subscriber benefits (150 energy bar)' 
              : "Yes, I'm a subscriber (150 energy bar)"
            }
          />
          <FormControlLabel 
            value="no" 
            control={<Radio />} 
            label={isComparison 
              ? 'No, compare without subscriber benefits (100 energy bar)' 
              : "No, I'm not a subscriber (100 energy bar)"
            }
          />
        </RadioGroup>
      </Box>

      {/* Show remaining questions only after subscriber choice */}
      {isSubscriber !== null && (
        <>
          {/* Hours per day */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {isComparison 
                ? 'How many hours would be played per day in this comparison?'
                : 'How many hours do you play Torn per day?'
              }
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              This doesn't need to be continuous - just roughly how many hours total you log in 
              throughout the day (between 1-24).
            </Typography>
            <NumericTextField
              value={hoursPlayedPerDay}
              onChange={(value) => setHoursPlayedPerDay(value)}
              fullWidth
              size="small"
              min={1}
              max={24}
              step={1}
              helperText="Enter a value between 1 and 24"
            />
          </Box>

          {/* Days skipped */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {isComparison 
                ? 'How many days per month would be skipped in this comparison?'
                : 'How many days per month do you skip training?'
              }
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              This could be due to faction wars, chains, or personal reasons. Enter 0 if you 
              train every day.
            </Typography>
            <NumericTextField
              value={daysSkippedPerMonth}
              onChange={(value) => setDaysSkippedPerMonth(value)}
              fullWidth
              size="small"
              min={0}
              max={30}
              step={1}
              helperText="Enter a value between 0 and 30"
            />
          </Box>

          {/* Points refill */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {isComparison 
                ? 'Would the comparison scenario use a daily points refill?'
                : 'Do you use a points refill daily?'
              }
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
              label={hasPointsRefill 
                ? (isComparison ? 'Yes, include daily points refill in comparison' : 'Yes, I use a daily points refill') 
                : (isComparison ? 'No, exclude points refills from comparison' : "No, I don't use points refills")
              }
            />
            
            {hasPointsRefill && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" paragraph>
                  How many days per week do you use points refill?
                </Typography>
                <NumericTextField
                  value={pointsRefillDaysPerWeek}
                  onChange={(value) => setPointsRefillDaysPerWeek(value)}
                  fullWidth
                  size="small"
                  min={1}
                  max={7}
                  step={1}
                  defaultValue={7}
                  helperText="Enter a value between 1 and 7 (default: 7 days/week)"
                />
              </Box>
            )}
          </Box>

          {/* Xanax per day */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {isComparison 
                ? 'How many Xanax would be used per day in this comparison?'
                : 'How many Xanax do you use per day?'
              }
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Each Xanax provides 250 additional energy (it doesn't refill your bar, but adds to it). 
              Enter 0 if you don't use Xanax for training. Decimals are allowed for averaging (e.g., 2.5 if you use 
              5 Xanax every 2 days).
            </Typography>
            <NumericTextField
              value={xanaxPerDay}
              onChange={(value) => setXanaxPerDay(value)}
              fullWidth
              size="small"
              min={0}
              helperText="Enter 0 or more (decimals allowed)"
            />
          </Box>

          {/* Summary */}
          <Alert severity="success" sx={{ mt: 3 }}>
            <Typography variant="body2" fontWeight="bold">
              {isComparison ? 'Comparison Daily Energy Summary' : 'Your Daily Energy Summary'}
            </Typography>
            <Typography variant="body2">
              Based on {isComparison ? 'these comparison' : 'your'} settings, you'll have approximately{' '}
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
