import { Alert, Box, Button, Checkbox, CircularProgress, FormControl, FormControlLabel, Grid, InputLabel, MenuItem, Paper, Select, TextField, Typography } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useState, useEffect } from 'react';
import { GYMS } from '../../../lib/data/gyms';
import HistoricalDataConfig from './HistoricalDataConfig';
import { type HistoricalStat } from '../../../lib/hooks/useHistoricalStats';
import axios from 'axios';

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
}: PlayerStatsSectionProps) {
  // Constants for date validation
  const TORN_RELEASE_DATE = new Date('1997-10-27');
  const getYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);
    return yesterday;
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
                onChange={(newValue) => setSimulatedDate(newValue)}
                minDate={TORN_RELEASE_DATE}
                maxDate={getYesterday()}
                slotProps={{ 
                  textField: { 
                    size: 'small',
                    fullWidth: true,
                    helperText: 'Sets the start date for the graph and Diabetes Day calculations (Nov 13-15).'
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
          <TextField 
            label="Strength" 
            type="number" 
            value={initialStats.strength ?? ''} 
            onChange={(e) => setInitialStats({ ...initialStats, strength: e.target.value === '' ? 0 : Number(e.target.value) })} 
            size="small" 
            fullWidth
            inputProps={{ step: 'any', min: 0 }} 
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <TextField 
            label="Speed" 
            type="number" 
            value={initialStats.speed ?? ''} 
            onChange={(e) => setInitialStats({ ...initialStats, speed: e.target.value === '' ? 0 : Number(e.target.value) })} 
            size="small" 
            fullWidth
            inputProps={{ step: 'any', min: 0 }} 
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <TextField 
            label="Defense" 
            type="number" 
            value={initialStats.defense ?? ''} 
            onChange={(e) => setInitialStats({ ...initialStats, defense: e.target.value === '' ? 0 : Number(e.target.value) })} 
            size="small" 
            fullWidth
            inputProps={{ step: 'any', min: 0 }} 
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <TextField 
            label="Dexterity" 
            type="number" 
            value={initialStats.dexterity ?? ''} 
            onChange={(e) => setInitialStats({ ...initialStats, dexterity: e.target.value === '' ? 0 : Number(e.target.value) })} 
            size="small" 
            fullWidth
            inputProps={{ step: 'any', min: 0 }} 
          />
        </Grid>
      </Grid>
      
      {/* Other Options - Duration, Starting Gym, and Gym Progress */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 6, md: 3 }}>
          <TextField 
            label={`Duration (${durationUnit})`}
            type="number" 
            value={displayValue ?? ''} 
            onChange={(e) => {
              const inputValue = e.target.value === '' ? 1 : Number(e.target.value);
              const monthsValue = convertToMonths(inputValue, durationUnit);
              setMonths(monthsValue);
            }}
            size="small" 
            fullWidth
            inputProps={{ step: 'any', min: 1 }} 
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
            <TextField 
              label="Gym Progress (%)" 
              type="number" 
              value={gymProgressPercent} 
              onChange={(e) => {
                const numValue = Number(e.target.value);
                const value = e.target.value === '' || isNaN(numValue) ? 0 : numValue;
                setGymProgressPercent(Math.max(0, Math.min(100, value)));
              }}
              size="small" 
              fullWidth
              inputProps={{ step: 'any', min: 0, max: 100 }}
              helperText="Progress toward next gym (0-100%)"
            />
          </Grid>
        )}
      </Grid>
    </Paper>
    
    {/* Historical data section - only visible when API key is present */}
    {apiKey && onHistoricalDataFetched && (
      <HistoricalDataConfig 
        apiKey={apiKey}
        onHistoricalDataFetched={onHistoricalDataFetched}
        simulatedDate={simulatedDate}
        onEnabledChange={onEnabledChange}
      />
    )}
    </>
  );
}
