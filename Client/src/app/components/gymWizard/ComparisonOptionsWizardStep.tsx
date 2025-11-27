import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  Chip,
} from '@mui/material';

/**
 * ComparisonOptionsWizardStep Component
 * 
 * This wizard step appears after all current regime configuration is complete.
 * It asks users what they want to compare: recommendations or manual comparison.
 * 
 * NOTE: This step is currently SKIPPED in the wizard flow but MUST NOT BE REMOVED.
 * It will be used in the future when the "Get Personalized Recommendations" feature
 * is implemented. The wizard currently skips directly from Training Regime to 
 * Select Areas (ComparisonSelectionWizardStep).
 * 
 * @see GymWizard.tsx - handleNext function for the skip logic
 */

export type ComparisonOptionType = 'recommendations' | 'manual' | null;

interface ComparisonOptionsWizardStepProps {
  onOptionChange?: (option: ComparisonOptionType) => void;
}

export default function ComparisonOptionsWizardStep({ onOptionChange }: ComparisonOptionsWizardStepProps) {
  // Load saved preferences from localStorage
  const loadSavedValue = <T,>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(`gymWizard_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [selectedOption, setSelectedOption] = useState<ComparisonOptionType>(() =>
    loadSavedValue<ComparisonOptionType>('comparisonOption', null)
  );

  // Save selection to localStorage
  useEffect(() => {
    localStorage.setItem('gymWizard_comparisonOption', JSON.stringify(selectedOption));
    if (onOptionChange) {
      onOptionChange(selectedOption);
    }
  }, [selectedOption, onOptionChange]);

  const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value as ComparisonOptionType;
    // Only allow 'manual' since 'recommendations' is coming soon
    if (value === 'manual') {
      setSelectedOption(value);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        What Would You Like to Compare?
      </Typography>

      <Alert severity="success" sx={{ mb: 3 }}>
        <Typography variant="body1">
          <strong>Excellent work!</strong> You've provided all the information we need to predict 
          your stat gains based on your current training regime. Now, let's explore how different 
          approaches could affect your progress.
        </Typography>
      </Alert>

      <Typography variant="body1" paragraph>
        The gym comparison tool allows you to see how changes to your training setup could impact 
        your stat gains over time. How would you like to proceed?
      </Typography>

      <RadioGroup
        value={selectedOption || ''}
        onChange={handleOptionChange}
      >
        <FormControlLabel
          value="recommendations"
          control={<Radio disabled />}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box>
                <Typography variant="body1" sx={{ color: 'text.disabled' }}>
                  Get Personalized Recommendations
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  Let us analyze your setup and suggest optimal training improvements
                </Typography>
              </Box>
              <Chip 
                label="Coming Soon" 
                size="small" 
                color="info" 
                variant="outlined"
              />
            </Box>
          }
          disabled
        />

        <FormControlLabel
          value="manual"
          control={<Radio />}
          label={
            <Box>
              <Typography variant="body1">
                I Know What I'd Like to Compare
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Choose specific aspects of your training to modify and compare against your current regime
              </Typography>
            </Box>
          }
        />
      </RadioGroup>

      {selectedOption === 'manual' && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            In the next step, you'll select which aspects of your training you want to customize 
            for comparison. You can compare changes to your energy sources, happy levels, company 
            benefits, stat ratios, or training methods.
          </Typography>
        </Alert>
      )}
    </Box>
  );
}
