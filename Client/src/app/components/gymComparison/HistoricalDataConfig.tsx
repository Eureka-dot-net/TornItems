import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  FormControlLabel,
  LinearProgress,
  Paper,
  Radio,
  RadioGroup,
  Switch,
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
  simulatedDate: Date | null;
  onEnabledChange?: (enabled: boolean) => void;
}

export default function HistoricalDataConfig({ apiKey, onHistoricalDataFetched, simulatedDate, onEnabledChange }: HistoricalDataConfigProps) {
  // Constants for date validation
  const TORN_RELEASE_DATE = new Date('1997-10-27');
  const getYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);
    return yesterday;
  };
  
  // Load from localStorage
  const loadSavedValue = <T,>(key: string, defaultValue: T): T => {
    try {
      const saved = localStorage.getItem(`historicalDataConfig_${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };
  
  const [enabled, setEnabled] = useState(() => loadSavedValue('enabled', false));
  const [startDate, setStartDate] = useState<Date | null>(() => {
    const saved = loadSavedValue<string | null>('startDate', null);
    // If no saved value, use simulatedDate as default
    if (saved) return new Date(saved);
    return simulatedDate || null;
  });
  const [endDate, setEndDate] = useState<Date | null>(() => {
    const saved = loadSavedValue<string | null>('endDate', null);
    return saved ? new Date(saved) : getYesterday();
  });
  // Always fetch daily (samplingFrequencyDays = 1)
  const samplingFrequencyDays = 1;
  const [cachingMode, setCachingMode] = useState<'store' | 'refetch'>(() => loadSavedValue('cachingMode', 'store'));
  const [fetchProgress, setFetchProgress] = useState<{ current: number; total: number } | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingFetch, setPendingFetch] = useState(false);
  
  const { fetchHistoricalStats, cancelFetch, isLoading, error } = useHistoricalStats();

  // Save to localStorage when values change
  useEffect(() => { localStorage.setItem('historicalDataConfig_enabled', JSON.stringify(enabled)); }, [enabled]);
  useEffect(() => { localStorage.setItem('historicalDataConfig_startDate', JSON.stringify(startDate ? startDate.toISOString() : null)); }, [startDate]);
  useEffect(() => { localStorage.setItem('historicalDataConfig_endDate', JSON.stringify(endDate ? endDate.toISOString() : null)); }, [endDate]);
  useEffect(() => { localStorage.setItem('historicalDataConfig_cachingMode', JSON.stringify(cachingMode)); }, [cachingMode]);

  // Notify parent when enabled changes
  useEffect(() => {
    if (onEnabledChange) {
      onEnabledChange(enabled);
    }
  }, [enabled, onEnabledChange]);

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

  // Track the last fetched parameters to detect changes
  const [lastFetchedParams, setLastFetchedParams] = useState<{
    startDate: Date | null;
    endDate: Date | null;
    samplingFrequencyDays: number;
  } | null>(null);

  // Auto-fetch when parameters change and enabled
  useEffect(() => {
    if (!enabled || !apiKey || !startDate || !endDate) {
      return;
    }

    // Check if parameters have changed
    const paramsChanged = !lastFetchedParams ||
      lastFetchedParams.startDate?.getTime() !== startDate.getTime() ||
      lastFetchedParams.endDate?.getTime() !== endDate.getTime() ||
      lastFetchedParams.samplingFrequencyDays !== samplingFrequencyDays;

    if (paramsChanged && cachingMode === 'store') {
      // Calculate all timestamps we need
      const allTimestamps: number[] = [];
      const currentDate = new Date(startDate);
      const endTime = endDate.getTime();
      
      while (currentDate.getTime() <= endTime) {
        allTimestamps.push(Math.floor(currentDate.getTime() / 1000));
        currentDate.setDate(currentDate.getDate() + samplingFrequencyDays);
      }
      
      const endTimestamp = Math.floor(endTime / 1000);
      if (allTimestamps[allTimestamps.length - 1] !== endTimestamp) {
        allTimestamps.push(endTimestamp);
      }
      
      // Check if we have all data cached
      const cachedData: HistoricalStat[] = [];
      let allCached = true;
      
      for (const timestamp of allTimestamps) {
        const cacheKey = `historicalStat_${timestamp}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
          try {
            cachedData.push(JSON.parse(cached) as HistoricalStat);
          } catch {
            allCached = false;
            break;
          }
        } else {
          allCached = false;
          break;
        }
      }
      
      if (allCached && cachedData.length > 0) {
        // All data is cached, load it
        cachedData.sort((a, b) => a.timestamp - b.timestamp);
        onHistoricalDataFetched(cachedData);
        setLastFetchedParams({ startDate, endDate, samplingFrequencyDays });
      }
    }
  }, [enabled, apiKey, startDate, endDate, samplingFrequencyDays, cachingMode, lastFetchedParams, onHistoricalDataFetched]);

  const handleFetch = async () => {
    if (!apiKey || !startDate || !endDate) {
      return;
    }
    
    // Check if start date is more than 2 months ago
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    
    if (startDate < twoMonthsAgo && !pendingFetch) {
      // Show confirmation dialog
      setPendingFetch(true);
      setShowConfirmDialog(true);
      return;
    }
    
    setPendingFetch(false);
    
    try {
      const dataToFetch: HistoricalStat[] = [];
      const timestampsToFetch: number[] = [];
      
      // Calculate all timestamps we need
      const allTimestamps: number[] = [];
      const currentDate = new Date(startDate);
      const endTime = endDate.getTime();
      
      while (currentDate.getTime() <= endTime) {
        allTimestamps.push(Math.floor(currentDate.getTime() / 1000));
        currentDate.setDate(currentDate.getDate() + samplingFrequencyDays);
      }
      
      // Ensure we include the end date
      const endTimestamp = Math.floor(endTime / 1000);
      if (allTimestamps[allTimestamps.length - 1] !== endTimestamp) {
        allTimestamps.push(endTimestamp);
      }
      
      // Check cache for each timestamp
      if (cachingMode === 'store') {
        for (const timestamp of allTimestamps) {
          const cacheKey = `historicalStat_${timestamp}`;
          const cached = localStorage.getItem(cacheKey);
          
          if (cached) {
            try {
              dataToFetch.push(JSON.parse(cached) as HistoricalStat);
            } catch {
              // If parse fails, fetch this timestamp
              timestampsToFetch.push(timestamp);
            }
          } else {
            timestampsToFetch.push(timestamp);
          }
        }
      } else {
        // Refetch mode - fetch all timestamps
        timestampsToFetch.push(...allTimestamps);
      }
      
      // Fetch missing data
      if (timestampsToFetch.length > 0) {
        const fetchedData = await fetchHistoricalStats({
          apiKey,
          startDate,
          endDate,
          samplingFrequencyDays,
          onProgress: (current, total) => {
            setFetchProgress({ current, total });
          },
          timestampsToFetch, // Only fetch these specific timestamps
        });
        
        // Store each fetched stat individually in cache
        if (cachingMode === 'store') {
          fetchedData.forEach(stat => {
            const cacheKey = `historicalStat_${stat.timestamp}`;
            localStorage.setItem(cacheKey, JSON.stringify(stat));
          });
        }
        
        dataToFetch.push(...fetchedData);
      }
      
      // Sort by timestamp
      dataToFetch.sort((a, b) => a.timestamp - b.timestamp);
      
      onHistoricalDataFetched(dataToFetch);
      setLastFetchedParams({ startDate, endDate, samplingFrequencyDays });
      setFetchProgress(null);
    } catch (err) {
      console.error('Failed to fetch historical data:', err);
      setFetchProgress(null);
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds} seconds`;
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    // If less than an hour, show minutes and seconds
    if (minutes < 60) {
      if (remainingSeconds === 0) return `${minutes} minutes`;
      return `${minutes} minutes ${remainingSeconds} seconds`;
    }
    
    // If less than a day, show hours and minutes
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours < 24) {
      if (remainingMinutes === 0) return `${hours} hours`;
      return `${hours} hours ${remainingMinutes} minutes`;
    }
    
    // Show days and hours
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    if (remainingHours === 0) return `${days} days`;
    return `${days} days ${remainingHours} hours`;
  };

  const handleClearStats = () => {
    // Clear all cached historical stats from localStorage
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('historicalStat_')) {
        localStorage.removeItem(key);
      }
    });
    // Clear the displayed data
    onHistoricalDataFetched([]);
    setLastFetchedParams(null);
  };

  const handleCancelFetch = () => {
    cancelFetch();
    setFetchProgress(null);
  };

  const handleConfirmFetch = () => {
    setShowConfirmDialog(false);
    handleFetch();
  };

  const handleCancelDialog = () => {
    setShowConfirmDialog(false);
    setPendingFetch(false);
  };

  // Check if we have any cached stats
  const hasCachedStats = () => {
    const keys = Object.keys(localStorage);
    return keys.some(key => key.startsWith('historicalStat_'));
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
            Fetch your actual gym stats history to compare with simulated predictions. This uses the Torn API v2 personalstats endpoint. Data is fetched daily for accuracy.
          </Alert>

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                minDate={TORN_RELEASE_DATE}
                maxDate={getYesterday()}
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
                maxDate={getYesterday()}
                slotProps={{ 
                  textField: { 
                    size: 'small',
                    sx: { flex: 1, minWidth: 200 }
                  } 
                }}
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
          </LocalizationProvider>

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

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              onClick={handleFetch}
              disabled={isLoading || !startDate || !endDate}
            >
              {isLoading ? 'Fetching...' : 'Fetch Historical Data'}
            </Button>
            
            {isLoading && (
              <Button
                variant="outlined"
                color="error"
                onClick={handleCancelFetch}
              >
                Cancel
              </Button>
            )}
            
            {!isLoading && cachingMode === 'store' && hasCachedStats() && (
              <Button
                variant="outlined"
                color="warning"
                onClick={handleClearStats}
              >
                Clear Cached Stats
              </Button>
            )}
            
            {isLoading && fetchProgress && (
              <Box sx={{ mt: 2, width: '100%' }}>
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
      
      {/* Confirmation Dialog for dates older than 2 months */}
      <Dialog
        open={showConfirmDialog}
        onClose={handleCancelDialog}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title">
          Warning: Long Fetch Time
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-dialog-description">
            The start date you selected is more than 2 months in the past. 
            Fetching historical data for this period will take approximately {formatTime(estimates.estimatedTime)} 
            ({estimates.requestCount} API requests at 30 requests per minute).
            <br /><br />
            Are you sure you want to continue?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmFetch} color="primary" variant="contained" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
