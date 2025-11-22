import { useState } from 'react';
import { Box, Typography, Paper, Button, Stepper, Step, StepLabel, StepButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ApiKeyWizardStep from '../components/gymWizard/ApiKeyWizardStep';

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
  // Future steps will be added here
];

export default function GymWizard() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  const handleNext = () => {
    if (activeStep === wizardSteps.length - 1) {
      // Last step - go to gym comparison
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
