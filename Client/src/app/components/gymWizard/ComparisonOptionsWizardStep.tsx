import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
} from '@mui/material';

/**
 * ComparisonOptionsWizardStep Component
 * 
 * This wizard step appears after all current regime configuration is complete.
 * It asks users what they want to compare: recommendations or manual comparison.
 * 
 * This step is shown ONLY for authorized users. Non-authorized users skip directly
 * to the ComparisonSelectionWizardStep.
 * 
 * @see GymWizard.tsx - handleNext function for the conditional display logic
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
    setSelectedOption(value);
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
          control={<Radio />}
          label={
            <Box>
              <Typography variant="body1">
                Get Personalized Recommendations
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Let us analyze your setup and suggest optimal training improvements
              </Typography>
            </Box>
          }
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

      {selectedOption === 'recommendations' && (
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            We'll analyze your current setup and suggest personalized improvements to help you 
            maximize your gym gains. You'll be taken to the recommendations page where you can 
            review our suggestions.
          </Typography>
        </Alert>
      )}

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
