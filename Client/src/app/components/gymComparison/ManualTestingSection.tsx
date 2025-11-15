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
  manualStatDriftPercent: number;
  setManualStatDriftPercent: (percent: number) => void;
  manualBalanceAfterGymIndex: number;
  setManualBalanceAfterGymIndex: (gymIndex: number) => void;
  manualIgnorePerksForGymSelection: boolean;
  setManualIgnorePerksForGymSelection: (ignore: boolean) => void;
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
  manualStatDriftPercent,
  setManualStatDriftPercent,
  manualBalanceAfterGymIndex,
  setManualBalanceAfterGymIndex,
  manualIgnorePerksForGymSelection,
  setManualIgnorePerksForGymSelection,
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
          
          {/* Stat Drift Configuration */}
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                Stat Drift
              </Typography>
              <Tooltip 
                title={
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>No stat drift:</strong> Always maintain exact ratio balance (e.g., 1:1:1:1).
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>25%-75%:</strong> Allow flexibility to train stats with better gains while staying relatively balanced.
                    </Typography>
                    <Typography variant="body2">
                      <strong>No limits:</strong> Pure "train best stat" behavior. Train the stat with the highest actual gain (considering perks) until George's gym unlocks.
                    </Typography>
                  </Box>
                }
                placement="top"
                arrow
              >
                <IconButton size="small" sx={{ p: 0 }}>
                  <HelpOutlineIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
              </Tooltip>
              <FormControl size="small" sx={{ flexGrow: 1 }}>
                <Select
                  value={
                    manualStatDriftPercent === 0 ? '0' :
                    manualStatDriftPercent === 25 ? '25' :
                    manualStatDriftPercent === 50 ? '50' :
                    manualStatDriftPercent === 75 ? '75' :
                    manualStatDriftPercent === 100 ? '100' : '0'
                  }
                  onChange={(e) => setManualStatDriftPercent(Number(e.target.value))}
                  sx={{ fontSize: '0.875rem' }}
                >
                  <MenuItem value="0">No stat drift</MenuItem>
                  <MenuItem value="25">25%</MenuItem>
                  <MenuItem value="50">50%</MenuItem>
                  <MenuItem value="75">75%</MenuItem>
                  <MenuItem value="100">No limits</MenuItem>
                </Select>
              </FormControl>
            </Box>
            {manualStatDriftPercent > 0 && (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                    Revert to balanced after
                  </Typography>
                  <FormControl size="small" sx={{ flexGrow: 1 }}>
                    <Select
                      value={manualBalanceAfterGymIndex}
                      onChange={(e) => setManualBalanceAfterGymIndex(Number(e.target.value))}
                      sx={{ fontSize: '0.875rem' }}
                    >
                      <MenuItem value={-1}>Never</MenuItem>
                      <MenuItem value={19}>Cha Cha's</MenuItem>
                      <MenuItem value={23}>George's</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={manualIgnorePerksForGymSelection}
                      onChange={(e) => setManualIgnorePerksForGymSelection(e.target.checked)}
                      size="small"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="caption">
                        Ignore perks for gym selection
                      </Typography>
                      <Tooltip 
                        title="When enabled, perks are ignored when deciding which gym/stat to train. Perks are still applied to actual gains."
                        placement="top"
                        arrow
                      >
                        <IconButton size="small" sx={{ p: 0 }}>
                          <HelpOutlineIcon sx={{ fontSize: '0.875rem' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                  sx={{ mt: 0.5 }}
                />
              </>
            )}
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
