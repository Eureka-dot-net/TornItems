import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
} from '@mui/material';
import { validateNumericInput } from '../../../lib/utils/jumpHelpers';

/**
 * EdvdJumpWizardSubStep Component
 * 
 * This sub-step helps users configure their eDVD jump training.
 * It asks questions in an easy-to-understand format for basic users.
 * 
 * @param mode - 'current' for current regime configuration, 'comparison' for comparison configuration
 */

export type WizardMode = 'current' | 'comparison';

interface EdvdJumpWizardSubStepProps {
  mode?: WizardMode;
}

export default function EdvdJumpWizardSubStep({ mode = 'current' }: EdvdJumpWizardSubStepProps) {
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

  const [frequency, setFrequency] = useState<number>(() => 
    isComparison 
      ? loadSavedValue('edvdJumpFrequency', loadCurrentValue('edvdJumpFrequency', 7))
      : loadSavedValue('edvdJumpFrequency', 7)
  );
  const [dvds, setDvds] = useState<number>(() => 
    isComparison 
      ? loadSavedValue('edvdJumpDvds', loadCurrentValue('edvdJumpDvds', 1))
      : loadSavedValue('edvdJumpDvds', 1)
  );
  const [limit, setLimit] = useState<'indefinite' | 'count' | 'stat'>(() => 
    isComparison 
      ? loadSavedValue('edvdJumpLimit', loadCurrentValue('edvdJumpLimit', 'indefinite'))
      : loadSavedValue('edvdJumpLimit', 'indefinite')
  );
  const [count, setCount] = useState<number>(() => 
    isComparison 
      ? loadSavedValue('edvdJumpCount', loadCurrentValue('edvdJumpCount', 10))
      : loadSavedValue('edvdJumpCount', 10)
  );
  const [statTarget, setStatTarget] = useState<number>(() => 
    isComparison 
      ? loadSavedValue('edvdJumpStatTarget', loadCurrentValue('edvdJumpStatTarget', 1000000))
      : loadSavedValue('edvdJumpStatTarget', 1000000)
  );
  const [adultNovelties, setAdultNovelties] = useState<boolean>(() => 
    isComparison 
      ? loadSavedValue('edvdJumpAdultNovelties', loadCurrentValue('edvdJumpAdultNovelties', false))
      : loadSavedValue('edvdJumpAdultNovelties', false)
  );

  // Save values to localStorage
  useEffect(() => {
    localStorage.setItem(`${storagePrefix}edvdJumpEnabled`, JSON.stringify(true));
    localStorage.setItem(`${storagePrefix}edvdJumpFrequency`, JSON.stringify(frequency));
    localStorage.setItem(`${storagePrefix}edvdJumpDvds`, JSON.stringify(dvds));
    localStorage.setItem(`${storagePrefix}edvdJumpLimit`, JSON.stringify(limit));
    localStorage.setItem(`${storagePrefix}edvdJumpCount`, JSON.stringify(count));
    localStorage.setItem(`${storagePrefix}edvdJumpStatTarget`, JSON.stringify(statTarget));
    localStorage.setItem(`${storagePrefix}edvdJumpAdultNovelties`, JSON.stringify(adultNovelties));
  }, [frequency, dvds, limit, count, statTarget, adultNovelties, storagePrefix]);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        {isComparison ? 'Configure Comparison eDVD Jump Training' : 'Configure Your eDVD Jump Training'}
      </Typography>

      <Typography variant="body1" paragraph>
        {isComparison 
          ? <>Configure the eDVD jump settings for your <strong>comparison scenario</strong>. 
              Adjust these values to see how different eDVD strategies would affect your gains.</>
          : <>Educational DVDs (eDVDs) provide temporary stat boosts when used with Ecstasy.
              Let's configure how you use them in your training routine.</>
        }
      </Typography>

      <Alert severity={isComparison ? 'warning' : 'info'} sx={{ mb: 3 }}>
        <Typography variant="body2">
          {isComparison 
            ? <>These settings are for your <strong>comparison scenario</strong>. Modify them to 
                see how changes to your eDVD strategy would impact your training.</>
            : <><strong>What is an eDVD jump?</strong> Using Educational DVDs with Ecstasy gives you a temporary
                stat boost that lasts for several minutes. This allows you to train at higher gym levels and gain
                more stats per training session.</>
          }
        </Typography>
      </Alert>

      {/* Frequency */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          How often do you do eDVD jumps? (days between jumps)
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          For example, if you do eDVD jumps once per week, enter 7.
        </Typography>
        <TextField
          type="number"
          value={frequency}
          onChange={(e) => setFrequency(validateNumericInput(e.target.value, 7, 1))}
          fullWidth
          size="small"
          inputProps={{ step: 1, min: 1 }}
          helperText="Enter number of days between eDVD jump sessions"
        />
      </Box>

      {/* DVDs per session */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          How many eDVDs do you use per jump session?
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Each eDVD gives +10% to battle stats for 6 hours.
        </Typography>
        <TextField
          type="number"
          value={dvds}
          onChange={(e) => setDvds(validateNumericInput(e.target.value, 1, 0))}
          fullWidth
          size="small"
          inputProps={{ step: 1, min: 0 }}
          helperText="Enter number of eDVDs used per session"
        />
      </Box>

      {/* Jump Limit */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          How long do you plan to continue doing eDVD jumps?
        </Typography>
        <FormControl fullWidth>
          <InputLabel>Duration Plan</InputLabel>
          <Select
            value={limit}
            label="Duration Plan"
            onChange={(e) => setLimit(e.target.value as 'indefinite' | 'count' | 'stat')}
          >
            <MenuItem value="indefinite">
              Indefinitely - I'll keep doing them throughout my training
            </MenuItem>
            <MenuItem value="count">
              A specific number of times
            </MenuItem>
            <MenuItem value="stat">
              Until I reach a certain stat level
            </MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Conditional: Count */}
      {limit === 'count' && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            How many eDVD jump sessions will you do in total?
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Enter the total number of eDVD jump sessions you plan to complete.
          </Typography>
          <TextField
            type="number"
            value={count}
            onChange={(e) => setCount(validateNumericInput(e.target.value, 10, 1))}
            fullWidth
            size="small"
            inputProps={{ step: 1, min: 1 }}
            helperText="Enter total number of sessions"
          />
        </Box>
      )}

      {/* Conditional: Stat Target */}
      {limit === 'stat' && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            What is your target stat level? (individual stat)
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            For example, enter 1000000 if you want to stop when you reach 1M in all stats.
          </Typography>
          <TextField
            type="number"
            value={statTarget}
            onChange={(e) => setStatTarget(validateNumericInput(e.target.value, 1000000, 0))}
            fullWidth
            size="small"
            inputProps={{ step: 100000, min: 0 }}
            helperText="Enter target stat level"
          />
        </Box>
      )}

      {/* Adult Novelties */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Do you have access to 10★ Adult Novelties?
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Working at an Adult Novelties store doubles the happy from eDvDs.
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={adultNovelties}
              onChange={(e) => setAdultNovelties(e.target.checked)}
            />
          }
          label={adultNovelties ? 'Yes, I have 10★ Adult Novelties' : 'No, I don\'t have them'}
        />
      </Box>

      <Alert severity="success" sx={{ mt: 3 }}>
        <Typography variant="body2">
          {isComparison 
            ? 'Your comparison eDVD jump configuration has been saved. Click Next to continue.'
            : 'Your eDVD jump configuration has been saved. Click Next to continue.'
          }
        </Typography>
      </Alert>
    </Box>
  );
}
