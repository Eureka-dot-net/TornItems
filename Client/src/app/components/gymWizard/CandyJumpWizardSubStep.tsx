import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
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
  const [useEcstasy, setUseEcstasy] = useState<'yes' | 'no' | null>(() => {
    const saved = loadSavedValue<boolean | null>('candyJumpUseEcstasy', null);
    if (saved === null) return null;
    return saved ? 'yes' : 'no';
  });
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
    localStorage.setItem('gymWizard_candyJumpUseEcstasy', JSON.stringify(useEcstasy === 'yes'));
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
        <Typography variant="body2" paragraph>
          <strong>What is a candy jump?</strong> By consuming happiness-boosting candies before training,
          you temporarily increase your happy level. Higher happiness means better gains from each gym session.
        </Typography>
        <Typography variant="body2">
          <strong>Cooldown:</strong> Candies have a 30-minute cooldown. Without specialized job perks, 
          the maximum you can use is <strong>48 candies per day</strong>.
        </Typography>
      </Alert>

      {/* Candy Type */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          What type of candy do you use?
        </Typography>
        <FormControl fullWidth>
          <InputLabel>Candy Type</InputLabel>
          <Select
            value={itemId}
            label="Candy Type"
            onChange={(e) => setItemId(Number(e.target.value))}
          >
            <MenuItem value={CANDY_ITEM_IDS.HAPPY_25}>25 Happy Candy (e.g., Lollipop)</MenuItem>
            <MenuItem value={CANDY_ITEM_IDS.HAPPY_35}>35 Happy Candy (e.g., Box of Bon Bons)</MenuItem>
            <MenuItem value={CANDY_ITEM_IDS.HAPPY_75}>75 Happy Candy (e.g., Box of Chocolate Bars)</MenuItem>
            <MenuItem value={CANDY_ITEM_IDS.HAPPY_100}>100 Happy Candy (e.g., Box of Extra Strong Mints)</MenuItem>
            <MenuItem value={CANDY_ITEM_IDS.HAPPY_150}>150 Happy Candy (e.g., Bag of Sherbet)</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Quantity */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          How many candies do you use per day?
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Enter the number of candies you consume each day for training (maximum 48 without specialized perks).
        </Typography>
        <TextField
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(validateNumericInput(e.target.value, DEFAULT_CANDY_QUANTITY, 1, 48))}
          fullWidth
          size="small"
          inputProps={{ step: 1, min: 1, max: 48 }}
          helperText="Enter a value between 1 and 48"
        />
      </Box>

      {/* Ecstasy Question */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Do you use Ecstasy with your candies?
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Ecstasy doubles the happiness gained from candies, making your training significantly more effective.
        </Typography>
        <RadioGroup
          value={useEcstasy === null ? '' : useEcstasy}
          onChange={(e) => setUseEcstasy(e.target.value as 'yes' | 'no')}
        >
          <FormControlLabel 
            value="yes" 
            control={<Radio />} 
            label="Yes, I use Ecstasy with my candies" 
          />
          <FormControlLabel 
            value="no" 
            control={<Radio />} 
            label="No, I don't use Ecstasy" 
          />
        </RadioGroup>
      </Box>

      {/* Faction Benefit - only show after Ecstasy question is answered */}
      {useEcstasy !== null && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Do you have any faction bonuses that boost candy effectiveness?
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Some faction perks provide additional percentage bonuses. Enter 0 if you don't have any.
          </Typography>
          <TextField
            type="number"
            value={factionBenefit}
            onChange={(e) => setFactionBenefit(validateNumericInput(e.target.value, 0, 0))}
            fullWidth
            size="small"
            inputProps={{ step: 1, min: 0 }}
            helperText="Enter percentage bonus (e.g., 10 for 10% bonus)"
          />
        </Box>
      )}

      {useEcstasy !== null && (
        <Alert severity="success" sx={{ mt: 3 }}>
          <Typography variant="body2">
            Your candy jump configuration has been saved. Click Next to continue.
          </Typography>
        </Alert>
      )}
    </Box>
  );
}
