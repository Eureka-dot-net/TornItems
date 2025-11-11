import {
  Box,
  Typography,
  Paper,
  TextField,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import type { Gym } from '../../../lib/utils/gymProgressionCalculator';
import { COMPANY_BENEFIT_TYPES } from '../../../lib/constants/gymConstants';

interface ManualTestingConfigurationProps {
  initialStats: { strength: number; speed: number; defense: number; dexterity: number };
  manualEnergy: number;
  setManualEnergy: (value: number) => void;
  manualHappy: number;
  setManualHappy: (value: number) => void;
  autoUpgradeGyms: boolean;
  setAutoUpgradeGyms: (value: boolean) => void;
  currentGymIndex: number;
  setCurrentGymIndex: (value: number) => void;
  gyms: Gym[];
  manualStatWeights: { strength: number; speed: number; defense: number; dexterity: number };
  setManualStatWeights: (value: { strength: number; speed: number; defense: number; dexterity: number }) => void;
  manualPerkPercs: { strength: number; speed: number; defense: number; dexterity: number };
  setManualPerkPercs: (value: { strength: number; speed: number; defense: number; dexterity: number }) => void;
  manualCompanyBenefitKey: string;
  setManualCompanyBenefitKey: (value: string) => void;
  manualCandleShopStars: number;
  setManualCandleShopStars: (value: number) => void;
}

export default function ManualTestingConfiguration({
  initialStats,
  manualEnergy,
  setManualEnergy,
  manualHappy,
  setManualHappy,
  autoUpgradeGyms,
  setAutoUpgradeGyms,
  currentGymIndex,
  setCurrentGymIndex,
  gyms,
  manualStatWeights,
  setManualStatWeights,
  manualPerkPercs,
  setManualPerkPercs,
  manualCompanyBenefitKey,
  setManualCompanyBenefitKey,
  manualCandleShopStars,
  setManualCandleShopStars,
}: ManualTestingConfigurationProps) {
  return (
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
          {gyms.map((gym, index) => (
            <MenuItem key={gym.name} value={index}>{gym.displayName}</MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>Stat Targets</Typography>
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
          <MenuItem value={COMPANY_BENEFIT_TYPES.NONE}>None</MenuItem>
          <MenuItem value={COMPANY_BENEFIT_TYPES.MUSIC_STORE}>3★ Music Store</MenuItem>
          <MenuItem value={COMPANY_BENEFIT_TYPES.CANDLE_SHOP}>Candle Shop</MenuItem>
          <MenuItem value={COMPANY_BENEFIT_TYPES.FITNESS_CENTER}>10★ Fitness Center</MenuItem>
        </Select>
      </FormControl>
      
      {manualCompanyBenefitKey === COMPANY_BENEFIT_TYPES.CANDLE_SHOP && (
        <TextField label="Stars" type="number" value={manualCandleShopStars ?? ''} onChange={(e) => setManualCandleShopStars(e.target.value === '' ? 1 : Math.max(1, Math.min(10, Number(e.target.value))))} fullWidth margin="dense" size="small" inputProps={{ step: 'any', min: 1, max: 10 }} />
      )}
    </Paper>
  );
}
