import { useState, useCallback, useEffect } from 'react';
import { Box, Typography, Paper, Button, Stepper, Step, StepLabel, StepButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ApiKeyWizardStep from '../components/gymWizard/ApiKeyWizardStep';
import EnergySourcesWizardStep from '../components/gymWizard/EnergySourcesWizardStep';
import HappyPerksWizardStep from '../components/gymWizard/HappyPerksWizardStep';
import CompanyBenefitsWizardStep from '../components/gymWizard/CompanyBenefitsWizardStep';
import StatTargetRatiosWizardStep from '../components/gymWizard/StatTargetRatiosWizardStep';
import TrainingRegimeWizardStep, { type TrainingRegimeSelections } from '../components/gymWizard/TrainingRegimeWizardStep';
import ComparisonOptionsWizardStep, { type ComparisonOptionType } from '../components/gymWizard/ComparisonOptionsWizardStep';
import ComparisonSelectionWizardStep, { type ComparisonPageSelections, type ComparisonMode } from '../components/gymWizard/ComparisonSelectionWizardStep';
import EdvdJumpWizardSubStep from '../components/gymWizard/EdvdJumpWizardSubStep';
import CandyJumpWizardSubStep from '../components/gymWizard/CandyJumpWizardSubStep';
import StackedCandyJumpWizardSubStep from '../components/gymWizard/StackedCandyJumpWizardSubStep';
import EnergyJumpWizardSubStep from '../components/gymWizard/EnergyJumpWizardSubStep';
import FhcJumpWizardSubStep from '../components/gymWizard/FhcJumpWizardSubStep';
import { 
  convertWizardSelectionsToStatWeights, 
  convertTrainByPerksToStatDrift,
  convertBalanceAfterGymToGymIndex 
} from '../../lib/utils/wizardHelpers';

/**
 * GymWizard Container Component
 * 
 * This is a CONTAINER ONLY and should NOT contain any business logic.
 * All logic should be contained in the individual wizard step components.
 * 
 * This wizard guides users through setting up the gym comparison tool step by step,
 * making it easier for new users to understand and use the tool.
 * 
 * The wizard has two phases:
 * 1. Current regime configuration (steps 0-5)
 * 2. Comparison configuration (steps 6+) - shown after user completes current regime
 */

const baseWizardSteps = [
  { label: 'Player Stats', description: 'Set up your player stats' },
  { label: 'Energy Sources', description: 'Configure your energy sources' },
  { label: 'Happy & Perks', description: 'Configure your base happy and gym perks' },
  { label: 'Company Benefits', description: 'Configure your company benefits' },
  { label: 'Stat Target Ratios', description: 'Configure your stat training strategy' },
  { label: 'Training Regime', description: 'Configure your training methods' },
  { label: 'Comparison Options', description: 'Choose what to compare' },
  { label: 'Select Areas', description: 'Select comparison areas' },
];

export default function GymWizard() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [subStepIndex, setSubStepIndex] = useState(0);
  const [trainingSelections, setTrainingSelections] = useState<TrainingRegimeSelections>({
    edvd: false,
    candy: false,
    stackedCandy: false,
    energy: false,
    fhc: false,
  });
  
  // Comparison phase state
  // Note: setComparisonOption is used by handleComparisonOptionChange callback
  const [, setComparisonOption] = useState<ComparisonOptionType>(null);
  const [comparisonPageSelections, setComparisonPageSelections] = useState<ComparisonPageSelections>({
    energySources: false,
    happyPerks: false,
    companyBenefits: false,
    statTargetRatios: false,
    trainingRegime: false,
  });
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('separate');
  const [comparisonSubStepIndex, setComparisonSubStepIndex] = useState(0);
  const [comparisonTrainingSelections, setComparisonTrainingSelections] = useState<TrainingRegimeSelections>({
    edvd: false,
    candy: false,
    stackedCandy: false,
    energy: false,
    fhc: false,
  });

  // Load training selections from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('gymWizard_trainingRegimeSelections');
      if (saved) {
        setTrainingSelections(JSON.parse(saved));
      }
    } catch {
      // Ignore parse errors
    }
    
    // Load comparison selections
    try {
      const savedPageSelections = localStorage.getItem('gymWizard_comparisonPageSelections');
      if (savedPageSelections) {
        setComparisonPageSelections(JSON.parse(savedPageSelections));
      }
      const savedComparisonMode = localStorage.getItem('gymWizard_comparisonMode');
      if (savedComparisonMode) {
        setComparisonMode(JSON.parse(savedComparisonMode));
      }
      const savedComparisonTraining = localStorage.getItem('gymWizard_comparison_trainingRegimeSelections');
      if (savedComparisonTraining) {
        setComparisonTrainingSelections(JSON.parse(savedComparisonTraining));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Build dynamic sub-steps based on selections
  const getSubStepsForTrainingRegime = useCallback(() => {
    const subSteps: Array<{ key: string; label: string; component: React.ReactElement }> = [];
    
    if (trainingSelections.edvd) {
      subSteps.push({
        key: 'edvd',
        label: 'eDVD Configuration',
        component: <EdvdJumpWizardSubStep />,
      });
    }
    
    if (trainingSelections.candy) {
      subSteps.push({
        key: 'candy',
        label: 'Half Candy Configuration',
        component: <CandyJumpWizardSubStep />,
      });
    }
    
    if (trainingSelections.stackedCandy) {
      subSteps.push({
        key: 'stackedCandy',
        label: 'Stacked Candy Configuration',
        component: <StackedCandyJumpWizardSubStep />,
      });
    }
    
    if (trainingSelections.energy) {
      subSteps.push({
        key: 'energy',
        label: 'Energy Configuration',
        component: <EnergyJumpWizardSubStep />,
      });
    }
    
    if (trainingSelections.fhc) {
      subSteps.push({
        key: 'fhc',
        label: 'FHC Configuration',
        component: <FhcJumpWizardSubStep />,
      });
    }
    
    return subSteps;
  }, [trainingSelections]);

  const subSteps = getSubStepsForTrainingRegime();
  const isInSubStep = activeStep === 5 && subSteps.length > 0 && subStepIndex < subSteps.length;
  
  const handleComparisonTrainingSelectionsChange = useCallback((selections: TrainingRegimeSelections) => {
    setComparisonTrainingSelections(selections);
  }, []);

  // Build dynamic comparison page sub-steps based on selections
  const getComparisonPageSteps = useCallback(() => {
    const pages: Array<{ key: keyof ComparisonPageSelections; label: string; component: React.ReactElement }> = [];
    
    if (comparisonPageSelections.energySources) {
      pages.push({
        key: 'energySources',
        label: 'Compare Energy Sources',
        component: <EnergySourcesWizardStep mode="comparison" />,
      });
    }
    
    if (comparisonPageSelections.happyPerks) {
      pages.push({
        key: 'happyPerks',
        label: 'Compare Happy & Perks',
        component: <HappyPerksWizardStep mode="comparison" />,
      });
    }
    
    if (comparisonPageSelections.companyBenefits) {
      pages.push({
        key: 'companyBenefits',
        label: 'Compare Company Benefits',
        component: <CompanyBenefitsWizardStep mode="comparison" />,
      });
    }
    
    if (comparisonPageSelections.statTargetRatios) {
      pages.push({
        key: 'statTargetRatios',
        label: 'Compare Stat Ratios',
        component: <StatTargetRatiosWizardStep mode="comparison" />,
      });
    }
    
    if (comparisonPageSelections.trainingRegime) {
      pages.push({
        key: 'trainingRegime',
        label: 'Compare Training Regime',
        component: <TrainingRegimeWizardStep mode="comparison" onSelectionsChange={handleComparisonTrainingSelectionsChange} />,
      });
    }
    
    return pages;
  }, [comparisonPageSelections, handleComparisonTrainingSelectionsChange]);
  
  const comparisonPageSteps = getComparisonPageSteps();
  const isInComparisonPhase = activeStep >= 8; // Step 8+ are dynamic comparison steps
  const comparisonPhaseStepIndex = activeStep - 8;
  
  // Build comparison training sub-steps (only if training regime is selected for comparison)
  const getComparisonTrainingSubSteps = useCallback(() => {
    const subSteps: Array<{ key: string; label: string; component: React.ReactElement }> = [];
    
    if (comparisonTrainingSelections.edvd) {
      subSteps.push({
        key: 'edvd',
        label: 'Compare eDVD Configuration',
        component: <EdvdJumpWizardSubStep mode="comparison" />,
      });
    }
    
    if (comparisonTrainingSelections.candy) {
      subSteps.push({
        key: 'candy',
        label: 'Compare Half Candy Configuration',
        component: <CandyJumpWizardSubStep mode="comparison" />,
      });
    }
    
    if (comparisonTrainingSelections.stackedCandy) {
      subSteps.push({
        key: 'stackedCandy',
        label: 'Compare Stacked Candy Configuration',
        component: <StackedCandyJumpWizardSubStep mode="comparison" />,
      });
    }
    
    if (comparisonTrainingSelections.energy) {
      subSteps.push({
        key: 'energy',
        label: 'Compare Energy Configuration',
        component: <EnergyJumpWizardSubStep mode="comparison" />,
      });
    }
    
    if (comparisonTrainingSelections.fhc) {
      subSteps.push({
        key: 'fhc',
        label: 'Compare FHC Configuration',
        component: <FhcJumpWizardSubStep mode="comparison" />,
      });
    }
    
    return subSteps;
  }, [comparisonTrainingSelections]);
  
  const comparisonTrainingSubSteps = getComparisonTrainingSubSteps();
  
  // Check if we're showing training regime comparison and in its sub-steps
  const isInComparisonTrainingSubStep = (() => {
    if (!isInComparisonPhase) return false;
    const currentStep = comparisonPageSteps[comparisonPhaseStepIndex];
    if (!currentStep || currentStep.key !== 'trainingRegime') return false;
    return comparisonTrainingSubSteps.length > 0 && comparisonSubStepIndex < comparisonTrainingSubSteps.length;
  })();

  // Function to copy wizard data to gym comparison localStorage
  const copyWizardDataToGymComparison = () => {
    const wizardKeys = [
      'apiKey', 
      'initialStats', 
      'currentGymIndex',
      'gymProgressPercent',
      'months', 
      'simulatedDate',
      'maxEnergy',
      'hoursPlayedPerDay',
      'xanaxPerDay',
      'hasPointsRefill',
      'daysSkippedPerMonth',
      'baseHappy',
      'perkPercs',
      'companyBenefitKey',
      'candleShopStars'
    ];
    
    wizardKeys.forEach(key => {
      const wizardValue = localStorage.getItem(`gymWizard_${key}`);
      if (wizardValue) {
        localStorage.setItem(`gymComparison_${key}`, wizardValue);
      }
    });
    
    // Convert and copy stat ratio selections
    try {
      const hasBalancedBuild = JSON.parse(localStorage.getItem('gymWizard_hasBalancedBuild') || 'null');
      const statRatio = JSON.parse(localStorage.getItem('gymWizard_statRatio') || 'null');
      const defDexPrimaryStat = JSON.parse(localStorage.getItem('gymWizard_defDexPrimaryStat') || 'null');
      const trainByPerks = JSON.parse(localStorage.getItem('gymWizard_trainByPerks') || 'null');
      const balanceAfterGym = JSON.parse(localStorage.getItem('gymWizard_balanceAfterGym') || 'null');

      // Convert to stat weights
      const statWeights = convertWizardSelectionsToStatWeights(hasBalancedBuild, statRatio, defDexPrimaryStat);
      
      // Convert to stat drift percentage
      const statDriftPercent = convertTrainByPerksToStatDrift(trainByPerks);
      
      // Convert to balance after gym index
      const balanceAfterGymIndex = convertBalanceAfterGymToGymIndex(balanceAfterGym);
      
      // Set ignorePerksForGymSelection based on trainByPerks
      const ignorePerksForGymSelection = trainByPerks === 'balanced';

      // Store the converted values for the first section of the first comparison state
      // These will be used when initializing the gym comparison
      localStorage.setItem('gymComparison_wizardStatWeights', JSON.stringify(statWeights));
      localStorage.setItem('gymComparison_wizardStatDriftPercent', JSON.stringify(statDriftPercent));
      localStorage.setItem('gymComparison_wizardBalanceAfterGymIndex', JSON.stringify(balanceAfterGymIndex));
      localStorage.setItem('gymComparison_wizardIgnorePerksForGymSelection', JSON.stringify(ignorePerksForGymSelection));
    } catch (err) {
      console.error('Failed to convert wizard stat ratio selections:', err);
    }

    // Copy company benefit selections
    try {
      const companyBenefitKey = JSON.parse(localStorage.getItem('gymWizard_companyBenefitKey') || 'null');
      const candleShopStars = JSON.parse(localStorage.getItem('gymWizard_candleShopStars') || 'null');
      
      if (companyBenefitKey !== null) {
        localStorage.setItem('gymComparison_wizardCompanyBenefitKey', JSON.stringify(companyBenefitKey));
      }
      if (candleShopStars !== null) {
        localStorage.setItem('gymComparison_wizardCandleShopStars', JSON.stringify(candleShopStars));
      }
    } catch (err) {
      console.error('Failed to copy wizard company benefit selections:', err);
    }
    
    // Set flag to indicate user completed wizard (not skipped)
    localStorage.setItem('gymComparison_fromWizard', 'true');
    
    // Store comparison page selections and mode
    localStorage.setItem('gymComparison_wizardComparisonPageSelections', JSON.stringify(comparisonPageSelections));
    localStorage.setItem('gymComparison_wizardComparisonMode', JSON.stringify(comparisonMode));
  };

  const handleNext = () => {
    // Handle comparison phase navigation (step 8+)
    if (isInComparisonPhase) {
      const currentPageStep = comparisonPageSteps[comparisonPhaseStepIndex];
      
      // If we're in training regime comparison with sub-steps
      if (currentPageStep?.key === 'trainingRegime') {
        if (isInComparisonTrainingSubStep) {
          // Move to next comparison training sub-step
          if (comparisonSubStepIndex < comparisonTrainingSubSteps.length - 1) {
            setComparisonSubStepIndex(comparisonSubStepIndex + 1);
            return;
          } else {
            // Finished all comparison training sub-steps
            setComparisonSubStepIndex(0);
            // Move to next comparison page or finish
            if (comparisonPhaseStepIndex < comparisonPageSteps.length - 1) {
              setActiveStep(activeStep + 1);
              return;
            } else {
              // Finished all comparison pages - go to gym comparison
              copyWizardDataToGymComparison();
              navigate('/gymComparison');
              return;
            }
          }
        } else {
          // Just finished the comparison training regime selection
          if (comparisonTrainingSubSteps.length > 0) {
            // Enter comparison training sub-steps
            setComparisonSubStepIndex(0);
            return;
          } else {
            // No sub-steps, move to next comparison page or finish
            if (comparisonPhaseStepIndex < comparisonPageSteps.length - 1) {
              setActiveStep(activeStep + 1);
              return;
            } else {
              copyWizardDataToGymComparison();
              navigate('/gymComparison');
              return;
            }
          }
        }
      } else {
        // Non-training-regime comparison page, move to next or finish
        if (comparisonPhaseStepIndex < comparisonPageSteps.length - 1) {
          setActiveStep(activeStep + 1);
          return;
        } else {
          copyWizardDataToGymComparison();
          navigate('/gymComparison');
          return;
        }
      }
    }
    
    // Handle current regime training step (step 5) with sub-steps
    if (activeStep === 5) {
      if (isInSubStep) {
        // Move to next sub-step
        if (subStepIndex < subSteps.length - 1) {
          setSubStepIndex(subStepIndex + 1);
          return;
        } else {
          // Finished all sub-steps, move to Comparison Options (step 6)
          setSubStepIndex(0);
          setActiveStep(6);
          return;
        }
      } else {
        // Just finished the training regime selection page
        if (subSteps.length > 0) {
          // Enter sub-steps
          setSubStepIndex(0);
          return;
        } else {
          // No sub-steps, move to Comparison Options (step 6)
          setActiveStep(6);
          return;
        }
      }
    }
    
    // Handle Comparison Options step (step 6)
    if (activeStep === 6) {
      setActiveStep(7);
      return;
    }
    
    // Handle Select Areas step (step 7)
    if (activeStep === 7) {
      // Check if any comparison pages are selected
      const hasAnySelection = Object.values(comparisonPageSelections).some(v => v);
      if (hasAnySelection) {
        // Move to first dynamic comparison step (step 8)
        setActiveStep(8);
        setComparisonSubStepIndex(0);
      } else {
        // No comparison selections, finish wizard
        copyWizardDataToGymComparison();
        navigate('/gymComparison');
      }
      return;
    }
    
    // For steps 0-4, just move to next step
    setActiveStep((prevStep) => prevStep + 1);
    setSubStepIndex(0);
  };

  const handleBack = () => {
    // Handle comparison phase navigation
    if (isInComparisonPhase) {
      const currentPageStep = comparisonPageSteps[comparisonPhaseStepIndex];
      
      // If we're in comparison training sub-steps
      if (currentPageStep?.key === 'trainingRegime' && isInComparisonTrainingSubStep) {
        if (comparisonSubStepIndex > 0) {
          setComparisonSubStepIndex(comparisonSubStepIndex - 1);
          return;
        } else {
          // Exit comparison training sub-steps
          setComparisonSubStepIndex(0);
          return;
        }
      }
      
      // Move back to previous comparison page or exit comparison phase
      if (comparisonPhaseStepIndex > 0) {
        setActiveStep(activeStep - 1);
        setComparisonSubStepIndex(0);
      } else {
        // Go back to Select Areas (step 7)
        setActiveStep(7);
        setComparisonSubStepIndex(0);
      }
      return;
    }
    
    // Handle current regime navigation
    if (isInSubStep) {
      if (subStepIndex > 0) {
        setSubStepIndex(subStepIndex - 1);
      } else {
        // Exit sub-steps (stay on step 5 but show main content)
        setSubStepIndex(0);
      }
    } else {
      setActiveStep((prevStep) => prevStep - 1);
      setSubStepIndex(0);
    }
  };

  const handleSkip = () => {
    // Skip wizard and go directly to gym comparison
    // Don't set the wizard flag - user is advanced
    navigate('/gymComparison');
  };

  const handleStepClick = (stepIndex: number) => {
    setActiveStep(stepIndex);
    setSubStepIndex(0); // Reset sub-step when jumping to a different main step
  };

  const handleTrainingSelectionsChange = useCallback((selections: TrainingRegimeSelections) => {
    setTrainingSelections(selections);
  }, []);

  const handleComparisonOptionChange = useCallback((option: ComparisonOptionType) => {
    setComparisonOption(option);
  }, []);

  const handleComparisonSelectionsChange = useCallback((selections: ComparisonPageSelections) => {
    setComparisonPageSelections(selections);
  }, []);

  const handleComparisonModeChange = useCallback((mode: ComparisonMode) => {
    setComparisonMode(mode);
  }, []);

  // Build the stepper steps dynamically based on comparison selections
  const buildStepperSteps = () => {
    const steps = [...baseWizardSteps];
    
    // Add dynamic comparison page steps if we have any selected
    if (comparisonPageSteps.length > 0) {
      comparisonPageSteps.forEach((page) => {
        steps.push({
          label: page.label,
          description: `Configure comparison for ${page.label}`,
        });
      });
    }
    
    return steps;
  };
  
  const stepperSteps = buildStepperSteps();
  
  // Calculate current step label for display
  const getCurrentStepLabel = () => {
    if (isInSubStep) {
      return `${baseWizardSteps[5].label} (${subStepIndex + 1}/${subSteps.length})`;
    }
    if (isInComparisonPhase && isInComparisonTrainingSubStep) {
      return `Compare Training (${comparisonSubStepIndex + 1}/${comparisonTrainingSubSteps.length})`;
    }
    return stepperSteps[activeStep]?.label || '';
  };
  
  // Determine the button label
  const getNextButtonLabel = () => {
    // Check if we're at the last step and can finish
    const hasComparisonSelections = Object.values(comparisonPageSelections).some(v => v);
    
    // Step 7 (Select Areas) with no selections - finish
    if (activeStep === 7 && !hasComparisonSelections) {
      return 'Finish';
    }
    
    // In comparison phase and at last comparison page
    if (isInComparisonPhase) {
      const isLastComparisonPage = comparisonPhaseStepIndex === comparisonPageSteps.length - 1;
      const currentPageStep = comparisonPageSteps[comparisonPhaseStepIndex];
      
      if (currentPageStep?.key === 'trainingRegime') {
        // Check if we're at the last training sub-step or no sub-steps
        if (isInComparisonTrainingSubStep && comparisonSubStepIndex === comparisonTrainingSubSteps.length - 1 && isLastComparisonPage) {
          return 'Finish';
        }
        if (!isInComparisonTrainingSubStep && comparisonTrainingSubSteps.length === 0 && isLastComparisonPage) {
          return 'Finish';
        }
      } else if (isLastComparisonPage) {
        return 'Finish';
      }
    }
    
    return 'Next';
  };

  return (
    <Box sx={{ width: '100%', p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" gutterBottom>
        Gym Comparison Setup Wizard
      </Typography>
      
      <Typography variant="body1" gutterBottom sx={{ mb: 3 }}>
        This wizard will help you set up the gym comparison tool step by step.
      </Typography>

      {/* Stepper for navigation - show first 8 base steps, plus dynamic comparison steps */}
      <Paper sx={{ p: 2, mb: 3, overflowX: 'auto' }}>
        <Stepper 
          activeStep={activeStep} 
          nonLinear
          sx={{ 
            minWidth: stepperSteps.length > 8 ? `${stepperSteps.length * 120}px` : undefined 
          }}
        >
          {stepperSteps.map((step, index) => (
            <Step key={`${step.label}-${index}`}>
              <StepButton 
                onClick={() => handleStepClick(index)}
                disabled={index >= 8 && !Object.values(comparisonPageSelections).some(v => v)}
              >
                <StepLabel>
                  {step.label}
                  {index === 5 && isInSubStep && ` (${subStepIndex + 1}/${subSteps.length})`}
                  {index === activeStep && isInComparisonPhase && isInComparisonTrainingSubStep && 
                    ` (${comparisonSubStepIndex + 1}/${comparisonTrainingSubSteps.length})`}
                </StepLabel>
              </StepButton>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Current step indicator for mobile */}
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, display: { md: 'none' } }}>
        Step {activeStep + 1} of {stepperSteps.length}: {getCurrentStepLabel()}
      </Typography>

      {/* Wizard step content */}
      <Paper sx={{ p: 3, mb: 3, minHeight: '400px' }}>
        {/* Current regime configuration steps (0-5) */}
        {activeStep === 0 && <ApiKeyWizardStep />}
        {activeStep === 1 && <EnergySourcesWizardStep mode="current" />}
        {activeStep === 2 && <HappyPerksWizardStep mode="current" />}
        {activeStep === 3 && <CompanyBenefitsWizardStep mode="current" />}
        {activeStep === 4 && <StatTargetRatiosWizardStep mode="current" />}
        {activeStep === 5 && !isInSubStep && (
          <TrainingRegimeWizardStep mode="current" onSelectionsChange={handleTrainingSelectionsChange} />
        )}
        {activeStep === 5 && isInSubStep && subSteps[subStepIndex]?.component}
        
        {/* Comparison options step (6) */}
        {activeStep === 6 && (
          <ComparisonOptionsWizardStep onOptionChange={handleComparisonOptionChange} />
        )}
        
        {/* Comparison selection step (7) */}
        {activeStep === 7 && (
          <ComparisonSelectionWizardStep 
            onSelectionsChange={handleComparisonSelectionsChange} 
            onModeChange={handleComparisonModeChange}
          />
        )}
        
        {/* Dynamic comparison page steps (8+) */}
        {isInComparisonPhase && (() => {
          const currentStep = comparisonPageSteps[comparisonPhaseStepIndex];
          if (!currentStep) return null;
          
          // For training regime, handle sub-steps
          if (currentStep.key === 'trainingRegime') {
            if (isInComparisonTrainingSubStep) {
              return comparisonTrainingSubSteps[comparisonSubStepIndex]?.component;
            }
            return currentStep.component;
          }
          
          return currentStep.component;
        })()}
      </Paper>

      {/* Navigation buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="outlined"
          onClick={handleSkip}
          sx={{ order: { xs: 3, sm: 1 } }}
        >
          Skip Wizard
        </Button>
        
        <Box sx={{ display: 'flex', gap: 2, order: { xs: 1, sm: 2 } }}>
          <Button
            variant="outlined"
            onClick={handleBack}
            disabled={activeStep === 0 && subStepIndex === 0}
          >
            Previous
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
          >
            {getNextButtonLabel()}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
