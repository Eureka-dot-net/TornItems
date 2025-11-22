import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Alert,
  Collapse,
  Checkbox,
} from '@mui/material';

/**
 * HappyPerksWizardStep Component
 * 
 * This wizard step helps users configure their base happy and gym perks.
 * Questions are asked one by one to avoid overwhelming basic users.
 */

interface PerkPercs {
  strength: number;
  speed: number;
  defense: number;
  dexterity: number;
}

export default function HappyPerksWizardStep() {
  // Load saved preferences from localStorage
  const loadSavedValue = <T,>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(`gymWizard_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  // Check if user provided API key in section 1
  const apiKey = loadSavedValue<string>('apiKey', '');
  const hasApiKey = apiKey && apiKey.trim().length > 0;

  // State for base happy
  const [baseHappy, setBaseHappy] = useState<number>(() => 
    loadSavedValue('baseHappy', 0)
  );
  const [knowsBaseHappy, setKnowsBaseHappy] = useState<'yes' | 'no' | null>(() => 
    loadSavedValue<'yes' | 'no' | null>('knowsBaseHappy', null)
  );

  // State for perks - if API key exists, we can load from fetched data
  const [perkPercs, setPerkPercs] = useState<PerkPercs>(() => 
    loadSavedValue('perkPercs', { strength: 0, speed: 0, defense: 0, dexterity: 0 })
  );

  // State for manual perk questions (only if no API key)
  const [hasFactionSteadfast, setHasFactionSteadfast] = useState<'yes' | 'no' | null>(() => 
    loadSavedValue<'yes' | 'no' | null>('hasFactionSteadfast', null)
  );
  const [steadfastBonuses, setSteadfastBonuses] = useState<PerkPercs>(() => 
    loadSavedValue('steadfastBonuses', { strength: 0, speed: 0, defense: 0, dexterity: 0 })
  );
  const [hasPrivatePool, setHasPrivatePool] = useState<'yes' | 'no' | null>(() => 
    loadSavedValue<'yes' | 'no' | null>('hasPrivatePool', null)
  );
  const [hasBachelorSportScience, setHasBachelorSportScience] = useState<'yes' | 'no' | null>(() => 
    loadSavedValue<'yes' | 'no' | null>('hasBachelorSportScience', null)
  );
  const [individualCourses, setIndividualCourses] = useState<{
    strength: boolean;
    speed: boolean;
    defense: boolean;
    dexterity: boolean;
  }>(() => 
    loadSavedValue('individualCourses', { strength: false, speed: false, defense: false, dexterity: false })
  );

  // Save values to localStorage
  useEffect(() => {
    localStorage.setItem('gymWizard_baseHappy', JSON.stringify(baseHappy));
  }, [baseHappy]);

  useEffect(() => {
    localStorage.setItem('gymWizard_knowsBaseHappy', JSON.stringify(knowsBaseHappy));
  }, [knowsBaseHappy]);

  useEffect(() => {
    localStorage.setItem('gymWizard_perkPercs', JSON.stringify(perkPercs));
  }, [perkPercs]);

  useEffect(() => {
    localStorage.setItem('gymWizard_hasFactionSteadfast', JSON.stringify(hasFactionSteadfast));
  }, [hasFactionSteadfast]);

  useEffect(() => {
    localStorage.setItem('gymWizard_steadfastBonuses', JSON.stringify(steadfastBonuses));
  }, [steadfastBonuses]);

  useEffect(() => {
    localStorage.setItem('gymWizard_hasPrivatePool', JSON.stringify(hasPrivatePool));
  }, [hasPrivatePool]);

  useEffect(() => {
    localStorage.setItem('gymWizard_hasBachelorSportScience', JSON.stringify(hasBachelorSportScience));
  }, [hasBachelorSportScience]);

  useEffect(() => {
    localStorage.setItem('gymWizard_individualCourses', JSON.stringify(individualCourses));
  }, [individualCourses]);

  // Calculate perk percentages from manual inputs (multiplicative)
  useEffect(() => {
    if (!hasApiKey) {
      // Only recalculate if we don't have API data
      const multipliers = {
        strength: 1,
        speed: 1,
        defense: 1,
        dexterity: 1
      };

      // Apply faction steadfast bonuses
      if (hasFactionSteadfast === 'yes') {
        multipliers.strength *= (1 + steadfastBonuses.strength / 100);
        multipliers.speed *= (1 + steadfastBonuses.speed / 100);
        multipliers.defense *= (1 + steadfastBonuses.defense / 100);
        multipliers.dexterity *= (1 + steadfastBonuses.dexterity / 100);
      }

      // Apply private pool bonus (+2% all stats)
      if (hasPrivatePool === 'yes') {
        multipliers.strength *= 1.02;
        multipliers.speed *= 1.02;
        multipliers.defense *= 1.02;
        multipliers.dexterity *= 1.02;
      }

      // Apply Bachelor of Sports Science (+2% all stats)
      if (hasBachelorSportScience === 'yes') {
        multipliers.strength *= 1.02;
        multipliers.speed *= 1.02;
        multipliers.defense *= 1.02;
        multipliers.dexterity *= 1.02;
      } else if (hasBachelorSportScience === 'no') {
        // Apply individual courses (+1% each)
        if (individualCourses.strength) multipliers.strength *= 1.01;
        if (individualCourses.speed) multipliers.speed *= 1.01;
        if (individualCourses.defense) multipliers.defense *= 1.01;
        if (individualCourses.dexterity) multipliers.dexterity *= 1.01;
      }

      // Convert to percentages
      setPerkPercs({
        strength: (multipliers.strength - 1) * 100,
        speed: (multipliers.speed - 1) * 100,
        defense: (multipliers.defense - 1) * 100,
        dexterity: (multipliers.dexterity - 1) * 100
      });
    }
  }, [hasApiKey, hasFactionSteadfast, steadfastBonuses, hasPrivatePool, hasBachelorSportScience, individualCourses]);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Configure Your Base Happy and Gym Perks
      </Typography>
      
      <Typography variant="body1" paragraph>
        Let's configure your base happy value and gym gain bonuses. These affect how much you gain 
        from training and help us provide accurate projections based on your <strong>current situation</strong>.
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Note: We're asking about your <strong>current state</strong>, not what you're planning for the future. 
          The simulator will help you see how different scenarios would perform.
        </Typography>
      </Alert>

      {/* Question 1: Base Happy */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          1. What is your base happy?
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Your current happy status is shown by the yellow bar in your Information sidebar with a timer 
          next to it. We need the <strong>maximum value when you haven't used any boosters</strong>. 
          {!hasApiKey && ' If you have TornTools installed, you can see this value on the gym page.'}
        </Typography>

        {!hasApiKey && (
          <>
            <RadioGroup
              value={knowsBaseHappy || ''}
              onChange={(e) => setKnowsBaseHappy(e.target.value as 'yes' | 'no')}
            >
              <FormControlLabel 
                value="yes" 
                control={<Radio />} 
                label="I know my base happy value" 
              />
              <FormControlLabel 
                value="no" 
                control={<Radio />} 
                label="I don't know my base happy (we'll use a default estimate)" 
              />
            </RadioGroup>

            <Collapse in={knowsBaseHappy === 'yes'} timeout="auto">
              <Box sx={{ mt: 2 }}>
                <TextField
                  label="Base Happy"
                  type="number"
                  value={baseHappy}
                  onChange={(e) => setBaseHappy(Math.max(0, Math.min(99999, Number(e.target.value))))}
                  fullWidth
                  size="small"
                  inputProps={{ min: 0, max: 99999, step: 1 }}
                  helperText="Enter your base happy value (typically 500-5000)"
                />
              </Box>
            </Collapse>

            {knowsBaseHappy === 'no' && (
              <Alert severity="info" sx={{ mt: 2 }}>
                No problem! We'll use a reasonable default value of 5000 for calculations. 
                You can adjust this later in the comparison tool if needed.
              </Alert>
            )}
          </>
        )}

        {hasApiKey && (
          <TextField
            label="Base Happy"
            type="number"
            value={baseHappy}
            onChange={(e) => setBaseHappy(Math.max(0, Math.min(99999, Number(e.target.value))))}
            fullWidth
            size="small"
            inputProps={{ min: 0, max: 99999, step: 1 }}
            helperText="Enter your base happy value (typically 500-5000)"
          />
        )}
      </Box>

      {/* Perks Section - Different flow if API key exists */}
      {hasApiKey ? (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            2. Review Your Gym Perks
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Since you provided an API key, we've automatically calculated your gym gain bonuses 
            from all sources (faction, property, education, etc.). Please review these values:
          </Typography>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mt: 2 }}>
            <TextField
              label="Strength Perk %"
              type="number"
              value={perkPercs.strength.toFixed(1)}
              InputProps={{ readOnly: true }}
              size="small"
              helperText="Auto-calculated from API"
            />
            <TextField
              label="Speed Perk %"
              type="number"
              value={perkPercs.speed.toFixed(1)}
              InputProps={{ readOnly: true }}
              size="small"
              helperText="Auto-calculated from API"
            />
            <TextField
              label="Defense Perk %"
              type="number"
              value={perkPercs.defense.toFixed(1)}
              InputProps={{ readOnly: true }}
              size="small"
              helperText="Auto-calculated from API"
            />
            <TextField
              label="Dexterity Perk %"
              type="number"
              value={perkPercs.dexterity.toFixed(1)}
              InputProps={{ readOnly: true }}
              size="small"
              helperText="Auto-calculated from API"
            />
          </Box>

          <Alert severity="success" sx={{ mt: 2 }}>
            These perk percentages have been automatically calculated from your faction bonuses, 
            property perks, education courses, and other sources. If these look incorrect, 
            you may need to refresh your API data.
          </Alert>
        </Box>
      ) : (
        // Manual perk questions - show only after happy question is answered
        (knowsBaseHappy !== null || hasApiKey) && (
          <>
            {/* Question 2: Faction Steadfast */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                2. Are you in a faction with the Steadfast bonus?
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                The Steadfast upgrade provides stat-specific gym gain bonuses. If your faction has this, 
                you'll see bonuses like "+5% strength gym gains" for each stat.
              </Typography>
              <RadioGroup
                value={hasFactionSteadfast || ''}
                onChange={(e) => setHasFactionSteadfast(e.target.value as 'yes' | 'no')}
              >
                <FormControlLabel 
                  value="yes" 
                  control={<Radio />} 
                  label="Yes, my faction has Steadfast bonuses" 
                />
                <FormControlLabel 
                  value="no" 
                  control={<Radio />} 
                  label="No, my faction doesn't have Steadfast" 
                />
              </RadioGroup>

              <Collapse in={hasFactionSteadfast === 'yes'} timeout="auto">
                <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                  <TextField
                    label="Strength Bonus (%)"
                    type="number"
                    value={steadfastBonuses.strength}
                    onChange={(e) => setSteadfastBonuses({
                      ...steadfastBonuses,
                      strength: Math.max(0, Number(e.target.value))
                    })}
                    size="small"
                    inputProps={{ min: 0, step: 1 }}
                  />
                  <TextField
                    label="Speed Bonus (%)"
                    type="number"
                    value={steadfastBonuses.speed}
                    onChange={(e) => setSteadfastBonuses({
                      ...steadfastBonuses,
                      speed: Math.max(0, Number(e.target.value))
                    })}
                    size="small"
                    inputProps={{ min: 0, step: 1 }}
                  />
                  <TextField
                    label="Defense Bonus (%)"
                    type="number"
                    value={steadfastBonuses.defense}
                    onChange={(e) => setSteadfastBonuses({
                      ...steadfastBonuses,
                      defense: Math.max(0, Number(e.target.value))
                    })}
                    size="small"
                    inputProps={{ min: 0, step: 1 }}
                  />
                  <TextField
                    label="Dexterity Bonus (%)"
                    type="number"
                    value={steadfastBonuses.dexterity}
                    onChange={(e) => setSteadfastBonuses({
                      ...steadfastBonuses,
                      dexterity: Math.max(0, Number(e.target.value))
                    })}
                    size="small"
                    inputProps={{ min: 0, step: 1 }}
                  />
                </Box>
              </Collapse>
            </Box>

            {/* Question 3: Private Pool */}
            {hasFactionSteadfast !== null && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  3. Do you live in a property with a private pool?
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  A private pool provides a +2% bonus to all gym stats.
                </Typography>
                <RadioGroup
                  value={hasPrivatePool || ''}
                  onChange={(e) => setHasPrivatePool(e.target.value as 'yes' | 'no')}
                >
                  <FormControlLabel 
                    value="yes" 
                    control={<Radio />} 
                    label="Yes, I have a private pool (+2% all stats)" 
                  />
                  <FormControlLabel 
                    value="no" 
                    control={<Radio />} 
                    label="No, I don't have a private pool" 
                  />
                </RadioGroup>
              </Box>
            )}

            {/* Question 4: Education Courses */}
            {hasPrivatePool !== null && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  4. Do you have Bachelor of Sports Science?
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Bachelor of Sports Science provides +2% to all gym stats. If you don't have this, 
                  you may have individual stat-specific courses that provide +1% each.
                </Typography>
                <RadioGroup
                  value={hasBachelorSportScience || ''}
                  onChange={(e) => setHasBachelorSportScience(e.target.value as 'yes' | 'no')}
                >
                  <FormControlLabel 
                    value="yes" 
                    control={<Radio />} 
                    label="Yes, I have Bachelor of Sports Science (+2% all stats)" 
                  />
                  <FormControlLabel 
                    value="no" 
                    control={<Radio />} 
                    label="No, but I may have individual stat courses" 
                  />
                </RadioGroup>

                <Collapse in={hasBachelorSportScience === 'no'} timeout="auto">
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Select which individual stat courses you have completed (+1% each):
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={individualCourses.strength}
                            onChange={(e) => setIndividualCourses({
                              ...individualCourses,
                              strength: e.target.checked
                            })}
                          />
                        }
                        label="Strength course (+1% strength gym gains)"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={individualCourses.speed}
                            onChange={(e) => setIndividualCourses({
                              ...individualCourses,
                              speed: e.target.checked
                            })}
                          />
                        }
                        label="Speed course (+1% speed gym gains)"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={individualCourses.defense}
                            onChange={(e) => setIndividualCourses({
                              ...individualCourses,
                              defense: e.target.checked
                            })}
                          />
                        }
                        label="Defense course (+1% defense gym gains)"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={individualCourses.dexterity}
                            onChange={(e) => setIndividualCourses({
                              ...individualCourses,
                              dexterity: e.target.checked
                            })}
                          />
                        }
                        label="Dexterity course (+1% dexterity gym gains)"
                      />
                    </Box>
                  </Box>
                </Collapse>
              </Box>
            )}

            {/* Summary of calculated perks */}
            {hasBachelorSportScience !== null && (
              <Alert severity="success" sx={{ mt: 3 }}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>
                  Your Calculated Gym Perks
                </Typography>
                <Typography variant="body2">
                  Based on your answers, your gym gain bonuses are:
                </Typography>
                <Box sx={{ mt: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
                  <Typography variant="body2">
                    <strong>Strength:</strong> +{perkPercs.strength.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2">
                    <strong>Speed:</strong> +{perkPercs.speed.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2">
                    <strong>Defense:</strong> +{perkPercs.defense.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2">
                    <strong>Dexterity:</strong> +{perkPercs.dexterity.toFixed(1)}%
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Note: These calculations don't include job bonuses, as those will be asked in the next section.
                </Typography>
              </Alert>
            )}
          </>
        )
      )}
    </Box>
  );
}
