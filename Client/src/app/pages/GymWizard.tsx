import { useState } from 'react';
import { Box, Typography, Paper, Button, Stepper, Step, StepLabel, StepButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ApiKeyWizardStep from '../components/gymWizard/ApiKeyWizardStep';
import EnergySourcesWizardStep from '../components/gymWizard/EnergySourcesWizardStep';
import HappyPerksWizardStep from '../components/gymWizard/HappyPerksWizardStep';
import StatTargetRatiosWizardStep from '../components/gymWizard/StatTargetRatiosWizardStep';
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

const wizardSteps = [
  { label: 'Player Stats', description: 'Set up your player stats' },
  { label: 'Energy Sources', description: 'Configure your energy sources' },
  { label: 'Happy & Perks', description: 'Configure your base happy and gym perks' },
  { label: 'Stat Target Ratios', description: 'Configure your stat training strategy' },
  // Future steps will be added here
];

export default function GymWizard() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  // Function to copy wizard data to gym comparison localStorage
  const copyWizardDataToGymComparison = () => {
    const wizardKeys = [
      'apiKey', 
      'initialStats', 
      'currentGymIndex', 
      'months', 
      'simulatedDate',
      'maxEnergy',
      'hoursPlayedPerDay',
      'xanaxPerDay',
      'hasPointsRefill',
      'daysSkippedPerMonth',
      'baseHappy',
      'perkPercs'
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
    
    // Set flag to indicate user completed wizard (not skipped)
    localStorage.setItem('gymComparison_fromWizard', 'true');
  };

  const handleNext = () => {
    if (activeStep === wizardSteps.length - 1) {
      // Last step - copy wizard data, set wizard flag, and go to gym comparison
      copyWizardDataToGymComparison();
      navigate('/gymComparison');
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSkip = () => {
    // Skip wizard and go directly to gym comparison
    // Don't set the wizard flag - user is advanced
    navigate('/gymComparison');
  };

  const handleStepClick = (stepIndex: number) => {
    setActiveStep(stepIndex);
  };

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
          {wizardSteps.map((step, index) => (
            <Step key={step.label}>
              <StepButton onClick={() => handleStepClick(index)}>
                <StepLabel>{step.label}</StepLabel>
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
        {activeStep === 3 && <StatTargetRatiosWizardStep />}
        {/* Future wizard steps will be added here */}
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
            disabled={activeStep === 0}
          >
            Previous
          </Button>
          <Button
            variant="contained"
            onClick={handleNext}
          >
            {activeStep === wizardSteps.length - 1 ? 'Finish' : 'Next'}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
