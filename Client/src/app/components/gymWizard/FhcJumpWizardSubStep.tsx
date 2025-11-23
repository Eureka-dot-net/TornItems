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
    loadSavedValue('fhcQuantity', DEFAULT_FHC_QUANTITY)
  );

  // Save values to localStorage - using fhc prefix to separate from energy drinks
  useEffect(() => {
    localStorage.setItem('gymWizard_fhcEnabled', JSON.stringify(true));
    localStorage.setItem('gymWizard_fhcItemId', JSON.stringify(ENERGY_ITEM_IDS.FHC));
    localStorage.setItem('gymWizard_fhcQuantity', JSON.stringify(quantity));
  }, [quantity]);

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
        <Typography variant="body2" paragraph>
          <strong>Cooldown:</strong> FHCs have a 6-hour cooldown. Without specialized job perks, 
          the maximum you can use is <strong>4 FHCs per day</strong>.
        </Typography>
        <Typography variant="body2">
          <strong>Note:</strong> FHCs are not affected by faction bonuses.
        </Typography>
      </Alert>

      {/* Quantity */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          How many FHCs do you use per day?
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Enter the number of FHCs you use each day for training (maximum 4 without specialized perks).
        </Typography>
        <TextField
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(validateNumericInput(e.target.value, DEFAULT_FHC_QUANTITY, 1, 4))}
          fullWidth
          size="small"
          inputProps={{ step: 1, min: 1, max: 4 }}
          helperText="Enter a value between 1 and 4"
        />
      </Box>

      <Alert severity="success" sx={{ mt: 3 }}>
        <Typography variant="body2">
          Your FHC configuration has been saved. Click Next to continue.
        </Typography>
      </Alert>
    </Box>
  );
}
