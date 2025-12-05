import { Alert, Box, Button, Checkbox, CircularProgress, FormControl, FormControlLabel, Grid, InputLabel, MenuItem, Paper, Select, TextField, Typography } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useState, useEffect } from 'react';
import { GYMS } from '../../../lib/data/gyms';
import HistoricalDataConfig from './HistoricalDataConfig';
import { type HistoricalStat } from '../../../lib/hooks/useHistoricalStats';
import axios from 'axios';
import { fetchUserProfile } from '../../../lib/utils/tornApiHelpers';
import { NumericTextField } from '../../../lib/components';
import { useTrainingAuth } from '../../../lib/hooks/useTrainingAuth';

interface Stats {
  strength: number;
  speed: number;
  defense: number;
  dexterity: number;
}

interface PlayerStatsSectionProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  initialStats: Stats;
  setInitialStats: (stats: Stats) => void;
  currentGymIndex: number;
  setCurrentGymIndex: (index: number) => void;
  months: number;
  setMonths: (months: number) => void;
  isLoadingGymStats: boolean;
  handleFetchStats: () => void;
  simulatedDate: Date | null;
  setSimulatedDate: (date: Date | null) => void;
  monthValidationError?: string | null;
  onHistoricalDataFetched?: (data: HistoricalStat[]) => void;
  onEnabledChange?: (enabled: boolean) => void;
  hideApiKeySection?: boolean;
  hideApiKeyAlert?: boolean;
  hideStartDateSection?: boolean;
  gymProgressPercent?: number;
  setGymProgressPercent?: (percent: number) => void;
  durationUnit?: 'days' | 'weeks' | 'months';
  setDurationUnit?: (unit: 'days' | 'weeks' | 'months') => void;
  statsFetchedWithApiKey?: boolean;
}

