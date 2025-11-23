import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import { 
  ENERGY_ITEM_IDS, 
  DEFAULT_ENERGY_DRINK_QUANTITY 
} from '../../../lib/constants/gymConstants';
import { validateNumericInput } from '../../../lib/utils/jumpHelpers';

/**
 * EnergyJumpWizardSubStep Component
 * 
 * This sub-step helps users configure their energy drink usage.
 * It asks questions in an easy-to-understand format for basic users.
 * This component is for energy cans/drinks only (NOT FHC).
 */

export default function EnergyJumpWizardSubStep() {
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
    loadSavedValue('energyDrinkItemId', ENERGY_ITEM_IDS.ENERGY_10)
  );
  const [quantity, setQuantity] = useState<number>(() => 
    loadSavedValue('energyDrinkQuantity', DEFAULT_ENERGY_DRINK_QUANTITY)
  );
  const [factionBenefit, setFactionBenefit] = useState<number>(() => 
    loadSavedValue('energyDrinkFactionBenefit', 0)
  );

  // Save values to localStorage - using energyDrink prefix to separate from FHC
  useEffect(() => {
    localStorage.setItem('gymWizard_energyDrinkEnabled', JSON.stringify(true));
    localStorage.setItem('gymWizard_energyDrinkItemId', JSON.stringify(itemId));
    localStorage.setItem('gymWizard_energyDrinkQuantity', JSON.stringify(quantity));
    localStorage.setItem('gymWizard_energyDrinkFactionBenefit', JSON.stringify(factionBenefit));
  }, [itemId, quantity, factionBenefit]);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Configure Your Energy Drink Usage
      </Typography>

      <Typography variant="body1" paragraph>
        Energy drinks provide additional energy, allowing you to train more frequently throughout the day.
        Let's configure how you use them.
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" paragraph>
          <strong>What are energy drinks?</strong> Energy drinks (Energy Cans) restore some of your energy bar,
          allowing you to do additional training sessions. Different types provide different amounts of energy.
        </Typography>
        <Typography variant="body2">
          <strong>Cooldown:</strong> Energy drinks have a 2-hour cooldown. Without specialized job perks, 
          the maximum you can use is <strong>12 energy drinks per day</strong>.
        </Typography>
      </Alert>

      {/* Energy Drink Type */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          What type of energy drink do you use?
        </Typography>
        <FormControl fullWidth>
          <InputLabel>Energy Drink Type</InputLabel>
          <Select
            value={itemId}
            label="Energy Drink Type"
            onChange={(e) => setItemId(Number(e.target.value))}
          >
            <MenuItem value={ENERGY_ITEM_IDS.ENERGY_5}>Energy Drink (5 Energy)</MenuItem>
            <MenuItem value={ENERGY_ITEM_IDS.ENERGY_10}>Energy Drink (10 Energy)</MenuItem>
            <MenuItem value={ENERGY_ITEM_IDS.ENERGY_15}>Energy Drink (15 Energy)</MenuItem>
            <MenuItem value={ENERGY_ITEM_IDS.ENERGY_20}>Energy Drink (20 Energy)</MenuItem>
            <MenuItem value={ENERGY_ITEM_IDS.ENERGY_25}>Energy Drink (25 Energy)</MenuItem>
            <MenuItem value={ENERGY_ITEM_IDS.ENERGY_30}>Energy Drink (30 Energy)</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Quantity */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          How many energy drinks do you use per day?
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Enter the number of energy drinks you consume each day (maximum 12 without specialized perks).
        </Typography>
        <TextField
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(validateNumericInput(e.target.value, DEFAULT_ENERGY_DRINK_QUANTITY, 1))}
          fullWidth
          size="small"
          inputProps={{ step: 1, min: 1, max: 12 }}
          helperText="Enter a value between 1 and 12"
        />
      </Box>

      {/* Faction Benefit */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Do you have any faction bonuses that boost energy drink effectiveness?
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Some faction perks provide additional percentage bonuses to energy gained. Enter 0 if you don't have any.
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

      <Alert severity="success" sx={{ mt: 3 }}>
        <Typography variant="body2">
          Your energy drink configuration has been saved. Click Next to continue.
        </Typography>
      </Alert>
    </Box>
  );
}
