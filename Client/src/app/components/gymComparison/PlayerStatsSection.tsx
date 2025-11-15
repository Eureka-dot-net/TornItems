import { Alert, Box, Button, CircularProgress, FormControl, Grid, InputLabel, MenuItem, Paper, Select, TextField, Typography } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { GYMS } from '../../../lib/data/gyms';

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
  monthValidationError
}: PlayerStatsSectionProps) {
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>Fixed options</Typography>
      
      {monthValidationError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {monthValidationError}
        </Alert>
      )}
      
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Optional: Enter a Limited API Key to auto-fetch your stats, or fill them in manually below. Get one from{' '}
            <a href="https://www.torn.com/preferences.php#tab=api" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>
              Torn Settings → API Key
            </a>
          </Alert>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              label="Torn API Key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              size="small"
              sx={{ flex: 1 }}
            />
            <Button variant="outlined" onClick={handleFetchStats} disabled={isLoadingGymStats || !apiKey.trim()}>
              {isLoadingGymStats ? <CircularProgress size={20} /> : 'Fetch'}
            </Button>
          </Box>
        </Grid>
        
        <Grid size={{ xs: 6, md: 1.5 }}>
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
        <Grid size={{ xs: 6, md: 1.5 }}>
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
        <Grid size={{ xs: 6, md: 1.5 }}>
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
        <Grid size={{ xs: 6, md: 1.5 }}>
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
        
        <Grid size={{ xs: 6, md: 3 }}>
          <TextField 
            label="Duration (months)" 
            type="number" 
            value={months ?? ''} 
            onChange={(e) => {
              const value = e.target.value === '' ? 1 : Number(e.target.value);
              setMonths(value);
            }}
            size="small" 
            fullWidth
            inputProps={{ step: 'any', min: 1 }} 
          />
        </Grid>
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
        
        <Grid size={{ xs: 12, md: 6 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Simulated Date (for Diabetes Day)"
              value={simulatedDate}
              onChange={(newValue) => setSimulatedDate(newValue)}
              slotProps={{ 
                textField: { 
                  size: 'small',
                  fullWidth: true,
                  helperText: 'Diabetes Day is Nov 13-15. Set a date to simulate when it will occur.'
                } 
              }}
            />
          </LocalizationProvider>
        </Grid>
      </Grid>
    </Paper>
  );
}
