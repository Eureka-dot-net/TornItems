import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Alert,
} from '@mui/material';

/**
 * TrainingRegimeWizardStep Component
 * 
 * This wizard step asks users about their current training regime.
 * Users can select multiple training methods, and the wizard will
 * navigate to sub-steps based on their selections.
 */

export interface TrainingRegimeSelections {
  edvd: boolean;
  candy: boolean;
  energy: boolean;
  fhc: boolean;
}

interface TrainingRegimeWizardStepProps {
  onSelectionsChange?: (selections: TrainingRegimeSelections) => void;
}

export default function TrainingRegimeWizardStep({ onSelectionsChange }: TrainingRegimeWizardStepProps) {
  // Load saved preferences from localStorage
  const loadSavedValue = <T,>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(`gymWizard_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [selections, setSelections] = useState<TrainingRegimeSelections>(() =>
    loadSavedValue('trainingRegimeSelections', {
      edvd: false,
      candy: false,
      energy: false,
      fhc: false,
    })
  );

  // Save selections to localStorage
  useEffect(() => {
    localStorage.setItem('gymWizard_trainingRegimeSelections', JSON.stringify(selections));
    if (onSelectionsChange) {
      onSelectionsChange(selections);
    }
  }, [selections, onSelectionsChange]);

  const handleCheckboxChange = (key: keyof TrainingRegimeSelections) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSelections((prev) => ({
      ...prev,
      [key]: event.target.checked,
    }));
  };

  const hasAnySelection = Object.values(selections).some((value) => value);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Configure Your Training Regime
      </Typography>

      <Typography variant="body1" paragraph>
        Let's discuss your current training approach. What methods do you use regularly to enhance your gym training?
        You can select multiple options below.
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" paragraph>
          <strong>Training methods</strong> can significantly accelerate your stat gains. Select any methods you currently use
          or plan to use, and we'll help you configure them in the following steps.
        </Typography>
        <Typography variant="body2">
          If you don't use any of these methods, simply leave all options unchecked and click Next to skip this section.
        </Typography>
      </Alert>

      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Which training methods do you use?
      </Typography>

      <FormGroup>
        <FormControlLabel
          control={
            <Checkbox
              checked={selections.edvd}
              onChange={handleCheckboxChange('edvd')}
            />
          }
          label={
            <Box>
              <Typography variant="body1">
                <strong>eDVD Jumps</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Using Educational DVDs with Ecstasy for temporary stat boosts during training
              </Typography>
            </Box>
          }
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={selections.candy}
              onChange={handleCheckboxChange('candy')}
            />
          }
          label={
            <Box>
              <Typography variant="body1">
                <strong>Candy Jumps</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Using Happiness candies to boost your happy level for enhanced training gains
              </Typography>
            </Box>
          }
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={selections.energy}
              onChange={handleCheckboxChange('energy')}
            />
          }
          label={
            <Box>
              <Typography variant="body1">
                <strong>Energy Cans</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Using Energy Drinks to gain additional energy for more training sessions
              </Typography>
            </Box>
          }
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={selections.fhc}
              onChange={handleCheckboxChange('fhc')}
            />
          }
          label={
            <Box>
              <Typography variant="body1">
                <strong>Feathery Hotel Coupons (FHC)</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Using FHC to completely refill your energy bar for extended training
              </Typography>
            </Box>
          }
        />
      </FormGroup>

      {!hasAnySelection && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          You haven't selected any training methods. If you don't use any advanced training methods,
          that's okay! Click Next to continue with the wizard.
        </Alert>
      )}

      {hasAnySelection && (
        <Alert severity="success" sx={{ mt: 3 }}>
          Great! In the next steps, we'll help you configure the details for each method you've selected.
        </Alert>
      )}
    </Box>
  );
}
