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
import { CANDY_ITEM_IDS, DEFAULT_CANDY_QUANTITY } from '../../../lib/constants/gymConstants';
import { validateNumericInput } from '../../../lib/utils/jumpHelpers';

/**
 * CandyJumpWizardSubStep Component
 * 
 * This sub-step helps users configure their candy jump training.
 * It asks questions in an easy-to-understand format for basic users.
 */

export default function CandyJumpWizardSubStep() {
  // Load saved preferences from localStorage
  const loadSavedValue = <T,>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(`gymWizard_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [itemId, setItemId] = useState<number>(() => 
    loadSavedValue('candyJumpItemId', CANDY_ITEM_IDS.HAPPY_75)
  );
  const [useEcstasy, setUseEcstasy] = useState<boolean>(() => 
    loadSavedValue('candyJumpUseEcstasy', false)
  );
  const [quantity, setQuantity] = useState<number>(() => 
    loadSavedValue('candyJumpQuantity', DEFAULT_CANDY_QUANTITY)
  );
  const [factionBenefit, setFactionBenefit] = useState<number>(() => 
    loadSavedValue('candyJumpFactionBenefit', 0)
  );

  // Save values to localStorage
  useEffect(() => {
    localStorage.setItem('gymWizard_candyJumpEnabled', JSON.stringify(true));
    localStorage.setItem('gymWizard_candyJumpItemId', JSON.stringify(itemId));
    localStorage.setItem('gymWizard_candyJumpUseEcstasy', JSON.stringify(useEcstasy));
    localStorage.setItem('gymWizard_candyJumpQuantity', JSON.stringify(quantity));
    localStorage.setItem('gymWizard_candyJumpFactionBenefit', JSON.stringify(factionBenefit));
  }, [itemId, useEcstasy, quantity, factionBenefit]);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Configure Your Candy Jump Training
      </Typography>

      <Typography variant="body1" paragraph>
        Happiness candies increase your happy level, which boosts the effectiveness of your gym training.
        Let's configure how you use them.
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>What is a candy jump?</strong> By consuming happiness-boosting candies before training,
          you temporarily increase your happy level. Higher happiness means better gains from each gym session.
          Using Ecstasy doubles the happiness gained from candies.
        </Typography>
      </Alert>

      <FormControl fullWidth margin="normal">
        <InputLabel>What type of candy do you use?</InputLabel>
        <Select
          value={itemId}
          label="What type of candy do you use?"
          onChange={(e) => setItemId(Number(e.target.value))}
        >
          <MenuItem value={CANDY_ITEM_IDS.HAPPY_25}>25 Happy Candy (e.g., Lollipop)</MenuItem>
          <MenuItem value={CANDY_ITEM_IDS.HAPPY_35}>35 Happy Candy (e.g., Box of Bon Bons)</MenuItem>
          <MenuItem value={CANDY_ITEM_IDS.HAPPY_75}>75 Happy Candy (e.g., Box of Chocolate Bars)</MenuItem>
          <MenuItem value={CANDY_ITEM_IDS.HAPPY_100}>100 Happy Candy (e.g., Box of Extra Strong Mints)</MenuItem>
          <MenuItem value={CANDY_ITEM_IDS.HAPPY_150}>150 Happy Candy (e.g., Bag of Sherbet)</MenuItem>
        </Select>
      </FormControl>

      <TextField
        label="How many candies do you use per day?"
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(validateNumericInput(e.target.value, DEFAULT_CANDY_QUANTITY, 1))}
        fullWidth
        margin="normal"
        helperText="Enter the number of candies you consume each day for training"
        inputProps={{ step: 1, min: 1 }}
      />

      <FormControlLabel
        control={
          <Switch
            checked={useEcstasy}
            onChange={(e) => setUseEcstasy(e.target.checked)}
          />
        }
        label={
          <Box>
            <Typography variant="body1">
              I use Ecstasy with my candies
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Ecstasy doubles the happiness gained from candies
            </Typography>
          </Box>
        }
        sx={{ mt: 2 }}
      />

      <TextField
        label="Faction benefit percentage (if applicable)"
        type="number"
        value={factionBenefit}
        onChange={(e) => setFactionBenefit(validateNumericInput(e.target.value, 0, 0))}
        fullWidth
        margin="normal"
        helperText="Some faction perks provide additional benefits. Enter 0 if you don't have any."
        inputProps={{ step: 1, min: 0 }}
      />

      <Alert severity="success" sx={{ mt: 3 }}>
        <Typography variant="body2">
          Your candy jump configuration has been saved. Click Next to continue.
        </Typography>
      </Alert>
    </Box>
  );
}
