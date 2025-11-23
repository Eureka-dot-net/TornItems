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
  Switch,
} from '@mui/material';
import { CANDY_ITEM_IDS, DEFAULT_CANDY_QUANTITY } from '../../../lib/constants/gymConstants';
import { validateNumericInput } from '../../../lib/utils/jumpHelpers';

/**
 * CandyJumpWizardSubStep Component
 * 
 * This sub-step helps users configure their half candy jump training.
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

  const [frequencyDays, setFrequencyDays] = useState<number>(() => 
    loadSavedValue('candyJumpFrequencyDays', 1)
  );
  const [itemId, setItemId] = useState<number>(() => 
    loadSavedValue('candyJumpItemId', CANDY_ITEM_IDS.HAPPY_75)
  );
  const [quantity, setQuantity] = useState<number>(() => 
    loadSavedValue('candyJumpQuantity', DEFAULT_CANDY_QUANTITY)
  );
  const [factionBenefit, setFactionBenefit] = useState<number>(() => 
    loadSavedValue('candyJumpFactionBenefit', 0)
  );
  const [drugUsed, setDrugUsed] = useState<'none' | 'xanax' | 'ecstasy' | null>(() => {
    const saved = loadSavedValue<'none' | 'xanax' | 'ecstasy' | null>('candyJumpDrugUsed', null);
    return saved;
  });
  const [drugAlreadyIncluded, setDrugAlreadyIncluded] = useState<boolean>(() => 
    loadSavedValue('candyJumpDrugAlreadyIncluded', true)
  );
  const [usePointRefill, setUsePointRefill] = useState<boolean | null>(() => {
    const saved = loadSavedValue<boolean | null>('candyJumpUsePointRefill', null);
    const hasPointsRefill = loadSavedValue<boolean>('hasPointsRefill', true);
    // If user already does point refills, default to true
    if (saved === null && hasPointsRefill) {
      return true;
    }
    return saved;
  });

  // Load xanax per day for display
  const xanaxPerDay = loadSavedValue<number>('xanaxPerDay', 0);
  const hasPointsRefill = loadSavedValue<boolean>('hasPointsRefill', true);

  // Save values to localStorage
  useEffect(() => {
    localStorage.setItem('gymWizard_candyJumpEnabled', JSON.stringify(true));
    localStorage.setItem('gymWizard_candyJumpFrequencyDays', JSON.stringify(frequencyDays));
    localStorage.setItem('gymWizard_candyJumpItemId', JSON.stringify(itemId));
    localStorage.setItem('gymWizard_candyJumpQuantity', JSON.stringify(quantity));
    localStorage.setItem('gymWizard_candyJumpFactionBenefit', JSON.stringify(factionBenefit));
    localStorage.setItem('gymWizard_candyJumpDrugUsed', JSON.stringify(drugUsed || 'none'));
    localStorage.setItem('gymWizard_candyJumpDrugAlreadyIncluded', JSON.stringify(drugAlreadyIncluded));
    localStorage.setItem('gymWizard_candyJumpUsePointRefill', JSON.stringify(usePointRefill ?? hasPointsRefill));
  }, [frequencyDays, itemId, quantity, factionBenefit, drugUsed, drugAlreadyIncluded, usePointRefill, hasPointsRefill]);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Configure Your Half Candy Jump Training
      </Typography>

      <Typography variant="body1" paragraph>
        Happiness candies increase your happy level, which boosts the effectiveness of your gym training.
        Let's configure how you use them.
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" paragraph>
          <strong>What is a Half Candy Jump?</strong> A frequent jump done without stacking xanax. 
          By consuming happiness-boosting candies before training, you temporarily increase your happy level. 
          Higher happiness means better gains from each gym session.
        </Typography>
        <Typography variant="body2">
          <strong>Cooldown:</strong> Candies have a 30-minute cooldown. Without specialized job perks, 
          the maximum you can use is <strong>48 candies per day</strong>.
        </Typography>
      </Alert>

      {/* Jump Frequency */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          How often do you do this jump?
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Most users do it every day, but some do it every 2-3 days due to funding issues.
        </Typography>
        <TextField
          type="number"
          value={frequencyDays}
          onChange={(e) => setFrequencyDays(validateNumericInput(e.target.value, 1, 1))}
          fullWidth
          size="small"
          inputProps={{ step: 1, min: 1 }}
          helperText="Enter number of days between jumps (1 = every day, 2 = every other day, etc.)"
        />
      </Box>

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
          How many candies do you use per jump?
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Enter the number of candies you consume each jump (maximum 48 without specialized perks).
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

      {/* Faction Benefit - only show after quantity is set */}
      {quantity > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Faction perks (% increase in happiness)
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Some faction perks provide additional percentage bonuses to candy happiness. Enter 0 if you don't have any.
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

      {/* Drug Question */}
      {quantity > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Which drug do you use with your candies? (You can only use one)
          </Typography>
          <RadioGroup
            value={drugUsed === null ? '' : drugUsed}
            onChange={(e) => setDrugUsed(e.target.value as 'none' | 'xanax' | 'ecstasy')}
          >
            <FormControlLabel 
              value="xanax" 
              control={<Radio />} 
              label="Xanax (Extra 250 energy during the jump)" 
            />
            <FormControlLabel 
              value="ecstasy" 
              control={<Radio />} 
              label="Ecstasy (Doubles happiness)" 
            />
            <FormControlLabel 
              value="none" 
              control={<Radio />} 
              label="None" 
            />
          </RadioGroup>
        </Box>
      )}

      {/* If Xanax or Ecstasy selected, ask if already included (only if user has xanax per day > 0) */}
      {(drugUsed === 'xanax' || drugUsed === 'ecstasy') && xanaxPerDay > 0 && (
        <Box sx={{ mb: 3, ml: 3 }}>
          <Typography variant="body2" color="text.secondary" paragraph>
            You indicated you use {xanaxPerDay} xanax per day normally.
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={drugAlreadyIncluded}
                onChange={(e) => setDrugAlreadyIncluded(e.target.checked)}
              />
            }
            label={drugUsed === 'xanax' 
              ? "This xanax is already included in my daily xanax count"
              : "This ecstasy replaces one of my daily xanax"}
          />
        </Box>
      )}

      {/* Point refill question - only if user doesn't normally do point refills */}
      {drugUsed !== null && !hasPointsRefill && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Do you use a point refill during the jump?
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Point refills give you an extra 150 energy (or 100 if you have 100 max energy).
          </Typography>
          <RadioGroup
            value={usePointRefill === null ? '' : (usePointRefill ? 'yes' : 'no')}
            onChange={(e) => setUsePointRefill(e.target.value === 'yes')}
          >
            <FormControlLabel value="yes" control={<Radio />} label="Yes, I use a point refill during the jump" />
            <FormControlLabel value="no" control={<Radio />} label="No, I don't use a point refill" />
          </RadioGroup>
        </Box>
      )}

      {/* Note about energy cans and FHC */}
      {drugUsed !== null && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Energy Cans and FHC:</strong> If you use energy cans or Feathery Hotel Coupons (FHC) during your jumps, 
            this is configured in the Energy Jump section.
          </Typography>
        </Alert>
      )}

      {(drugUsed !== null && (hasPointsRefill || usePointRefill !== null)) && (
        <Alert severity="success" sx={{ mt: 3 }}>
          <Typography variant="body2">
            Your half candy jump configuration has been saved. Click Next to continue.
          </Typography>
        </Alert>
      )}
    </Box>
  );
}
