import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Alert,
  Collapse,
} from '@mui/material';
import {
  DEFAULT_LOSS_REVIVE_NUMBER_PER_DAY,
  DEFAULT_LOSS_REVIVE_ENERGY_COST,
  DEFAULT_LOSS_REVIVE_DAYS_BETWEEN,
  DEFAULT_LOSS_REVIVE_PRICE,
  DAYS_PER_MONTH_ESTIMATE,
} from '../../../lib/constants/gymConstants';

/**
 * LossReviveWizardStep Component
 * 
 * This wizard step helps users configure selling losses/revivals in a simplified way.
 * Questions are phrased for basic users to understand easily.
 * 
 * @param mode - 'current' for current regime configuration, 'comparison' for comparison configuration
 */

export type WizardMode = 'current' | 'comparison';

interface LossReviveWizardStepProps {
  mode?: WizardMode;
}

export default function LossReviveWizardStep({ mode = 'current' }: LossReviveWizardStepProps) {
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

  // State for selling losses
  const [sellsLosses, setSellsLosses] = useState<'yes' | 'no' | null>(() => 
    isComparison 
      ? loadSavedValue<'yes' | 'no' | null>('sellsLosses', loadCurrentValue('sellsLosses', null))
      : loadSavedValue<'yes' | 'no' | null>('sellsLosses', null)
  );
  
  const [lossReviveNumberPerDay, setLossReviveNumberPerDay] = useState<number>(() => 
    isComparison
      ? loadSavedValue('lossReviveNumberPerDay', loadCurrentValue('lossReviveNumberPerDay', DEFAULT_LOSS_REVIVE_NUMBER_PER_DAY))
      : loadSavedValue('lossReviveNumberPerDay', DEFAULT_LOSS_REVIVE_NUMBER_PER_DAY)
  );
  
  const [lossReviveEnergyCost, setLossReviveEnergyCost] = useState<number>(() => 
    isComparison
      ? loadSavedValue('lossReviveEnergyCost', loadCurrentValue('lossReviveEnergyCost', DEFAULT_LOSS_REVIVE_ENERGY_COST))
      : loadSavedValue('lossReviveEnergyCost', DEFAULT_LOSS_REVIVE_ENERGY_COST)
  );
  
  const [lossReviveDaysBetween, setLossReviveDaysBetween] = useState<number>(() => 
    isComparison
      ? loadSavedValue('lossReviveDaysBetween', loadCurrentValue('lossReviveDaysBetween', DEFAULT_LOSS_REVIVE_DAYS_BETWEEN))
      : loadSavedValue('lossReviveDaysBetween', DEFAULT_LOSS_REVIVE_DAYS_BETWEEN)
  );
  
  const [lossRevivePricePerLoss, setLossRevivePricePerLoss] = useState<number>(() => 
    isComparison
      ? loadSavedValue('lossRevivePricePerLoss', loadCurrentValue('lossRevivePricePerLoss', DEFAULT_LOSS_REVIVE_PRICE))
      : loadSavedValue('lossRevivePricePerLoss', DEFAULT_LOSS_REVIVE_PRICE)
  );

  // Save values to localStorage
  useEffect(() => {
    localStorage.setItem(`${storagePrefix}sellsLosses`, JSON.stringify(sellsLosses));
    // Also save lossReviveEnabled for compatibility with GymComparison
    localStorage.setItem(`${storagePrefix}lossReviveEnabled`, JSON.stringify(sellsLosses === 'yes'));
  }, [sellsLosses, storagePrefix]);

  useEffect(() => {
    localStorage.setItem(`${storagePrefix}lossReviveNumberPerDay`, JSON.stringify(lossReviveNumberPerDay));
  }, [lossReviveNumberPerDay, storagePrefix]);

  useEffect(() => {
    localStorage.setItem(`${storagePrefix}lossReviveEnergyCost`, JSON.stringify(lossReviveEnergyCost));
  }, [lossReviveEnergyCost, storagePrefix]);

  useEffect(() => {
    localStorage.setItem(`${storagePrefix}lossReviveDaysBetween`, JSON.stringify(lossReviveDaysBetween));
  }, [lossReviveDaysBetween, storagePrefix]);

  useEffect(() => {
    localStorage.setItem(`${storagePrefix}lossRevivePricePerLoss`, JSON.stringify(lossRevivePricePerLoss));
  }, [lossRevivePricePerLoss, storagePrefix]);

  // Calculate estimated energy loss per month for display
  const sessionsPerMonth = sellsLosses === 'yes' ? Math.floor(DAYS_PER_MONTH_ESTIMATE / lossReviveDaysBetween) : 0;
  const totalEnergyLostPerMonth = sessionsPerMonth * lossReviveNumberPerDay * lossReviveEnergyCost;
  const totalIncomePerMonth = sessionsPerMonth * lossReviveNumberPerDay * lossRevivePricePerLoss;

  const formatCurrency = (value: number): string => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(1)}B`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        {isComparison ? 'Configure Comparison Loss/Revive Selling' : 'Configure Selling Losses/Revivals'}
      </Typography>
      
      <Typography variant="body1" paragraph>
        {isComparison 
          ? <>Configure selling losses/revivals for your <strong>comparison scenario</strong>. 
              These settings will be compared against your current training regime to see how 
              this income source affects your overall cost analysis.</>
          : <>Some players sell losses or revivals to earn income. This costs energy that could 
              otherwise be used for training. Let's configure whether you do this based on your 
              <strong> current approach</strong>.</>
        }
      </Typography>

      <Alert severity={isComparison ? 'warning' : 'info'} sx={{ mb: 3 }}>
        <Typography variant="body2">
          {isComparison 
            ? <>These settings are for your <strong>comparison scenario</strong>. Adjust these values 
                to see how adding or removing loss/revive selling would affect your gains and costs.</>
            : <>Note: Selling losses/revivals takes energy away from training. This is factored into 
                your stat gain calculations and can generate income when cost estimates are enabled.</>
          }
        </Typography>
      </Alert>

      {/* Question 1: Do you sell losses? */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {isComparison 
            ? 'Would your comparison scenario include selling losses/revivals?'
            : 'Do you currently sell losses/revivals?'
          }
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Selling losses or revivals means intentionally losing fights or reviving players for payment. 
          This uses energy that would otherwise be spent on gym training.
        </Typography>
        <RadioGroup
          value={sellsLosses || ''}
          onChange={(e) => setSellsLosses(e.target.value as 'yes' | 'no')}
        >
          <FormControlLabel 
            value="yes" 
            control={<Radio />} 
            label={isComparison 
              ? 'Yes, include loss/revive selling in comparison' 
              : 'Yes, I sell losses/revivals'
            }
          />
          <FormControlLabel 
            value="no" 
            control={<Radio />} 
            label={isComparison 
              ? 'No, exclude loss/revive selling from comparison' 
              : "No, I don't sell losses/revivals"
            }
          />
        </RadioGroup>
      </Box>

      {/* Show configuration options only if user sells losses */}
      <Collapse in={sellsLosses === 'yes'} timeout="auto">
        <>
          {/* Question 2: Number per day */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {isComparison 
                ? 'How many losses/revivals per session in this comparison?'
                : 'How many losses/revivals do you sell per session?'
              }
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              This is the number of losses or revivals you provide each time you sell them.
            </Typography>
            <TextField
              type="number"
              value={lossReviveNumberPerDay}
              onChange={(e) => {
                const value = Number(e.target.value);
                setLossReviveNumberPerDay(Math.max(1, value));
              }}
              fullWidth
              size="small"
              inputProps={{ min: 1, step: 1 }}
              helperText="Enter at least 1"
            />
          </Box>

          {/* Question 3: Energy cost */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {isComparison 
                ? 'How much energy per loss/revive in this comparison?'
                : 'How much energy does each loss/revive cost?'
              }
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              The energy spent per loss (for attacking/being attacked) or revive. Typically 25 energy for losses, 
              or less for revivals.
            </Typography>
            <TextField
              type="number"
              value={lossReviveEnergyCost}
              onChange={(e) => {
                const value = Number(e.target.value);
                setLossReviveEnergyCost(Math.max(1, value));
              }}
              fullWidth
              size="small"
              inputProps={{ min: 1, step: 1 }}
              helperText="Energy per loss/revive (typically 25 for losses)"
            />
          </Box>

          {/* Question 4: Days between */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {isComparison 
                ? 'How often would you sell in this comparison?'
                : 'How often do you sell losses/revivals?'
              }
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              How many days between each selling session. Enter 1 for daily, 7 for weekly, etc.
            </Typography>
            <TextField
              type="number"
              value={lossReviveDaysBetween}
              onChange={(e) => {
                const value = Number(e.target.value);
                setLossReviveDaysBetween(Math.max(1, value));
              }}
              fullWidth
              size="small"
              inputProps={{ min: 1, step: 1 }}
              helperText="Days between selling sessions (e.g., 7 for weekly)"
            />
          </Box>

          {/* Question 5: Price per loss/revive */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {isComparison 
                ? 'What price per loss/revive for this comparison?'
                : 'How much do you charge per loss/revive?'
              }
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              The amount you receive for each loss or revive you sell. This is used for income calculations 
              when cost estimates are enabled.
            </Typography>
            <TextField
              type="number"
              value={lossRevivePricePerLoss}
              onChange={(e) => {
                const value = Number(e.target.value);
                setLossRevivePricePerLoss(Math.max(0, value));
              }}
              fullWidth
              size="small"
              inputProps={{ min: 0, step: 1000000 }}
              helperText={`Enter price per loss/revive (current: ${formatCurrency(lossRevivePricePerLoss)})`}
            />
          </Box>

          {/* Summary */}
          <Alert severity="success" sx={{ mt: 3 }}>
            <Typography variant="body2" fontWeight="bold">
              {isComparison ? 'Comparison Loss/Revive Summary' : 'Your Loss/Revive Summary'}
            </Typography>
            <Typography variant="body2">
              Based on {isComparison ? 'these comparison' : 'your'} settings:
            </Typography>
            <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
              <li>
                <Typography variant="body2">
                  <strong>{sessionsPerMonth}</strong> selling sessions per month (every {lossReviveDaysBetween} day{lossReviveDaysBetween !== 1 ? 's' : ''})
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>{totalEnergyLostPerMonth.toLocaleString()}</strong> energy spent on losses/revivals per month
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>{formatCurrency(totalIncomePerMonth)}</strong> estimated income per month (when cost estimates enabled)
                </Typography>
              </li>
            </Box>
          </Alert>
        </>
      </Collapse>

      {sellsLosses === 'no' && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            {isComparison 
              ? "Your comparison scenario won't include loss/revive selling. All energy will be dedicated to gym training."
              : "All your energy will be dedicated to gym training. You can always add loss/revive selling later in the comparison phase if you want to see how it affects your gains."
            }
          </Typography>
        </Alert>
      )}
    </Box>
  );
}
