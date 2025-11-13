import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  TextField,
  Typography,
  Tooltip,
  IconButton,
} from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { GYMS } from '../../../lib/data/gyms';
import type { SimulationResult } from '../../../lib/utils/gymProgressionCalculator';

interface Stats {
  strength: number;
  speed: number;
  defense: number;
  dexterity: number;
}

interface StatWeights {
  strength: number;
  speed: number;
  defense: number;
  dexterity: number;
}

interface ManualTestingSectionProps {
  initialStats: Stats;
  setInitialStats: (stats: Stats) => void;
  manualEnergy: number;
  setManualEnergy: (energy: number) => void;
  manualHappy: number;
  setManualHappy: (happy: number) => void;
  autoUpgradeGyms: boolean;
  setAutoUpgradeGyms: (auto: boolean) => void;
  currentGymIndex: number;
  setCurrentGymIndex: (index: number) => void;
  manualStatWeights: StatWeights;
  setManualStatWeights: (weights: StatWeights) => void;
  manualPerkPercs: StatWeights;
  setManualPerkPercs: (percs: StatWeights) => void;
  manualCompanyBenefitKey: string;
  setManualCompanyBenefitKey: (key: string) => void;
  manualCandleShopStars: number;
  setManualCandleShopStars: (stars: number) => void;
  manualTrainingStrategy: 'balanced' | 'bestGains';
  setManualTrainingStrategy: (strategy: 'balanced' | 'bestGains') => void;
  results?: SimulationResult;
}

