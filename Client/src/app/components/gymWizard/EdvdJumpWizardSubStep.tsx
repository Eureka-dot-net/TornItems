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
 */

export default function EdvdJumpWizardSubStep() {
  // Load saved preferences from localStorage
  const loadSavedValue = <T,>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(`gymWizard_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [frequency, setFrequency] = useState<number>(() => loadSavedValue('edvdJumpFrequency', 7));
  const [dvds, setDvds] = useState<number>(() => loadSavedValue('edvdJumpDvds', 1));
  const [limit, setLimit] = useState<'indefinite' | 'count' | 'stat'>(() => 
    loadSavedValue('edvdJumpLimit', 'indefinite')
  );
  const [count, setCount] = useState<number>(() => loadSavedValue('edvdJumpCount', 10));
  const [statTarget, setStatTarget] = useState<number>(() => loadSavedValue('edvdJumpStatTarget', 1000000));
  const [adultNovelties, setAdultNovelties] = useState<boolean>(() => 
    loadSavedValue('edvdJumpAdultNovelties', false)
  );

  // Save values to localStorage
  useEffect(() => {
    localStorage.setItem('gymWizard_edvdJumpEnabled', JSON.stringify(true));
    localStorage.setItem('gymWizard_edvdJumpFrequency', JSON.stringify(frequency));
    localStorage.setItem('gymWizard_edvdJumpDvds', JSON.stringify(dvds));
    localStorage.setItem('gymWizard_edvdJumpLimit', JSON.stringify(limit));
    localStorage.setItem('gymWizard_edvdJumpCount', JSON.stringify(count));
    localStorage.setItem('gymWizard_edvdJumpStatTarget', JSON.stringify(statTarget));
    localStorage.setItem('gymWizard_edvdJumpAdultNovelties', JSON.stringify(adultNovelties));
  }, [frequency, dvds, limit, count, statTarget, adultNovelties]);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Configure Your eDVD Jump Training
      </Typography>

      <Typography variant="body1" paragraph>
        Educational DVDs (eDVDs) provide temporary stat boosts when used with Ecstasy.
        Let's configure how you use them in your training routine.
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>What is an eDVD jump?</strong> Using Educational DVDs with Ecstasy gives you a temporary
          stat boost that lasts for several minutes. This allows you to train at higher gym levels and gain
          more stats per training session.
        </Typography>
      </Alert>

      <TextField
        label="How often do you do eDVD jumps? (days between jumps)"
        type="number"
        value={frequency}
        onChange={(e) => setFrequency(validateNumericInput(e.target.value, 7, 1))}
        fullWidth
        margin="normal"
        helperText="For example, if you do eDVD jumps once per week, enter 7"
        inputProps={{ step: 1, min: 1 }}
      />

      <TextField
        label="How many eDVDs do you use per jump session?"
        type="number"
        value={dvds}
        onChange={(e) => setDvds(validateNumericInput(e.target.value, 1, 0))}
        fullWidth
        margin="normal"
        helperText="Each eDVD gives +10% to battle stats for 6 hours"
        inputProps={{ step: 1, min: 0 }}
      />

      <FormControl fullWidth margin="normal">
        <InputLabel>How long do you plan to continue doing eDVD jumps?</InputLabel>
        <Select
          value={limit}
          label="How long do you plan to continue doing eDVD jumps?"
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

      {limit === 'count' && (
        <TextField
          label="How many eDVD jump sessions will you do in total?"
          type="number"
          value={count}
          onChange={(e) => setCount(validateNumericInput(e.target.value, 10, 1))}
          fullWidth
          margin="normal"
          helperText="Enter the total number of eDVD jump sessions you plan to complete"
          inputProps={{ step: 1, min: 1 }}
        />
      )}

      {limit === 'stat' && (
        <TextField
          label="What is your target stat level? (individual stat)"
          type="number"
          value={statTarget}
          onChange={(e) => setStatTarget(validateNumericInput(e.target.value, 1000000, 0))}
          fullWidth
          margin="normal"
          helperText="For example, enter 1000000 if you want to stop when you reach 1M in any stat"
          inputProps={{ step: 100000, min: 0 }}
        />
      )}

      <FormControlLabel
        control={
          <Switch
            checked={adultNovelties}
            onChange={(e) => setAdultNovelties(e.target.checked)}
          />
        }
        label={
          <Box>
            <Typography variant="body1">
              I have access to 10★ Adult Novelties
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Adult Novelties provide an additional stat boost when equipped
            </Typography>
          </Box>
        }
        sx={{ mt: 2 }}
      />

      <Alert severity="success" sx={{ mt: 3 }}>
        <Typography variant="body2">
          Your eDVD jump configuration has been saved. Click Next to continue.
        </Typography>
      </Alert>
    </Box>
  );
}
