import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  Link,
} from '@mui/material';

/**
 * StatTargetRatiosWizardStep Component
 * 
 * This wizard step helps users configure their stat target ratios in a simplified way.
 * Questions are phrased for basic users to understand their current training regime.
 */

export default function StatTargetRatiosWizardStep() {
  // Load saved preferences from localStorage
  const loadSavedValue = <T,>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(`gymWizard_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [hasBalancedBuild, setHasBalancedBuild] = useState<'yes' | 'no' | null>(() => 
    loadSavedValue<'yes' | 'no' | null>('hasBalancedBuild', null)
  );
  const [statRatio, setStatRatio] = useState<'balanced' | 'baldr' | 'hank' | 'defDex' | null>(() => 
    loadSavedValue<'balanced' | 'baldr' | 'hank' | 'defDex' | null>('statRatio', null)
  );
  const [defDexPrimaryStat, setDefDexPrimaryStat] = useState<'defense' | 'dexterity' | null>(() => 
    loadSavedValue<'defense' | 'dexterity' | null>('defDexPrimaryStat', null)
  );
  const [trainByPerks, setTrainByPerks] = useState<'perks' | 'balanced' | null>(() => 
    loadSavedValue<'perks' | 'balanced' | null>('trainByPerks', null)
  );
  const [balanceAfterGym, setBalanceAfterGym] = useState<'chachas' | 'georges' | null>(() => 
    loadSavedValue<'chachas' | 'georges' | null>('balanceAfterGym', null)
  );

  // Save values to localStorage
  useEffect(() => {
    localStorage.setItem('gymWizard_hasBalancedBuild', JSON.stringify(hasBalancedBuild));
  }, [hasBalancedBuild]);

  useEffect(() => {
    localStorage.setItem('gymWizard_statRatio', JSON.stringify(statRatio));
  }, [statRatio]);

  useEffect(() => {
    localStorage.setItem('gymWizard_defDexPrimaryStat', JSON.stringify(defDexPrimaryStat));
  }, [defDexPrimaryStat]);

  useEffect(() => {
    localStorage.setItem('gymWizard_trainByPerks', JSON.stringify(trainByPerks));
  }, [trainByPerks]);

  useEffect(() => {
    localStorage.setItem('gymWizard_balanceAfterGym', JSON.stringify(balanceAfterGym));
  }, [balanceAfterGym]);

  // When hasBalancedBuild changes, reset dependent fields
  useEffect(() => {
    if (hasBalancedBuild === 'yes') {
      setStatRatio('balanced');
    } else if (hasBalancedBuild === 'no') {
      // Don't reset statRatio, let user choose
    }
  }, [hasBalancedBuild]);

  // When statRatio changes, reset dependent fields
  useEffect(() => {
    if (statRatio !== 'defDex' && statRatio !== 'baldr' && statRatio !== 'hank') {
      setDefDexPrimaryStat(null);
    }
  }, [statRatio]);

  // When trainByPerks changes, reset dependent fields
  useEffect(() => {
    if (trainByPerks !== 'perks') {
      setBalanceAfterGym(null);
    }
  }, [trainByPerks]);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Configure Your Stat Target Ratios
      </Typography>
      
      <Typography variant="body1" paragraph>
        Let's understand your <strong>current training regime</strong> - how you train your stats today. 
        This helps us provide accurate projections for your gym progression.
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Note: We're asking about your <strong>current approach</strong> to training, not what you're 
          planning to do in the future. The simulator will help you compare different strategies later.
        </Typography>
      </Alert>

      {/* Question 1: Balanced build? */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          1. Do you maintain a balanced build across all four stats?
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          A balanced build means all your stats (Strength, Speed, Defense, and Dexterity) are roughly equal, 
          like 25% each or close to it.
        </Typography>
        <RadioGroup
          value={hasBalancedBuild || ''}
          onChange={(e) => setHasBalancedBuild(e.target.value as 'yes' | 'no')}
        >
          <FormControlLabel 
            value="yes" 
            control={<Radio />} 
            label="Yes, I keep all my stats balanced (roughly equal)" 
          />
          <FormControlLabel 
            value="no" 
            control={<Radio />} 
            label="No, I follow a specific stat ratio" 
          />
        </RadioGroup>
      </Box>

      {/* Question 2: Which ratio? (only if not balanced) */}
      {hasBalancedBuild === 'no' && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            2. Which stat ratio are you currently following?
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Different ratios help you train more efficiently in specialized gyms that give better gains.{' '}
            <Link 
              href="https://www.torn.com/forums.php#/p=threads&f=61&t=16034448&b=0&a=0"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn more about stat ratios
            </Link>
          </Typography>

          <RadioGroup
            value={statRatio || ''}
            onChange={(e) => setStatRatio(e.target.value as 'balanced' | 'baldr' | 'hank' | 'defDex')}
          >
            <FormControlLabel 
              value="baldr" 
              control={<Radio />} 
              label={
                <Box>
                  <Typography variant="body1">
                    Baldr's Ratio
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    More balanced approach - trains two stats in special gyms (one at 30% of total, 
                    one at 25%), and two stats in George's gym (around 22% each). 
                    Keeps your lowest stat at about 22% of your total.
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel 
              value="hank" 
              control={<Radio />} 
              label={
                <Box>
                  <Typography variant="body1">
                    Hank's Ratio
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Maximum gains - trains three stats in special gyms (one high at 35%, 
                    two medium at 28% each), one very low stat in George's (under 10%). 
                    Requires keeping one stat very low for better overall gains.
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel 
              value="defDex" 
              control={<Radio />} 
              label={
                <Box>
                  <Typography variant="body1">
                    Defense/Dexterity Build
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Focus on defensive stats - trains one defensive stat (Defense or Dexterity) 
                    more heavily (25% more than others), while keeping Strength and Speed equal. 
                    You don't train the other defensive stat at all.
                  </Typography>
                </Box>
              }
            />
          </RadioGroup>
        </Box>
      )}

      {/* Question 3: Which def/dex stat? (only if defDex, baldr, or hank ratio selected) */}
      {(statRatio === 'defDex' || statRatio === 'baldr' || statRatio === 'hank') && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            3. Which defensive stat do you train more heavily?
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {statRatio === 'defDex' 
              ? "In a Defense/Dexterity build, you focus on one of these stats while not training the other at all."
              : `In ${statRatio === 'baldr' ? "Baldr's" : "Hank's"} Ratio, you need to choose which defensive stat (Defense or Dexterity) you train more heavily. Both stats are still trained, but one receives more focus.`
            }
          </Typography>
          <RadioGroup
            value={defDexPrimaryStat || ''}
            onChange={(e) => setDefDexPrimaryStat(e.target.value as 'defense' | 'dexterity')}
          >
            <FormControlLabel 
              value="defense" 
              control={<Radio />} 
              label={statRatio === 'defDex' ? "Defense (I don't train Dexterity)" : "Defense (higher priority)"} 
            />
            <FormControlLabel 
              value="dexterity" 
              control={<Radio />} 
              label={statRatio === 'defDex' ? "Dexterity (I don't train Defense)" : "Dexterity (higher priority)"} 
            />
          </RadioGroup>
        </Box>
      )}

      {/* Question 4: Train by perks or maintain balance? (only if ratio is selected) */}
      {(statRatio || hasBalancedBuild === 'yes') && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {hasBalancedBuild === 'yes' ? '2' : (statRatio === 'defDex' || statRatio === 'baldr' || statRatio === 'hank') && defDexPrimaryStat ? '4' : '3'}. 
            How do you decide which stat to train each day?
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Gym and faction perks can give significant bonuses to certain stats, making them gain faster.
          </Typography>
          <RadioGroup
            value={trainByPerks || ''}
            onChange={(e) => setTrainByPerks(e.target.value as 'perks' | 'balanced')}
          >
            <FormControlLabel 
              value="perks" 
              control={<Radio />} 
              label={
                <Box>
                  <Typography variant="body1">
                    I train the stat with the best gym/faction perks
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    You focus on whichever stat currently has the best bonuses, even if it means 
                    your stats become temporarily unbalanced.
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel 
              value="balanced" 
              control={<Radio />} 
              label={
                <Box>
                  <Typography variant="body1">
                    I maintain my target ratio regardless of perks
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    You stick to your chosen build ratio, training stats to keep them balanced 
                    according to your plan.
                  </Typography>
                </Box>
              }
            />
          </RadioGroup>
        </Box>
      )}

      {/* Question 5: When to balance? (only if training by perks) */}
      {trainByPerks === 'perks' && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {hasBalancedBuild === 'yes' ? '3' : (statRatio === 'defDex' || statRatio === 'baldr' || statRatio === 'hank') && defDexPrimaryStat ? '5' : '4'}. 
            When do you plan to start balancing your stats according to your target ratio?
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Many players train opportunistically early on, then switch to maintaining proper ratios 
            once they reach certain gym milestones.
          </Typography>
          <RadioGroup
            value={balanceAfterGym || ''}
            onChange={(e) => setBalanceAfterGym(e.target.value as 'chachas' | 'georges')}
          >
            <FormControlLabel 
              value="chachas" 
              control={<Radio />} 
              label={
                <Box>
                  <Typography variant="body1">
                    When I reach Cha Cha's gym
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Cha Cha's (gym #20) is where the first specialized gym is unlocked
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel 
              value="georges" 
              control={<Radio />} 
              label={
                <Box>
                  <Typography variant="body1">
                    When I reach George's gym
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    George's (gym #24) is the best general-purpose gym with 7.3 gym dots and 10 energy per train
                  </Typography>
                </Box>
              }
            />
          </RadioGroup>
        </Box>
      )}

      {/* Summary based on selections */}
      {(hasBalancedBuild || statRatio) && (trainByPerks || hasBalancedBuild === 'yes') && (
        <Alert severity="success" sx={{ mt: 3 }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Your Training Configuration Summary
          </Typography>
          <Typography variant="body2">
            <strong>Build Type:</strong>{' '}
            {hasBalancedBuild === 'yes' ? 'Balanced' : 
             statRatio === 'baldr' ? `Baldr's Ratio (${defDexPrimaryStat === 'defense' ? 'Defense' : defDexPrimaryStat === 'dexterity' ? 'Dexterity' : 'Defense'} focus)` :
             statRatio === 'hank' ? `Hank's Ratio (${defDexPrimaryStat === 'defense' ? 'Defense' : defDexPrimaryStat === 'dexterity' ? 'Dexterity' : 'Defense'} focus)` :
             statRatio === 'defDex' ? `Defense/Dexterity Build (${defDexPrimaryStat === 'defense' ? 'Defense' : 'Dexterity'} focus)` :
             'Custom'}
          </Typography>
          <Typography variant="body2">
            <strong>Training Approach:</strong>{' '}
            {trainByPerks === 'perks' ? 'Train based on gym/faction perks' : 'Maintain target ratio'}
          </Typography>
          {trainByPerks === 'perks' && balanceAfterGym && (
            <Typography variant="body2">
              <strong>Balance After:</strong>{' '}
              {balanceAfterGym === 'chachas' ? "Cha Cha's gym" : "George's gym"}
            </Typography>
          )}
        </Alert>
      )}
    </Box>
  );
}
