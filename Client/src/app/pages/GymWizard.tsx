import { useState, useCallback, useEffect } from 'react';
import { Box, Typography, Paper, Button, Stepper, Step, StepLabel, StepButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ApiKeyWizardStep from '../components/gymWizard/ApiKeyWizardStep';
import EnergySourcesWizardStep from '../components/gymWizard/EnergySourcesWizardStep';
import HappyPerksWizardStep from '../components/gymWizard/HappyPerksWizardStep';
import CompanyBenefitsWizardStep from '../components/gymWizard/CompanyBenefitsWizardStep';
import StatTargetRatiosWizardStep from '../components/gymWizard/StatTargetRatiosWizardStep';
import TrainingRegimeWizardStep, { type TrainingRegimeSelections } from '../components/gymWizard/TrainingRegimeWizardStep';
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
 */

const baseWizardSteps = [
  { label: 'Player Stats', description: 'Set up your player stats' },
  { label: 'Energy Sources', description: 'Configure your energy sources' },
  { label: 'Happy & Perks', description: 'Configure your base happy and gym perks' },
  { label: 'Company Benefits', description: 'Configure your company benefits' },
  { label: 'Stat Target Ratios', description: 'Configure your stat training strategy' },
  { label: 'Training Regime', description: 'Configure your training methods' },
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
  };

  const handleNext = () => {
    // If we're on the training regime step (step 5)
    if (activeStep === 5) {
      // If we're in a sub-step
      if (isInSubStep) {
        // Move to next sub-step
        if (subStepIndex < subSteps.length - 1) {
          setSubStepIndex(subStepIndex + 1);
          return;
        } else {
          // Finished all sub-steps, move to next main step (or finish)
          setSubStepIndex(0);
          // No more main steps after training regime, so finish
          copyWizardDataToGymComparison();
          navigate('/gymComparison');
          return;
        }
      } else {
        // Just finished the training regime selection page
        // If there are sub-steps, go to first sub-step
        if (subSteps.length > 0) {
          setSubStepIndex(0);
          // Stay on step 5 but now show sub-step
          setActiveStep(5);
          return;
        } else {
          // No sub-steps selected, finish wizard
          copyWizardDataToGymComparison();
          navigate('/gymComparison');
          return;
        }
      }
    }
    
    // For other steps, just move to next step
    if (activeStep === baseWizardSteps.length - 1) {
      // Last step - copy wizard data, set wizard flag, and go to gym comparison
      copyWizardDataToGymComparison();
      navigate('/gymComparison');
    } else {
      setActiveStep((prevStep) => prevStep + 1);
      setSubStepIndex(0); // Reset sub-step when moving to new main step
    }
  };

  const handleBack = () => {
    // If we're in a sub-step
    if (isInSubStep) {
      if (subStepIndex > 0) {
        // Go to previous sub-step
        setSubStepIndex(subStepIndex - 1);
      } else {
        // Go back to training regime selection (stay on step 4 but exit sub-steps)
        setSubStepIndex(0);
        // Force re-render by not changing activeStep
      }
    } else {
      // Normal navigation
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

  return (
    <Box sx={{ width: '100%', p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" gutterBottom>
        Gym Comparison Setup Wizard
      </Typography>
      
      <Typography variant="body1" gutterBottom sx={{ mb: 3 }}>
        This wizard will help you set up the gym comparison tool step by step.
      </Typography>

      {/* Stepper for navigation */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stepper activeStep={activeStep} nonLinear>
          {baseWizardSteps.map((step, index) => (
            <Step key={step.label}>
              <StepButton onClick={() => handleStepClick(index)}>
                <StepLabel>
                  {step.label}
                  {index === 5 && isInSubStep && ` (${subStepIndex + 1}/${subSteps.length})`}
                </StepLabel>
              </StepButton>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Wizard step content */}
      <Paper sx={{ p: 3, mb: 3, minHeight: '400px' }}>
        {activeStep === 0 && <ApiKeyWizardStep />}
        {activeStep === 1 && <EnergySourcesWizardStep />}
        {activeStep === 2 && <HappyPerksWizardStep />}
        {activeStep === 3 && <CompanyBenefitsWizardStep />}
        {activeStep === 4 && <StatTargetRatiosWizardStep />}
        {activeStep === 5 && !isInSubStep && (
          <TrainingRegimeWizardStep onSelectionsChange={handleTrainingSelectionsChange} />
        )}
        {activeStep === 5 && isInSubStep && subSteps[subStepIndex]?.component}
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
            {(activeStep === baseWizardSteps.length - 1 && !isInSubStep && subSteps.length === 0) || 
             (isInSubStep && subStepIndex === subSteps.length - 1)
              ? 'Finish'
              : 'Next'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
