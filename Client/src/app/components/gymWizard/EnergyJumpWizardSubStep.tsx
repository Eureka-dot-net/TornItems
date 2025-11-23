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
    loadSavedValue('energyJumpItemId', ENERGY_ITEM_IDS.ENERGY_10)
  );
  const [quantity, setQuantity] = useState<number>(() => 
    loadSavedValue('energyJumpQuantity', DEFAULT_ENERGY_DRINK_QUANTITY)
  );
  const [factionBenefit, setFactionBenefit] = useState<number>(() => 
    loadSavedValue('energyJumpFactionBenefit', 0)
  );

  // Save values to localStorage
  useEffect(() => {
    localStorage.setItem('gymWizard_energyJumpEnabled', JSON.stringify(true));
    localStorage.setItem('gymWizard_energyJumpItemId', JSON.stringify(itemId));
    localStorage.setItem('gymWizard_energyJumpQuantity', JSON.stringify(quantity));
    localStorage.setItem('gymWizard_energyJumpFactionBenefit', JSON.stringify(factionBenefit));
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
        <Typography variant="body2">
          <strong>What are energy drinks?</strong> Energy drinks (Energy Cans) restore some of your energy bar,
          allowing you to do additional training sessions. Different types provide different amounts of energy.
        </Typography>
      </Alert>

      <FormControl fullWidth margin="normal">
        <InputLabel>What type of energy drink do you use?</InputLabel>
        <Select
          value={itemId}
          label="What type of energy drink do you use?"
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

      <TextField
        label="How many energy drinks do you use per day?"
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(validateNumericInput(e.target.value, DEFAULT_ENERGY_DRINK_QUANTITY, 1))}
        fullWidth
        margin="normal"
        helperText="Enter the number of energy drinks you consume each day"
        inputProps={{ step: 1, min: 1 }}
      />

      <TextField
        label="Faction benefit percentage (if applicable)"
        type="number"
        value={factionBenefit}
        onChange={(e) => setFactionBenefit(validateNumericInput(e.target.value, 0, 0))}
        fullWidth
        margin="normal"
        helperText="Some faction perks provide additional energy benefits. Enter 0 if you don't have any."
        inputProps={{ step: 1, min: 0 }}
      />

      <Alert severity="success" sx={{ mt: 3 }}>
        <Typography variant="body2">
          Your energy drink configuration has been saved. Click Next to continue.
        </Typography>
      </Alert>
    </Box>
  );
}
