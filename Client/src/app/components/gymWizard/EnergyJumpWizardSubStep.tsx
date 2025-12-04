import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import { NumericTextField } from '../../../lib/components';
import { 
  ENERGY_ITEM_IDS, 
  DEFAULT_ENERGY_DRINK_QUANTITY 
} from '../../../lib/constants/gymConstants';

/**
 * EnergyJumpWizardSubStep Component
 * 
 * This sub-step helps users configure their energy drink usage.
 * It asks questions in an easy-to-understand format for basic users.
 * This component is for energy cans/drinks only (NOT FHC).
 * 
 * @param mode - 'current' for current regime configuration, 'comparison' for comparison configuration
 */

export type WizardMode = 'current' | 'comparison';

interface EnergyJumpWizardSubStepProps {
  mode?: WizardMode;
}

export default function EnergyJumpWizardSubStep({ mode = 'current' }: EnergyJumpWizardSubStepProps) {
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
    localStorage.setItem(`${storagePrefix}energyDrinkEnabled`, JSON.stringify(true));
    localStorage.setItem(`${storagePrefix}energyDrinkItemId`, JSON.stringify(itemId));
    localStorage.setItem(`${storagePrefix}energyDrinkQuantity`, JSON.stringify(quantity));
    localStorage.setItem(`${storagePrefix}energyDrinkFactionBenefit`, JSON.stringify(factionBenefit));
  }, [itemId, quantity, factionBenefit, storagePrefix]);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        {isComparison ? 'Configure Comparison Energy Drink Usage' : 'Configure Your Energy Drink Usage'}
      </Typography>

      <Typography variant="body1" paragraph>
        {isComparison 
          ? <>Configure the energy drink settings for your <strong>comparison scenario</strong>. 
              Adjust these values to see how different energy drink usage would affect your gains.</>
          : <>Energy drinks provide additional energy, allowing you to train more frequently throughout the day.
              Let's configure how you use them.</>
        }
      </Typography>

      <Alert severity={isComparison ? 'warning' : 'info'} sx={{ mb: 3 }}>
        <Typography variant="body2" paragraph>
          {isComparison 
            ? <>These settings are for your <strong>comparison scenario</strong>. Modify them to 
                see how changes to your energy drink usage would impact your training.</>
            : <><strong>What are energy drinks?</strong> Energy drinks (Energy Cans) restore some of your energy bar,
                allowing you to do additional training sessions. Different types provide different amounts of energy.</>
          }
        </Typography>
        {!isComparison && (
          <Typography variant="body2">
            <strong>Cooldown:</strong> Energy drinks have a 2-hour cooldown. Without specialized job perks, 
            the maximum you can use is <strong>12 energy drinks per day</strong>.
          </Typography>
        )}
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
        <NumericTextField
          value={quantity}
          onChange={(value) => setQuantity(value)}
          fullWidth
          size="small"
          min={1}
          max={12}
          step={1}
          defaultValue={DEFAULT_ENERGY_DRINK_QUANTITY}
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
        <NumericTextField
          value={factionBenefit}
          onChange={(value) => setFactionBenefit(value)}
          fullWidth
          size="small"
          min={0}
          step={1}
          helperText="Enter percentage bonus (e.g., 10 for 10% bonus)"
        />
      </Box>

      <Alert severity="success" sx={{ mt: 3 }}>
        <Typography variant="body2">
          {isComparison 
            ? 'Your comparison energy drink configuration has been saved. Click Next to continue.'
            : 'Your energy drink configuration has been saved. Click Next to continue.'
          }
        </Typography>
      </Alert>
    </Box>
  );
}
