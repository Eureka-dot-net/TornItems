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
 * 
 * @param mode - 'current' for current regime configuration, 'comparison' for comparison configuration
 */

export type WizardMode = 'current' | 'comparison';

export interface TrainingRegimeSelections {
  edvd: boolean;
  candy: boolean;
  stackedCandy: boolean;
  energy: boolean;
  fhc: boolean;
}

interface TrainingRegimeWizardStepProps {
  onSelectionsChange?: (selections: TrainingRegimeSelections) => void;
  mode?: WizardMode;
}

export default function TrainingRegimeWizardStep({ onSelectionsChange, mode = 'current' }: TrainingRegimeWizardStepProps) {
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

  // For comparison mode, also load current values as defaults
  const loadCurrentValue = <T,>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(`gymWizard_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [selections, setSelections] = useState<TrainingRegimeSelections>(() =>
    isComparison
      ? loadSavedValue('trainingRegimeSelections', loadCurrentValue('trainingRegimeSelections', {
          edvd: false,
          candy: false,
          stackedCandy: false,
          energy: false,
          fhc: false,
        }))
      : loadSavedValue('trainingRegimeSelections', {
          edvd: false,
          candy: false,
          stackedCandy: false,
          energy: false,
          fhc: false,
        })
  );

  // Save selections to localStorage
  useEffect(() => {
    localStorage.setItem(`${storagePrefix}trainingRegimeSelections`, JSON.stringify(selections));
    if (onSelectionsChange) {
      onSelectionsChange(selections);
    }
  }, [selections, onSelectionsChange, storagePrefix]);

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
        {isComparison ? 'Configure Comparison Training Regime' : 'Configure Your Training Regime'}
      </Typography>

      <Typography variant="body1" paragraph>
        {isComparison 
          ? <>Choose which training methods to include in your <strong>comparison scenario</strong>. 
              This allows you to see how adding or removing training methods would affect your gains.</>
          : <>Let's discuss your current training approach. What methods do you use regularly to enhance your gym training?
              You can select multiple options below.</>
        }
      </Typography>

      <Alert severity={isComparison ? 'warning' : 'info'} sx={{ mb: 3 }}>
        <Typography variant="body2" paragraph>
          {isComparison 
            ? <>Select the training methods for your <strong>comparison scenario</strong>. 
                You can add or remove methods to see how they impact your overall gains.</>
            : <><strong>Training methods</strong> can significantly accelerate your stat gains. Select any methods you currently use
                or plan to use, and we'll help you configure them in the following steps.</>
          }
        </Typography>
        {!isComparison && (
          <Typography variant="body2">
            If you don't use any of these methods, simply leave all options unchecked and click Next to skip this section.
          </Typography>
        )}
      </Alert>

      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        {isComparison ? 'Which training methods for comparison?' : 'Which training methods do you use?'}
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
                <strong>Half Candy Jumps</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Using Happiness candies to boost your happy level for enhanced training gains (without stacking xanax)
              </Typography>
            </Box>
          }
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={selections.stackedCandy}
              onChange={handleCheckboxChange('stackedCandy')}
            />
          }
          label={
            <Box>
              <Typography variant="body1">
                <strong>Stacked Candy Jumps</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Like eDVD jumps but using candies instead - stacks xanax and uses candies for happiness boost
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
          {isComparison 
            ? "You haven't selected any training methods for comparison. Select methods you want to add to your comparison scenario, or click Next to continue without extra training methods."
            : "You haven't selected any training methods. If you don't use any advanced training methods, that's okay! Click Next to continue with the wizard."
          }
        </Alert>
      )}

      {hasAnySelection && (
        <Alert severity="success" sx={{ mt: 3 }}>
          {isComparison 
            ? "Your comparison scenario will include these training methods. Click Next to configure the details for each method."
            : "Great! In the next steps, we'll help you configure the details for each method you've selected."
          }
        </Alert>
      )}
    </Box>
  );
}
