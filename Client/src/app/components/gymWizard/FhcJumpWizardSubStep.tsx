import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Alert,
} from '@mui/material';
import { 
  ENERGY_ITEM_IDS,
  DEFAULT_FHC_QUANTITY 
} from '../../../lib/constants/gymConstants';
import { validateNumericInput } from '../../../lib/utils/jumpHelpers';

/**
 * FhcJumpWizardSubStep Component
 * 
 * This sub-step helps users configure their Feathery Hotel Coupon (FHC) usage.
 * It asks questions in an easy-to-understand format for basic users.
 * FHC is special because it completely refills the energy bar instead of adding a fixed amount.
 */

export default function FhcJumpWizardSubStep() {
  // Load saved preferences from localStorage
  const loadSavedValue = <T,>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(`gymWizard_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [quantity, setQuantity] = useState<number>(() => 
    loadSavedValue('fhcJumpQuantity', DEFAULT_FHC_QUANTITY)
  );
  const [factionBenefit, setFactionBenefit] = useState<number>(() => 
    loadSavedValue('fhcJumpFactionBenefit', 0)
  );

  // Save values to localStorage
  // Note: FHC shares the same storage keys as energy jumps since it's technically an energy item
  useEffect(() => {
    localStorage.setItem('gymWizard_energyJumpEnabled', JSON.stringify(true));
    localStorage.setItem('gymWizard_energyJumpItemId', JSON.stringify(ENERGY_ITEM_IDS.FHC));
    localStorage.setItem('gymWizard_energyJumpQuantity', JSON.stringify(quantity));
    localStorage.setItem('gymWizard_energyJumpFactionBenefit', JSON.stringify(factionBenefit));
  }, [quantity, factionBenefit]);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Configure Your FHC Usage
      </Typography>

      <Typography variant="body1" paragraph>
        Feathery Hotel Coupons (FHC) are special items that completely refill your energy bar.
        Let's configure how you use them.
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" paragraph>
          <strong>What is a Feathery Hotel Coupon?</strong> FHCs completely refill your energy bar,
          regardless of your maximum energy. This is different from energy drinks which only add a
          fixed amount.
        </Typography>
        <Typography variant="body2">
          FHCs are particularly valuable if you have a high maximum energy level, as they provide more
          value than standard energy drinks in that case.
        </Typography>
      </Alert>

      <TextField
        label="How many FHCs do you use per day?"
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(validateNumericInput(e.target.value, DEFAULT_FHC_QUANTITY, 1))}
        fullWidth
        margin="normal"
        helperText="Enter the number of FHCs you use each day for training"
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

      <Alert severity="warning" sx={{ mt: 3, mb: 2 }}>
        <Typography variant="body2">
          <strong>Note:</strong> If you selected both "Energy Cans" and "FHC", we'll use the FHC configuration
          since you completed this step last. If you want to use regular energy drinks instead, go back and
          uncheck FHC on the previous page.
        </Typography>
      </Alert>

      <Alert severity="success" sx={{ mt: 2 }}>
        <Typography variant="body2">
          Your FHC configuration has been saved. Click Next to continue.
        </Typography>
      </Alert>
    </Box>
  );
}
