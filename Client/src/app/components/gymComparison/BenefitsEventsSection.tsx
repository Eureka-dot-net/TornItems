import {
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { COMPANY_BENEFIT_TYPES } from '../../../lib/constants/gymConstants';

interface BenefitsEventsSectionProps {
  companyBenefitKey: string;
  candleShopStars: number;
  diabetesDayEnabled: boolean;
  diabetesDayNumberOfJumps: 1 | 2;
  diabetesDayFHC: 0 | 1 | 2;
  diabetesDayGreenEgg: 0 | 1 | 2;
  diabetesDaySeasonalMail: boolean;
  diabetesDayLogoClick: boolean;
  onUpdate: (updates: {
    companyBenefitKey?: string;
    candleShopStars?: number;
    diabetesDayEnabled?: boolean;
    diabetesDayNumberOfJumps?: 1 | 2;
    diabetesDayFHC?: 0 | 1 | 2;
    diabetesDayGreenEgg?: 0 | 1 | 2;
    diabetesDaySeasonalMail?: boolean;
    diabetesDayLogoClick?: boolean;
  }) => void;
}

export default function BenefitsEventsSection({
  companyBenefitKey,
  candleShopStars,
  diabetesDayEnabled,
  diabetesDayNumberOfJumps,
  diabetesDayFHC,
  diabetesDayGreenEgg,
  diabetesDaySeasonalMail,
  diabetesDayLogoClick,
  onUpdate,
}: BenefitsEventsSectionProps) {
  return (
    <>
      <Typography variant="subtitle2" gutterBottom>
        Benefits & Events
      </Typography>

      <FormControl fullWidth margin="dense" size="small">
        <InputLabel>Company Benefit</InputLabel>
        <Select
          value={companyBenefitKey}
          label="Company Benefit"
          onChange={(e) => onUpdate({ companyBenefitKey: e.target.value })}
        >
          <MenuItem value={COMPANY_BENEFIT_TYPES.NONE}>None</MenuItem>
          <MenuItem value={COMPANY_BENEFIT_TYPES.MUSIC_STORE}>3★ Music Store</MenuItem>
          <MenuItem value={COMPANY_BENEFIT_TYPES.CANDLE_SHOP}>Candle Shop</MenuItem>
          <MenuItem value={COMPANY_BENEFIT_TYPES.FITNESS_CENTER}>10★ Fitness Center</MenuItem>
          <MenuItem value={COMPANY_BENEFIT_TYPES.GENTS_STRIP_CLUB}>7★+ Gents Strip Club (+10% Dex)</MenuItem>
          <MenuItem value={COMPANY_BENEFIT_TYPES.LADIES_STRIP_CLUB}>7★+ Ladies Strip Club (+10% Def)</MenuItem>
        </Select>
      </FormControl>

      {companyBenefitKey === COMPANY_BENEFIT_TYPES.CANDLE_SHOP && (
        <TextField
          label="Candle Stars"
          type="number"
          value={candleShopStars ?? ''}
          onChange={(e) =>
            onUpdate({
              candleShopStars:
                e.target.value === '' ? 1 : Math.max(1, Math.min(10, Number(e.target.value))),
            })
          }
          fullWidth
          margin="dense"
          size="small"
          inputProps={{ step: 'any', min: 1, max: 10 }}
        />
      )}

      <FormControlLabel
        control={
          <Switch
            checked={diabetesDayEnabled}
            onChange={(e) => onUpdate({ diabetesDayEnabled: e.target.checked })}
            size="small"
          />
        }
        label="Diabetes Day"
        sx={{ mt: 1 }}
      />

      {diabetesDayEnabled && (
        <>
          <FormControl fullWidth margin="dense" size="small">
            <InputLabel>Jumps</InputLabel>
            <Select
              value={diabetesDayNumberOfJumps}
              label="Jumps"
              onChange={(e) =>
                onUpdate({ diabetesDayNumberOfJumps: Number(e.target.value) as 1 | 2 })
              }
            >
              <MenuItem value={1}>1</MenuItem>
              <MenuItem value={2}>2</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth margin="dense" size="small">
            <InputLabel>FHC</InputLabel>
            <Select
              value={diabetesDayFHC}
              label="FHC"
              onChange={(e) => onUpdate({ diabetesDayFHC: Number(e.target.value) as 0 | 1 | 2 })}
            >
              <MenuItem value={0}>0</MenuItem>
              <MenuItem value={1}>1</MenuItem>
              <MenuItem value={2}>2</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth margin="dense" size="small">
            <InputLabel>Green Egg</InputLabel>
            <Select
              value={diabetesDayGreenEgg}
              label="Green Egg"
              onChange={(e) =>
                onUpdate({ diabetesDayGreenEgg: Number(e.target.value) as 0 | 1 | 2 })
              }
            >
              <MenuItem value={0}>0</MenuItem>
              <MenuItem value={1}>1</MenuItem>
              <MenuItem value={2}>2</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={diabetesDaySeasonalMail}
                onChange={(e) => onUpdate({ diabetesDaySeasonalMail: e.target.checked })}
                size="small"
              />
            }
            label="Seasonal Mail"
          />

          <FormControlLabel
            control={
              <Switch
                checked={diabetesDayLogoClick}
                onChange={(e) => onUpdate({ diabetesDayLogoClick: e.target.checked })}
                size="small"
              />
            }
            label="Logo Click"
          />
        </>
      )}
    </>
  );
}