export default function PlayerStatsSection({
  apiKey,
  setApiKey,
  initialStats,
  setInitialStats,
  currentGymIndex,
  setCurrentGymIndex,
  months,
  setMonths,
  isLoadingGymStats,
  handleFetchStats,
  simulatedDate,
  setSimulatedDate,
  monthValidationError,
  onHistoricalDataFetched,
  onEnabledChange,
  hideApiKeySection = false,
  hideApiKeyAlert = false,
  hideStartDateSection = false,
  gymProgressPercent,
  setGymProgressPercent,
  durationUnit = 'months',
  setDurationUnit,
  statsFetchedWithApiKey = false,
}: PlayerStatsSectionProps) {
  // Training auth hook for authenticating users when they enter API key
  const { authenticateWithUserInfo } = useTrainingAuth();
  
  // Constants for date validation
  const TORN_RELEASE_DATE = new Date('2004-11-16');
  const getYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);
    return yesterday;
  };
  
  // State for user's account sign-up date (fetched from API)
  const [userSignUpDate, setUserSignUpDate] = useState<Date | null>(() => {
    try {
      const saved = localStorage.getItem('userSignUpDate');
      return saved ? new Date(JSON.parse(saved)) : null;
    } catch {
      return null;
    }
  });
  
  // Save userSignUpDate to localStorage
  useEffect(() => {
    if (userSignUpDate) {
      localStorage.setItem('userSignUpDate', JSON.stringify(userSignUpDate.toISOString()));
    }
  }, [userSignUpDate]);
  
  // Calculate the minimum date for the DatePicker
  // Use user's sign-up date if available, otherwise fall back to Torn release date
  const getMinDate = () => {
    return userSignUpDate || TORN_RELEASE_DATE;
  };
  
  // Helper functions to convert duration
  const convertToMonths = (value: number, unit: 'days' | 'weeks' | 'months'): number => {
    if (unit === 'days') return value / 30;
    if (unit === 'weeks') return value / 4.34524; // Average weeks per month
    return value;
  };
  
  const convertFromMonths = (months: number, unit: 'days' | 'weeks' | 'months'): number => {
    if (unit === 'days') return Math.round(months * 30);
    if (unit === 'weeks') return Math.round(months * 4.34524);
    return months;
  };
  
  // Get display value based on current unit
  const displayValue = convertFromMonths(months, durationUnit);
  
  // State for fetching stats at simulated date
  const [fetchStatsAtDate, setFetchStatsAtDate] = useState(() => {
    try {
      const saved = localStorage.getItem('fetchStatsAtDate');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  
  // Save fetchStatsAtDate to localStorage
  useEffect(() => {
    localStorage.setItem('fetchStatsAtDate', JSON.stringify(fetchStatsAtDate));
  }, [fetchStatsAtDate]);
  
  // Enhanced fetch function that can fetch at a specific date
  // Also fetches user profile to get sign-up date for date picker limits
  const handleEnhancedFetch = async () => {
    if (!apiKey.trim()) {
      return;
    }
    
    try {
      if (fetchStatsAtDate && simulatedDate) {
        // Fetch stats at the simulated date using Torn API v2
        const timestamp = Math.floor(simulatedDate.getTime() / 1000);
        const response = await axios.get('https://api.torn.com/v2/user/personalstats', {
          params: {
            stat: 'strength,speed,defense,dexterity',
            timestamp,
            key: apiKey,
          },
        });
        
        const personalstats = response.data.personalstats;
        const stats = {
          strength: 0,
          speed: 0,
          defense: 0,
          dexterity: 0,
        };
        
        if (Array.isArray(personalstats)) {
          personalstats.forEach((item: { name: string; value: number }) => {
            if (item.name === 'strength') stats.strength = item.value;
            else if (item.name === 'speed') stats.speed = item.value;
            else if (item.name === 'defense') stats.defense = item.value;
            else if (item.name === 'dexterity') stats.dexterity = item.value;
          });
        }
        
        setInitialStats(stats);
      } else {
        // Call the original fetch function for current stats
        handleFetchStats();
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      // Fallback to regular fetch if date-based fetch fails
      handleFetchStats();
    }
    
    // Also fetch user profile to get sign-up date for date picker limits
    // and to authenticate user for training recommendations
    try {
      const profileData = await fetchUserProfile(apiKey);
      if (profileData.profile?.signed_up) {
        // Convert Unix timestamp to Date
        const signUpDate = new Date(profileData.profile.signed_up * 1000);
        setUserSignUpDate(signUpDate);
      }
      
      // Authenticate user for training recommendations (silently, result ignored)
      if (profileData.profile?.id && profileData.profile?.name) {
        // Fire and forget - we don't want to block on auth check
        void authenticateWithUserInfo(profileData.profile.id, profileData.profile.name);
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
      // Non-critical error - date picker will use Torn release date as fallback
    }
  };
  
  return (
    <>
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>Fixed options</Typography>
      
      {monthValidationError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {monthValidationError}
        </Alert>
      )}
      
      {/* Start Date + Checkbox - Top section (only shown when hideStartDateSection is false) */}
      {!hideStartDateSection && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={simulatedDate}
                onChange={(newValue) => {
                  // Only accept valid dates within the min/max range
                  if (newValue === null) {
                    setSimulatedDate(null);
                    return;
                  }
                  
                  // Check if it's a valid date
                  if (isNaN(newValue.getTime())) {
                    return; // Ignore invalid dates
                  }
                  
                  const minDate = getMinDate();
                  const maxDate = getYesterday();
                  
                  // Compare dates by setting to start of day to avoid time-related issues
                  const newValueDate = new Date(newValue.getFullYear(), newValue.getMonth(), newValue.getDate());
                  const minDateCompare = new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
                  const maxDateCompare = new Date(maxDate.getFullYear(), maxDate.getMonth(), maxDate.getDate());
                  
                  // Validate against min/max
                  if (newValueDate < minDateCompare || newValueDate > maxDateCompare) {
                    return; // Ignore dates outside valid range
                  }
                  
                  setSimulatedDate(newValue);
                }}
                minDate={getMinDate()}
                maxDate={getYesterday()}
                slotProps={{ 
                  textField: { 
                    size: 'small',
                    fullWidth: true,
                    helperText: userSignUpDate 
                      ? `Sets the start date for the graph and Diabetes Day calculations (Nov 13-15). Min: ${userSignUpDate.toLocaleDateString()}`
                      : 'Sets the start date for the graph and Diabetes Day calculations (Nov 13-15).'
                  } 
                }}
              />
            </LocalizationProvider>
          </Grid>
          {!hideApiKeySection && (
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={fetchStatsAtDate}
                    onChange={(e) => setFetchStatsAtDate(e.target.checked)}
                    size="small"
                  />
                }
                label="Fetch starting stats at this date"
                sx={{ mt: 1 }}
              />
            </Grid>
          )}
        </Grid>
      )}
      
      {/* API Key Section - Only show if not hidden */}
      {!hideApiKeySection && (
        <Box sx={{ mb: 3 }}>
          {!hideApiKeyAlert && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Optional: Enter a Limited API Key to auto-fetch your stats, or fill them in manually below. Get one from{' '}
              <a href="https://www.torn.com/preferences.php#tab=api" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
                Torn Settings → API Key
              </a>
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label="Torn API Key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              size="small"
              sx={{ flex: 1 }}
            />
            <Button variant="outlined" onClick={handleEnhancedFetch} disabled={isLoadingGymStats || !apiKey.trim()}>
              {isLoadingGymStats ? <CircularProgress size={20} /> : 'Fetch'}
            </Button>
          </Box>
        </Box>
      )}
      
      {/* Starting Stats - Four fields in one row */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <NumericTextField 
            label="Strength" 
            value={initialStats.strength} 
            onChange={(value) => setInitialStats({ ...initialStats, strength: value })} 
            size="small" 
            fullWidth
            min={0}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <NumericTextField 
            label="Speed" 
            value={initialStats.speed} 
            onChange={(value) => setInitialStats({ ...initialStats, speed: value })} 
            size="small" 
            fullWidth
            min={0}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <NumericTextField 
            label="Defense" 
            value={initialStats.defense} 
            onChange={(value) => setInitialStats({ ...initialStats, defense: value })} 
            size="small" 
            fullWidth
            min={0}
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <NumericTextField 
            label="Dexterity" 
            value={initialStats.dexterity} 
            onChange={(value) => setInitialStats({ ...initialStats, dexterity: value })} 
            size="small" 
            fullWidth
            min={0}
          />
        </Grid>
      </Grid>
      
      {/* Other Options - Duration, Starting Gym, and Gym Progress */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, md: 3 }}>
          <NumericTextField 
            label={`Duration (${durationUnit})`}
            value={displayValue} 
            onChange={(value) => {
              const monthsValue = convertToMonths(value, durationUnit);
              setMonths(monthsValue);
            }}
            size="small" 
            fullWidth
            min={1}
            defaultValue={1}
          />
        </Grid>
        {setDurationUnit && (
          <Grid size={{ xs: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Duration Unit</InputLabel>
              <Select value={durationUnit} label="Duration Unit" onChange={(e) => setDurationUnit(e.target.value as 'days' | 'weeks' | 'months')}>
                <MenuItem value="days">Days</MenuItem>
                <MenuItem value="weeks">Weeks</MenuItem>
                <MenuItem value="months">Months</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}
        <Grid size={{ xs: 6, md: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Starting Gym</InputLabel>
            <Select value={currentGymIndex} label="Starting Gym" onChange={(e) => setCurrentGymIndex(Number(e.target.value))}>
              {GYMS.map((gym, index) => (
                <MenuItem key={gym.name} value={index}>{gym.displayName}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        {gymProgressPercent !== undefined && setGymProgressPercent && (
          <Grid size={{ xs: 6, md: 3 }}>
            <NumericTextField 
              label="Gym Progress (%)" 
              value={gymProgressPercent} 
              onChange={(value) => setGymProgressPercent(value)}
              size="small" 
              fullWidth
              min={0}
              max={100}
              helperText="Progress toward next gym (0-100%)"
            />
          </Grid>
        )}
      </Grid>
      
      {gymProgressPercent !== undefined && (
        <Alert severity="warning" sx={{ mt: 2, py: 0.5 }}>
          <Typography variant="body2">
            <strong>Note:</strong> Gym progress percentage must be filled manually - this data is not available from the API.
          </Typography>
        </Alert>
      )}
    </Paper>
    
    {/* Historical data section - only visible when stats have been fetched AND we have user's sign-up date */}
    {statsFetchedWithApiKey && apiKey && onHistoricalDataFetched && userSignUpDate && (
      <HistoricalDataConfig 
        apiKey={apiKey}
        onHistoricalDataFetched={onHistoricalDataFetched}
        simulatedDate={simulatedDate}
        onEnabledChange={onEnabledChange}
        userSignUpDate={userSignUpDate}
      />
    )}
    </>
  );
}