export default function ManualTestingSection({
  initialStats,
  setInitialStats,
  manualEnergy,
  setManualEnergy,
  manualHappy,
  setManualHappy,
  autoUpgradeGyms,
  setAutoUpgradeGyms,
  currentGymIndex,
  setCurrentGymIndex,
  manualStatWeights,
  setManualStatWeights,
  manualPerkPercs,
  setManualPerkPercs,
  manualCompanyBenefitKey,
  setManualCompanyBenefitKey,
  manualCandleShopStars,
  setManualCandleShopStars,
  manualTrainingStrategy,
  setManualTrainingStrategy,
  results
}: ManualTestingSectionProps) {
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Manual Test Configuration</Typography>
          
          {/* Starting Stats Display */}
          <Box sx={{ mb: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
              Starting Stats
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ flex: '1 1 45%' }}>
                <Typography variant="caption" color="text.secondary">Str:</Typography>
                <Typography variant="body2">{initialStats.strength.toLocaleString()}</Typography>
              </Box>
              <Box sx={{ flex: '1 1 45%' }}>
                <Typography variant="caption" color="text.secondary">Spd:</Typography>
                <Typography variant="body2">{initialStats.speed.toLocaleString()}</Typography>
              </Box>
              <Box sx={{ flex: '1 1 45%' }}>
                <Typography variant="caption" color="text.secondary">Def:</Typography>
                <Typography variant="body2">{initialStats.defense.toLocaleString()}</Typography>
              </Box>
              <Box sx={{ flex: '1 1 45%' }}>
                <Typography variant="caption" color="text.secondary">Dex:</Typography>
                <Typography variant="body2">{initialStats.dexterity.toLocaleString()}</Typography>
              </Box>
            </Box>
          </Box>
          
          <TextField 
            label="Total Energy" 
            type="number" 
            value={manualEnergy ?? ''} 
            onChange={(e) => setManualEnergy(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))} 
            fullWidth 
            margin="dense" 
            size="small" 
            inputProps={{ step: 'any', min: 0 }} 
          />
          <TextField 
            label="Happy" 
            type="number" 
            value={manualHappy ?? ''} 
            onChange={(e) => setManualHappy(e.target.value === '' ? 0 : Math.max(0, Math.min(99999, Number(e.target.value))))} 
            fullWidth 
            margin="dense" 
            size="small" 
            inputProps={{ step: 'any', min: 0, max: 99999 }} 
          />
          <FormControlLabel 
            control={<Switch checked={autoUpgradeGyms} onChange={(e) => setAutoUpgradeGyms(e.target.checked)} />} 
            label="Auto-upgrade gyms" 
          />
          
          <FormControl fullWidth margin="dense" size="small">
            <InputLabel>{autoUpgradeGyms ? 'Starting Gym' : 'Current Gym'}</InputLabel>
            <Select value={currentGymIndex} label={autoUpgradeGyms ? 'Starting Gym' : 'Current Gym'} onChange={(e) => setCurrentGymIndex(Number(e.target.value))}>
              {GYMS.map((gym, index) => (
                <MenuItem key={gym.name} value={index}>{gym.displayName}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Stat Targets</Typography>
          
          {/* Training Strategy Selection */}
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary">
                Training Strategy
              </Typography>
              <Tooltip 
                title={
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Balanced Training:</strong> Train the lowest stat according to your weighings to keep stats balanced based on target ratios.
                    </Typography>
                    <Typography variant="body2">
                      <strong>Best Gains Training:</strong> Train the stat with the highest gym dots (best gains) until George's gym is unlocked. If multiple stats have the same best dots, the most out-of-sync stat is trained. After George's gym, reverts to balanced training.
                    </Typography>
                  </Box>
                }
                placement="top"
                arrow
              >
                <IconButton size="small" sx={{ p: 0, ml: 0.5 }}>
                  <HelpOutlineIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              </Tooltip>
            </Box>
            <FormControl fullWidth size="small">
              <Select
                value={manualTrainingStrategy}
                onChange={(e) => setManualTrainingStrategy(e.target.value as 'balanced' | 'bestGains')}
                sx={{ fontSize: '0.875rem' }}
              >
                <MenuItem value="balanced">Balanced Training</MenuItem>
                <MenuItem value="bestGains">Best Gains Training</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <TextField label="Str" type="number" value={manualStatWeights.strength ?? ''} onChange={(e) => setManualStatWeights({ ...manualStatWeights, strength: e.target.value === '' ? 0 : Number(e.target.value) })} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 0 }} />
          <TextField label="Spd" type="number" value={manualStatWeights.speed ?? ''} onChange={(e) => setManualStatWeights({ ...manualStatWeights, speed: e.target.value === '' ? 0 : Number(e.target.value) })} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 0 }} />
          <TextField label="Def" type="number" value={manualStatWeights.defense ?? ''} onChange={(e) => setManualStatWeights({ ...manualStatWeights, defense: e.target.value === '' ? 0 : Number(e.target.value) })} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 0 }} />
          <TextField label="Dex" type="number" value={manualStatWeights.dexterity ?? ''} onChange={(e) => setManualStatWeights({ ...manualStatWeights, dexterity: e.target.value === '' ? 0 : Number(e.target.value) })} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 0 }} />
          
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Perk %</Typography>
          <TextField label="Str %" type="number" value={manualPerkPercs.strength ?? ''} onChange={(e) => setManualPerkPercs({ ...manualPerkPercs, strength: e.target.value === '' ? 0 : Number(e.target.value) })} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 0 }} />
          <TextField label="Spd %" type="number" value={manualPerkPercs.speed ?? ''} onChange={(e) => setManualPerkPercs({ ...manualPerkPercs, speed: e.target.value === '' ? 0 : Number(e.target.value) })} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 0 }} />
          <TextField label="Def %" type="number" value={manualPerkPercs.defense ?? ''} onChange={(e) => setManualPerkPercs({ ...manualPerkPercs, defense: e.target.value === '' ? 0 : Number(e.target.value) })} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 0 }} />
          <TextField label="Dex %" type="number" value={manualPerkPercs.dexterity ?? ''} onChange={(e) => setManualPerkPercs({ ...manualPerkPercs, dexterity: e.target.value === '' ? 0 : Number(e.target.value) })} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 0 }} />
          
          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Company Benefit</Typography>
          <FormControl fullWidth margin="dense" size="small">
            <InputLabel>Benefit</InputLabel>
            <Select value={manualCompanyBenefitKey} label="Benefit" onChange={(e) => setManualCompanyBenefitKey(e.target.value)}>
              <MenuItem value="none">None</MenuItem>
              <MenuItem value="musicStore">3★ Music Store</MenuItem>
              <MenuItem value="candleShop">Candle Shop</MenuItem>
              <MenuItem value="fitnessCenter">10★ Fitness Center</MenuItem>
            </Select>
          </FormControl>
          
          {manualCompanyBenefitKey === 'candleShop' && (
            <TextField label="Stars" type="number" value={manualCandleShopStars ?? ''} onChange={(e) => setManualCandleShopStars(e.target.value === '' ? 1 : Math.max(1, Math.min(10, Number(e.target.value))))} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 1, max: 10 }} />
          )}
        </Paper>
      </Grid>
      
      <Grid size={{ xs: 12, md: 8 }}>
        {results && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Training Results</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, md: 3 }}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">Strength</Typography>
                    <Typography variant="h6">{Math.round(results.finalStats.strength).toLocaleString()}</Typography>
                    <Typography variant="caption" color="success.main">+{Math.round(results.finalStats.strength - initialStats.strength).toLocaleString()}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">Speed</Typography>
                    <Typography variant="h6">{Math.round(results.finalStats.speed).toLocaleString()}</Typography>
                    <Typography variant="caption" color="success.main">+{Math.round(results.finalStats.speed - initialStats.speed).toLocaleString()}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">Defense</Typography>
                    <Typography variant="h6">{Math.round(results.finalStats.defense).toLocaleString()}</Typography>
                    <Typography variant="caption" color="success.main">+{Math.round(results.finalStats.defense - initialStats.defense).toLocaleString()}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 6, md: 3 }}>
                <Card>
                  <CardContent>
                    <Typography variant="subtitle2" color="text.secondary">Dexterity</Typography>
                    <Typography variant="h6">{Math.round(results.finalStats.dexterity).toLocaleString()}</Typography>
                    <Typography variant="caption" color="success.main">+{Math.round(results.finalStats.dexterity - initialStats.dexterity).toLocaleString()}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
            <Button 
              variant="outlined" 
              fullWidth 
              sx={{ mt: 2 }}
              onClick={() => {
                setInitialStats({
                  strength: Math.round(results.finalStats.strength),
                  speed: Math.round(results.finalStats.speed),
                  defense: Math.round(results.finalStats.defense),
                  dexterity: Math.round(results.finalStats.dexterity),
                });
              }}
            >
              Use as Initial Stats
            </Button>
          </Paper>
        )}
        
        {!results && (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Configure energy and options to see results
            </Typography>
          </Paper>
        )}
      </Grid>
    </Grid>
  );
}
