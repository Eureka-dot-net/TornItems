import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Alert,
  RadioGroup,
  Radio,
  Paper,
} from '@mui/material';

/**
 * ComparisonSelectionWizardStep Component
 * 
 * This wizard step allows users to select which wizard pages they want to
 * customize for comparison. The selected pages will be shown again with
 * comparison-specific messaging.
 * 
 * Users can choose between:
 * - Separate comparisons: Each change is shown as its own comparison (what if I do X OR Y)
 * - Combined comparison: All changes are combined into one comparison (what if I do X AND Y)
 */

export interface ComparisonPageSelections {
  energySources: boolean;
  happyPerks: boolean;
  companyBenefits: boolean;
  statTargetRatios: boolean;
  trainingRegime: boolean;
}

export type ComparisonMode = 'separate' | 'combined';

interface ComparisonSelectionWizardStepProps {
  onSelectionsChange?: (selections: ComparisonPageSelections) => void;
  onModeChange?: (mode: ComparisonMode) => void;
}

export default function ComparisonSelectionWizardStep({ onSelectionsChange, onModeChange }: ComparisonSelectionWizardStepProps) {
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

  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>(() =>
    loadSavedValue('comparisonMode', 'separate')
  );

  // Save selections to localStorage
  useEffect(() => {
    localStorage.setItem('gymWizard_comparisonPageSelections', JSON.stringify(selections));
    if (onSelectionsChange) {
      onSelectionsChange(selections);
    }
  }, [selections, onSelectionsChange]);

  // Save comparison mode to localStorage
  useEffect(() => {
    localStorage.setItem('gymWizard_comparisonMode', JSON.stringify(comparisonMode));
    if (onModeChange) {
      onModeChange(comparisonMode);
    }
  }, [comparisonMode, onModeChange]);

  const handleCheckboxChange = (key: keyof ComparisonPageSelections) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSelections((prev) => ({
      ...prev,
      [key]: event.target.checked,
    }));
  };

  const handleModeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setComparisonMode(event.target.value as ComparisonMode);
  };

  const hasAnySelection = Object.values(selections).some((value) => value);
  const selectedCount = Object.values(selections).filter((value) => value).length;

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

      {/* Comparison Mode Selection - only show when multiple areas selected */}
      {selectedCount > 1 && (
        <Paper elevation={2} sx={{ p: 3, mt: 4, bgcolor: 'background.default' }}>
          <Typography variant="h6" gutterBottom>
            How would you like to compare these changes?
          </Typography>
          
          <Typography variant="body2" color="text.secondary" paragraph>
            You've selected {selectedCount} areas to compare. Choose how you want to see the results:
          </Typography>

          <RadioGroup
            value={comparisonMode}
            onChange={handleModeChange}
          >
            <Paper 
              elevation={comparisonMode === 'separate' ? 3 : 1} 
              sx={{ 
                p: 2, 
                mb: 2, 
                border: comparisonMode === 'separate' ? '2px solid' : '1px solid',
                borderColor: comparisonMode === 'separate' ? 'primary.main' : 'divider',
                cursor: 'pointer',
                '&:hover': { borderColor: 'primary.light' }
              }}
              onClick={() => setComparisonMode('separate')}
            >
              <FormControlLabel
                value="separate"
                control={<Radio />}
                sx={{ m: 0, width: '100%' }}
                label={
                  <Box sx={{ ml: 1 }}>
                    <Typography variant="body1" fontWeight="bold">
                      Show each change separately
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <em>"What if I do this OR that?"</em>
                    </Typography>
                    <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1 }}>
                      Creates a separate comparison graph for each change you selected. This helps you see 
                      the individual impact of each change, so you can decide which single change would 
                      benefit you the most.
                    </Typography>
                  </Box>
                }
              />
            </Paper>

            <Paper 
              elevation={comparisonMode === 'combined' ? 3 : 1} 
              sx={{ 
                p: 2, 
                border: comparisonMode === 'combined' ? '2px solid' : '1px solid',
                borderColor: comparisonMode === 'combined' ? 'primary.main' : 'divider',
                cursor: 'pointer',
                '&:hover': { borderColor: 'primary.light' }
              }}
              onClick={() => setComparisonMode('combined')}
            >
              <FormControlLabel
                value="combined"
                control={<Radio />}
                sx={{ m: 0, width: '100%' }}
                label={
                  <Box sx={{ ml: 1 }}>
                    <Typography variant="body1" fontWeight="bold">
                      Combine all changes together
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <em>"What if I do this AND that?"</em>
                    </Typography>
                    <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1 }}>
                      Combines all your changes into a single comparison. This shows you the total impact 
                      if you made all the changes at once.
                    </Typography>
                  </Box>
                }
              />
            </Paper>
          </RadioGroup>

          {/* Warning when selecting more than 2 areas with separate mode */}
          {comparisonMode === 'separate' && selectedCount > 2 && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Note:</strong> You've selected {selectedCount} comparison areas. With "separate" display mode, 
                each area will generate its own line on the chart. Charts with more than 2-3 comparisons can become 
                difficult to read. Consider using "combined" mode or selecting fewer areas for clearer results.
              </Typography>
            </Alert>
          )}
        </Paper>
      )}

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
            {selectedCount === 1 ? (
              <>You'll configure the comparison settings for your selected area in the following steps. 
              After configuration, we'll generate a comparison graph showing how your gains would differ.</>
            ) : comparisonMode === 'separate' ? (
              <>You'll configure each area in the following steps. We'll create <strong>{selectedCount} separate comparison graphs</strong> - 
              one for each change - so you can compare the individual impact of each option.</>
            ) : (
              <>You'll configure each area in the following steps. We'll create <strong>one combined comparison graph</strong> showing 
              the total impact of making all these changes together.</>
            )}
          </Typography>
        </Alert>
      )}
    </Box>
  );
}
