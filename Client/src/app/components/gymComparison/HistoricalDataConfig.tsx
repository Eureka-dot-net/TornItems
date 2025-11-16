import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  LinearProgress,
  Paper,
  Radio,
  RadioGroup,
  Switch,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useHistoricalStats, type HistoricalStat } from '../../../lib/hooks/useHistoricalStats';

interface HistoricalDataConfigProps {
  apiKey: string;
  onHistoricalDataFetched: (data: HistoricalStat[]) => void;
}

export default function HistoricalDataConfig({ apiKey, onHistoricalDataFetched }: HistoricalDataConfigProps) {
  const [enabled, setEnabled] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [samplingFrequencyDays, setSamplingFrequencyDays] = useState(7);
  const [cachingMode, setCachingMode] = useState<'store' | 'refetch'>('store');
  const [fetchProgress, setFetchProgress] = useState<{ current: number; total: number } | null>(null);
  
  const { fetchHistoricalStats, isLoading, error } = useHistoricalStats();

  // Calculate estimates
  const calculateEstimates = () => {
    if (!startDate || !endDate) {
      return { requestCount: 0, estimatedTime: 0 };
    }
    
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const requestCount = Math.ceil(daysDiff / samplingFrequencyDays) + 1;
    
    // 2 seconds per request = 30 requests/minute
    const estimatedTimeSeconds = requestCount * 2;
    
    return { requestCount, estimatedTime: estimatedTimeSeconds };
  };

  const estimates = calculateEstimates();

  const handleFetch = async () => {
    if (!apiKey || !startDate || !endDate) {
      return;
    }
    
    try {
      // Check cache if in store mode
      if (cachingMode === 'store') {
        const cacheKey = `historicalStats_${startDate.getTime()}_${endDate.getTime()}_${samplingFrequencyDays}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
          const data = JSON.parse(cached) as HistoricalStat[];
          onHistoricalDataFetched(data);
          return;
        }
      }
      
      // Fetch data
      const data = await fetchHistoricalStats({
        apiKey,
        startDate,
        endDate,
        samplingFrequencyDays,
        onProgress: (current, total) => {
          setFetchProgress({ current, total });
        },
      });
      
      // Store in cache if in store mode
      if (cachingMode === 'store') {
        const cacheKey = `historicalStats_${startDate.getTime()}_${endDate.getTime()}_${samplingFrequencyDays}`;
        localStorage.setItem(cacheKey, JSON.stringify(data));
      }
      
      onHistoricalDataFetched(data);
      setFetchProgress(null);
    } catch (err) {
      console.error('Failed to fetch historical data:', err);
      setFetchProgress(null);
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (!apiKey) {
    return null; // Don't show if no API key
  }

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
          }
          label="Compare with historical stats"
        />
      </Box>

      {enabled && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Alert severity="info">
            Fetch your actual gym stats history to compare with simulated predictions. This uses the Torn API v2 personalstats endpoint.
          </Alert>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{ 
                  textField: { 
                    size: 'small',
                    sx: { flex: 1, minWidth: 200 }
                  } 
                }}
              />
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{ 
                  textField: { 
                    size: 'small',
                    sx: { flex: 1, minWidth: 200 }
                  } 
                }}
              />
            </Box>
          </LocalizationProvider>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              label="Sampling frequency (days)"
              type="number"
              value={samplingFrequencyDays}
              onChange={(e) => setSamplingFrequencyDays(Math.max(1, Number(e.target.value)))}
              size="small"
              sx={{ width: 200 }}
              inputProps={{ min: 1 }}
              helperText="Sample every X days"
            />

            <Box sx={{ flex: 1, minWidth: 250 }}>
              <Typography variant="body2" color="text.secondary">
                Estimated: {estimates.requestCount} API requests
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Fetch time: ~{formatTime(estimates.estimatedTime)} (30 req/min safety limit)
              </Typography>
            </Box>
          </Box>

          <FormControl component="fieldset">
            <Typography variant="body2" gutterBottom sx={{ fontWeight: 'medium' }}>
              Data caching mode
            </Typography>
            <RadioGroup
              value={cachingMode}
              onChange={(e) => setCachingMode(e.target.value as 'store' | 'refetch')}
            >
              <FormControlLabel
                value="store"
                control={<Radio size="small" />}
                label="Store results (save in local storage)"
              />
              <FormControlLabel
                value="refetch"
                control={<Radio size="small" />}
                label="Refetch on demand (no caching)"
              />
            </RadioGroup>
          </FormControl>

          <Box>
            <Button
              variant="contained"
              onClick={handleFetch}
              disabled={isLoading || !startDate || !endDate}
            >
              {isLoading ? 'Fetching...' : 'Fetch Historical Data'}
            </Button>
            {isLoading && fetchProgress && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Fetching {fetchProgress.current} of {fetchProgress.total}...
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(fetchProgress.current / fetchProgress.total) * 100} 
                />
              </Box>
            )}
          </Box>

          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}
        </Box>
      )}
    </Paper>
  );
}
