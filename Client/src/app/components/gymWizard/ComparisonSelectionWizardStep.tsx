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
 * ComparisonSelectionWizardStep Component
 * 
 * This wizard step allows users to select which wizard pages they want to
 * customize for comparison. The selected pages will be shown again with
 * comparison-specific messaging.
 */

export interface ComparisonPageSelections {
  energySources: boolean;
  happyPerks: boolean;
  companyBenefits: boolean;
  statTargetRatios: boolean;
  trainingRegime: boolean;
}

interface ComparisonSelectionWizardStepProps {
  onSelectionsChange?: (selections: ComparisonPageSelections) => void;
}

export default function ComparisonSelectionWizardStep({ onSelectionsChange }: ComparisonSelectionWizardStepProps) {
  // Load saved preferences from localStorage
  const loadSavedValue = <T,>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(`gymWizard_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [selections, setSelections] = useState<ComparisonPageSelections>(() =>
    loadSavedValue('comparisonPageSelections', {
      energySources: false,
      happyPerks: false,
      companyBenefits: false,
      statTargetRatios: false,
      trainingRegime: false,
    })
  );

  // Save selections to localStorage
  useEffect(() => {
    localStorage.setItem('gymWizard_comparisonPageSelections', JSON.stringify(selections));
    if (onSelectionsChange) {
      onSelectionsChange(selections);
    }
  }, [selections, onSelectionsChange]);

  const handleCheckboxChange = (key: keyof ComparisonPageSelections) => (
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
        Select Comparison Areas
      </Typography>

      <Typography variant="body1" paragraph>
        Choose which aspects of your training you'd like to explore with different settings. 
        For each area you select, you'll be able to configure an alternative setup to compare 
        against your current regime.
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Tip:</strong> Select the areas where you're considering making changes. For example, 
          if you're thinking about using more Xanax or switching companies, select those categories 
          to see how they would affect your gains.
        </Typography>
      </Alert>

      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
        Which areas would you like to compare?
      </Typography>

      <FormGroup>
        <FormControlLabel
          control={
            <Checkbox
              checked={selections.energySources}
              onChange={handleCheckboxChange('energySources')}
            />
          }
          label={
            <Box>
              <Typography variant="body1">
                <strong>Energy Sources</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Compare different energy configurations (Xanax usage, points refills, hours played)
              </Typography>
            </Box>
          }
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={selections.happyPerks}
              onChange={handleCheckboxChange('happyPerks')}
            />
          }
          label={
            <Box>
              <Typography variant="body1">
                <strong>Happy & Perks</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Compare different base happy values or gym perk configurations
              </Typography>
            </Box>
          }
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={selections.companyBenefits}
              onChange={handleCheckboxChange('companyBenefits')}
            />
          }
          label={
            <Box>
              <Typography variant="body1">
                <strong>Company Benefits</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Compare gains with different company gym-related perks
              </Typography>
            </Box>
          }
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={selections.statTargetRatios}
              onChange={handleCheckboxChange('statTargetRatios')}
            />
          }
          label={
            <Box>
              <Typography variant="body1">
                <strong>Stat Target Ratios</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Compare different stat build strategies (Baldr's, Hank's, etc.)
              </Typography>
            </Box>
          }
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={selections.trainingRegime}
              onChange={handleCheckboxChange('trainingRegime')}
            />
          }
          label={
            <Box>
              <Typography variant="body1">
                <strong>Training Regime</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Compare different training methods (eDVD, candy jumps, energy cans, etc.)
              </Typography>
            </Box>
          }
        />
      </FormGroup>

      {!hasAnySelection && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          <Typography variant="body2">
            Please select at least one area to compare. This will allow you to see how changes 
            in that area would affect your gym gains compared to your current setup.
          </Typography>
        </Alert>
      )}

      {hasAnySelection && (
        <Alert severity="success" sx={{ mt: 3 }}>
          <Typography variant="body2">
            You'll configure the comparison settings for each selected area in the following steps. 
            After configuration, we'll generate comparison graphs showing how your gains would differ.
          </Typography>
        </Alert>
      )}
    </Box>
  );
}
