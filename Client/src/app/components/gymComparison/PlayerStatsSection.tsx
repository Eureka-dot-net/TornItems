import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import type { Gym } from '../../lib/utils/gymProgressionCalculator';

interface PlayerStatsSectionProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  initialStats: { strength: number; speed: number; defense: number; dexterity: number };
  setInitialStats: (stats: { strength: number; speed: number; defense: number; dexterity: number }) => void;
  months: number;
  setMonths: (months: number) => void;
  currentGymIndex: number;
  setCurrentGymIndex: (index: number) => void;
  gyms: Gym[];
  isLoadingGymStats: boolean;
  onFetchStats: () => void;
}

export default function PlayerStatsSection({
  apiKey,
  setApiKey,
  initialStats,
  setInitialStats,
  months,
  setMonths,
  currentGymIndex,
  setCurrentGymIndex,
  gyms,
  isLoadingGymStats,
  onFetchStats,
}: PlayerStatsSectionProps) {
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>Player Stats</Typography>
      
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
            <Button variant="outlined" onClick={onFetchStats} disabled={isLoadingGymStats || !apiKey.trim()}>
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
            onChange={(e) => setMonths(e.target.value === '' ? 1 : Math.max(1, Math.min(36, Number(e.target.value))))} 
            size="small" 
            fullWidth
            inputProps={{ step: 'any' }} 
          />
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Starting Gym</InputLabel>
            <Select value={currentGymIndex} label="Starting Gym" onChange={(e) => setCurrentGymIndex(Number(e.target.value))}>
              {gyms.map((gym, index) => (
                <MenuItem key={gym.name} value={index}>{gym.displayName}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Paper>
  );
}
