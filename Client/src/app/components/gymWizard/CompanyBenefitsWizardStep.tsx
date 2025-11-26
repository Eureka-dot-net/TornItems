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
 */

export default function CompanyBenefitsWizardStep() {
  // Load saved preferences from localStorage
  const loadSavedValue = <T,>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(`gymWizard_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [hasCompanyBenefit, setHasCompanyBenefit] = useState<'yes' | 'no' | null>(() => 
    loadSavedValue<'yes' | 'no' | null>('hasCompanyBenefit', null)
  );
  const [companyBenefitKey, setCompanyBenefitKey] = useState<string>(() => 
    loadSavedValue('companyBenefitKey', COMPANY_BENEFIT_TYPES.NONE)
  );
  const [candleShopStars, setCandleShopStars] = useState<number>(() => 
    loadSavedValue('candleShopStars', 10)
  );

  // Save values to localStorage
  useEffect(() => {
    localStorage.setItem('gymWizard_hasCompanyBenefit', JSON.stringify(hasCompanyBenefit));
  }, [hasCompanyBenefit]);

  useEffect(() => {
    localStorage.setItem('gymWizard_companyBenefitKey', JSON.stringify(companyBenefitKey));
  }, [companyBenefitKey]);

  useEffect(() => {
    localStorage.setItem('gymWizard_candleShopStars', JSON.stringify(candleShopStars));
  }, [candleShopStars]);

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
        Configure Your Company Benefits
      </Typography>
      
      <Typography variant="body1" paragraph>
        Some company jobs provide special benefits that help with gym training. 
        Let's see if your current company provides any gym-related perks.
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Note: We're asking about your <strong>current employment</strong>, not what you're 
          planning for the future. The simulator will help you compare different scenarios later.
        </Typography>
      </Alert>

      {/* Question 1: Do you have a company benefit? */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          1. Does your current company job provide gym-related benefits?
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
            label="Yes, my company provides gym-related benefits" 
          />
          <FormControlLabel 
            value="no" 
            control={<Radio />} 
            label="No, I don't have gym-related company benefits" 
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
                The Candle Shop provides 5 energy per star. A 10★ shop gives 50 bonus energy per day.
              </Typography>
              <TextField
                label="Candle Shop Stars"
                type="number"
                value={candleShopStars}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setCandleShopStars(Math.max(1, Math.min(10, value)));
                }}
                fullWidth
                size="small"
                inputProps={{ min: 1, max: 10, step: 1 }}
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
            Your Company Benefit Configuration
          </Typography>
          {hasCompanyBenefit === 'no' ? (
            <Typography variant="body2">
              You don't have any gym-related company benefits. This is fine - many players 
              train without company perks.
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
