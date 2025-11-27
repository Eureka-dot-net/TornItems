import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  TextField,
  Collapse,
} from '@mui/material';
import { COMPANY_BENEFIT_TYPES } from '../../../lib/constants/gymConstants';

/**
 * CompanyBenefitsWizardStep Component
 * 
 * This wizard step helps users configure their company benefits in a simplified way.
 * Questions are phrased for basic users to understand easily.
 * 
 * @param mode - 'current' for current regime configuration, 'comparison' for comparison configuration
 */

export type WizardMode = 'current' | 'comparison';

interface CompanyBenefitsWizardStepProps {
  mode?: WizardMode;
}

export default function CompanyBenefitsWizardStep({ mode = 'current' }: CompanyBenefitsWizardStepProps) {
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

  const [hasCompanyBenefit, setHasCompanyBenefit] = useState<'yes' | 'no' | null>(() => 
    isComparison
      ? loadSavedValue<'yes' | 'no' | null>('hasCompanyBenefit', loadCurrentValue('hasCompanyBenefit', null))
      : loadSavedValue<'yes' | 'no' | null>('hasCompanyBenefit', null)
  );
  const [companyBenefitKey, setCompanyBenefitKey] = useState<string>(() => 
    isComparison
      ? loadSavedValue('companyBenefitKey', loadCurrentValue('companyBenefitKey', COMPANY_BENEFIT_TYPES.NONE))
      : loadSavedValue('companyBenefitKey', COMPANY_BENEFIT_TYPES.NONE)
  );
  const [candleShopStars, setCandleShopStars] = useState<number>(() => 
    isComparison
      ? loadSavedValue('candleShopStars', loadCurrentValue('candleShopStars', 10))
      : loadSavedValue('candleShopStars', 10)
  );

  // Save values to localStorage
  useEffect(() => {
    localStorage.setItem(`${storagePrefix}hasCompanyBenefit`, JSON.stringify(hasCompanyBenefit));
  }, [hasCompanyBenefit, storagePrefix]);

  useEffect(() => {
    localStorage.setItem(`${storagePrefix}companyBenefitKey`, JSON.stringify(companyBenefitKey));
  }, [companyBenefitKey, storagePrefix]);

  useEffect(() => {
    localStorage.setItem(`${storagePrefix}candleShopStars`, JSON.stringify(candleShopStars));
  }, [candleShopStars, storagePrefix]);

  // When hasCompanyBenefit changes, reset dependent fields
  useEffect(() => {
    if (hasCompanyBenefit === 'no') {
      setCompanyBenefitKey(COMPANY_BENEFIT_TYPES.NONE);
    }
  }, [hasCompanyBenefit]);

  // Get benefit description
  const getBenefitDescription = (key: string): string => {
    switch (key) {
      case COMPANY_BENEFIT_TYPES.MUSIC_STORE:
        return 'Unlocks gym faster (30% faster gym unlocking)';
      case COMPANY_BENEFIT_TYPES.CANDLE_SHOP:
        return `Bonus energy each day (${candleShopStars * 5} energy per day at ${candleShopStars}★)`;
      case COMPANY_BENEFIT_TYPES.FITNESS_CENTER:
        return 'Increases all gym gains by 3%';
      case COMPANY_BENEFIT_TYPES.GENTS_STRIP_CLUB:
        return 'Increases Dexterity gym gains by 10%';
      case COMPANY_BENEFIT_TYPES.LADIES_STRIP_CLUB:
        return 'Increases Defense gym gains by 10%';
      default:
        return '';
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        {isComparison ? 'Configure Comparison Company Benefits' : 'Configure Your Company Benefits'}
      </Typography>
      
      <Typography variant="body1" paragraph>
        {isComparison 
          ? <>Configure the company benefits for your <strong>comparison scenario</strong>. 
              This allows you to see how switching companies or jobs would affect your gym gains.</>
          : <>Some company jobs provide special benefits that help with gym training. 
              Let's see if your current company provides any gym-related perks.</>
        }
      </Typography>

      <Alert severity={isComparison ? 'warning' : 'info'} sx={{ mb: 3 }}>
        <Typography variant="body2">
          {isComparison 
            ? <>These settings are for your <strong>comparison scenario</strong>. Select different 
                company benefits to see how they would impact your training gains.</>
            : <>Note: We're asking about your <strong>current employment</strong>, not what you're 
                planning for the future. The simulator will help you compare different scenarios later.</>
          }
        </Typography>
      </Alert>

      {/* Question 1: Do you have a company benefit? */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {isComparison 
            ? '1. Would your comparison scenario include gym-related company benefits?'
            : '1. Does your current company job provide gym-related benefits?'
          }
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Some companies provide perks that help with gym training, such as bonus energy, 
          faster gym unlocking, or increased gym gains.
        </Typography>
        <RadioGroup
          value={hasCompanyBenefit || ''}
          onChange={(e) => setHasCompanyBenefit(e.target.value as 'yes' | 'no')}
        >
          <FormControlLabel 
            value="yes" 
            control={<Radio />} 
            label={isComparison 
              ? 'Yes, I want to compare with gym-related benefits' 
              : 'Yes, my company provides gym-related benefits'
            }
          />
          <FormControlLabel 
            value="no" 
            control={<Radio />} 
            label={isComparison 
              ? 'No, I want to compare without gym-related benefits' 
              : "No, I don't have gym-related company benefits"
            }
          />
        </RadioGroup>
      </Box>

      {/* Question 2: Which benefit? (only if yes) */}
      {hasCompanyBenefit === 'yes' && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            2. Which company benefit do you have?
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Select the company type that matches your current job. Different companies 
            provide different gym-related perks.
          </Typography>

          <RadioGroup
            value={companyBenefitKey}
            onChange={(e) => setCompanyBenefitKey(e.target.value)}
          >
            <FormControlLabel 
              value={COMPANY_BENEFIT_TYPES.MUSIC_STORE} 
              control={<Radio />} 
              label={
                <Box>
                  <Typography variant="body1">
                    3★ Music Store
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getBenefitDescription(COMPANY_BENEFIT_TYPES.MUSIC_STORE)}
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel 
              value={COMPANY_BENEFIT_TYPES.CANDLE_SHOP} 
              control={<Radio />} 
              label={
                <Box>
                  <Typography variant="body1">
                    Candle Shop
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getBenefitDescription(COMPANY_BENEFIT_TYPES.CANDLE_SHOP)}
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel 
              value={COMPANY_BENEFIT_TYPES.FITNESS_CENTER} 
              control={<Radio />} 
              label={
                <Box>
                  <Typography variant="body1">
                    10★ Fitness Center
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getBenefitDescription(COMPANY_BENEFIT_TYPES.FITNESS_CENTER)}
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel 
              value={COMPANY_BENEFIT_TYPES.GENTS_STRIP_CLUB} 
              control={<Radio />} 
              label={
                <Box>
                  <Typography variant="body1">
                    7★+ Gents Strip Club
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getBenefitDescription(COMPANY_BENEFIT_TYPES.GENTS_STRIP_CLUB)}
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel 
              value={COMPANY_BENEFIT_TYPES.LADIES_STRIP_CLUB} 
              control={<Radio />} 
              label={
                <Box>
                  <Typography variant="body1">
                    7★+ Ladies Strip Club
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getBenefitDescription(COMPANY_BENEFIT_TYPES.LADIES_STRIP_CLUB)}
                  </Typography>
                </Box>
              }
            />
          </RadioGroup>

          {/* Question 3: Candle Shop stars (only if Candle Shop selected) */}
          <Collapse in={companyBenefitKey === COMPANY_BENEFIT_TYPES.CANDLE_SHOP} timeout="auto">
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                3. How many stars does your Candle Shop have?
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                The Candle Shop gym benefit is only available at 7★ to 10★. It provides 5 energy per star (35-50 bonus energy per day).
              </Typography>
              <TextField
                label="Candle Shop Stars (7-10)"
                type="number"
                value={candleShopStars}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  if (!isNaN(value)) {
                    setCandleShopStars(Math.max(7, Math.min(10, value)));
                  }
                }}
                fullWidth
                size="small"
                inputProps={{ min: 7, max: 10, step: 1 }}
                helperText={`This gives you ${candleShopStars * 5} bonus energy per day`}
              />
            </Box>
          </Collapse>
        </Box>
      )}

      {/* Summary based on selections */}
      {hasCompanyBenefit !== null && (
        <Alert severity="success" sx={{ mt: 3 }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            {isComparison ? 'Comparison Company Benefit Configuration' : 'Your Company Benefit Configuration'}
          </Typography>
          {hasCompanyBenefit === 'no' ? (
            <Typography variant="body2">
              {isComparison 
                ? "Your comparison scenario doesn't include gym-related company benefits."
                : "You don't have any gym-related company benefits. This is fine - many players train without company perks."
              }
            </Typography>
          ) : (
            <>
              <Typography variant="body2">
                <strong>Company:</strong>{' '}
                {companyBenefitKey === COMPANY_BENEFIT_TYPES.MUSIC_STORE && '3★ Music Store'}
                {companyBenefitKey === COMPANY_BENEFIT_TYPES.CANDLE_SHOP && `${candleShopStars}★ Candle Shop`}
                {companyBenefitKey === COMPANY_BENEFIT_TYPES.FITNESS_CENTER && '10★ Fitness Center'}
                {companyBenefitKey === COMPANY_BENEFIT_TYPES.GENTS_STRIP_CLUB && '7★+ Gents Strip Club'}
                {companyBenefitKey === COMPANY_BENEFIT_TYPES.LADIES_STRIP_CLUB && '7★+ Ladies Strip Club'}
              </Typography>
              <Typography variant="body2">
                <strong>Benefit:</strong> {getBenefitDescription(companyBenefitKey)}
              </Typography>
            </>
          )}
        </Alert>
      )}
    </Box>
  );
}
