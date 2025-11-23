import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  Collapse,
} from '@mui/material';
import PlayerStatsSection from '../gymComparison/PlayerStatsSection';

/**
 * ApiKeyWizardStep Component
 * 
 * This wizard step helps users understand whether they want to provide an API key
 * or enter their stats manually. It provides clear explanations for new users.
 */

interface Stats {
  strength: number;
  speed: number;
  defense: number;
  dexterity: number;
}

const DEFAULT_INITIAL_STATS = {
  strength: 0,
  speed: 0,
  defense: 0,
  dexterity: 0,
};

export default function ApiKeyWizardStep() {
  // Load saved preferences from localStorage
  const loadSavedValue = <T,>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(`gymWizard_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [apiKeyPreference, setApiKeyPreference] = useState<'yes' | 'no' | null>(() => 
    loadSavedValue<'yes' | 'no' | null>('apiKeyPreference', null)
  );
  const [apiKey, setApiKey] = useState<string>(() => loadSavedValue('apiKey', ''));
  const [initialStats, setInitialStats] = useState<Stats>(() => 
    loadSavedValue('initialStats', DEFAULT_INITIAL_STATS)
  );
  const [currentGymIndex, setCurrentGymIndex] = useState<number>(() => loadSavedValue('currentGymIndex', 0));
  const [months, setMonths] = useState<number>(() => loadSavedValue('months', 12));
  const [simulatedDate, setSimulatedDate] = useState<Date | null>(() => {
    const saved = loadSavedValue<string | null>('simulatedDate', null);
    return saved ? new Date(saved) : null;
  });
  const [isLoadingGymStats, setIsLoadingGymStats] = useState<boolean>(false);

  // Save values to localStorage
  useEffect(() => {
    localStorage.setItem('gymWizard_apiKeyPreference', JSON.stringify(apiKeyPreference));
  }, [apiKeyPreference]);

  useEffect(() => {
    localStorage.setItem('gymWizard_apiKey', JSON.stringify(apiKey));
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem('gymWizard_initialStats', JSON.stringify(initialStats));
  }, [initialStats]);

  useEffect(() => {
    localStorage.setItem('gymWizard_currentGymIndex', JSON.stringify(currentGymIndex));
  }, [currentGymIndex]);

  useEffect(() => {
    localStorage.setItem('gymWizard_months', JSON.stringify(months));
  }, [months]);

  useEffect(() => {
    localStorage.setItem('gymWizard_simulatedDate', JSON.stringify(simulatedDate ? simulatedDate.toISOString() : null));
  }, [simulatedDate]);

  const handleFetchStats = async () => {
    setIsLoadingGymStats(true);
    try {
      // Fetch directly from Torn API instead of going through our server
      const response = await fetch(`https://api.torn.com/v2/user?selections=battlestats,gym&key=${encodeURIComponent(apiKey)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch gym stats from Torn API');
      }
      
      const data = await response.json();
      
      // Update the values with fetched data
      setInitialStats({
        strength: data.battlestats.strength.value,
        speed: data.battlestats.speed.value,
        defense: data.battlestats.defense.value,
        dexterity: data.battlestats.dexterity.value,
      });
      setCurrentGymIndex(Math.max(0, data.active_gym - 1));
    } catch (err) {
      console.error('Failed to fetch gym stats:', err);
    } finally {
      setIsLoadingGymStats(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Let's Get Started with Your Player Stats
      </Typography>
      
      <Typography variant="body1" paragraph>
        To compare gym training options, we need to know your current battle stats. 
        You can either provide a limited API key to automatically fetch this information, 
        or enter it manually.
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" fontWeight="bold" gutterBottom>
          About This Wizard
        </Typography>
        <Typography variant="body2" paragraph>
          This wizard will first ask about your <strong>current training approach</strong> and stats. 
          Later, you'll be able to compare different strategies and see how they would perform.
        </Typography>
        <Typography variant="body2" fontWeight="bold" gutterBottom>
          About API Keys and Privacy
        </Typography>
        <Typography variant="body2" paragraph>
          Your API key is <strong>never stored on any server</strong>. It is only kept in your browser's 
          local storage and used to fetch your stats directly from Torn's API. The data never 
          leaves your browser except to communicate with Torn's servers.
        </Typography>
        <Typography variant="body2">
          A "Limited" API key is recommended - it can only read basic information and cannot 
          perform any actions on your account.
        </Typography>
      </Alert>

      <Typography variant="h6" gutterBottom>
        How would you like to provide your stats?
      </Typography>

      <RadioGroup
        value={apiKeyPreference || ''}
        onChange={(e) => setApiKeyPreference(e.target.value as 'yes' | 'no')}
      >
        <FormControlLabel 
          value="yes" 
          control={<Radio />} 
          label={
            <Box>
              <Typography variant="body1">
                I'm comfortable providing a Limited API key (Recommended - Quick and Easy)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Get a Limited API key from{' '}
                <a 
                  href="https://www.torn.com/preferences.php#tab=api" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: 'inherit', textDecoration: 'underline' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  Torn Settings → API Key
                </a>
              </Typography>
            </Box>
          }
        />
        <FormControlLabel 
          value="no" 
          control={<Radio />} 
          label="I prefer to enter my stats manually" 
        />
      </RadioGroup>

      {/* Show helpful message for manual entry before the stats fields */}
      {apiKeyPreference === 'no' && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No problem! You can manually enter your battle stats in the fields below. 
          You can find your stats on your Torn profile page.
        </Alert>
      )}

      {/* Show stats input based on preference */}
      <Collapse in={apiKeyPreference !== null} timeout="auto">
        <Box sx={{ mt: 3 }}>
          <PlayerStatsSection
            apiKey={apiKey}
            setApiKey={setApiKey}
            initialStats={initialStats}
            setInitialStats={setInitialStats}
            currentGymIndex={currentGymIndex}
            setCurrentGymIndex={setCurrentGymIndex}
            months={months}
            setMonths={setMonths}
            isLoadingGymStats={isLoadingGymStats}
            handleFetchStats={handleFetchStats}
            simulatedDate={simulatedDate}
            setSimulatedDate={setSimulatedDate}
            hideApiKeySection={apiKeyPreference === 'no'}
            hideApiKeyAlert={apiKeyPreference === 'yes'}
          />
        </Box>
      </Collapse>
    </Box>
  );
}
