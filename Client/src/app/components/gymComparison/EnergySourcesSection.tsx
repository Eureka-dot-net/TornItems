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
import { calculateDailyEnergy } from '../../../lib/utils/gymProgressionCalculator';
import type { CompanyBenefit } from '../../../lib/utils/gymProgressionCalculator';
import { formatCurrency } from '../../../lib/utils/gymHelpers';
import { CONSUMABLE_ITEM_IDS } from '../../../lib/constants/gymConstants';

interface EnergySourcesSectionProps {
  maxEnergy: number;
  hoursPlayedPerDay: number;
  xanaxPerDay: number;
  hasPointsRefill: boolean;
  daysSkippedPerMonth: number;
  companyBenefit: CompanyBenefit;
  showCosts?: boolean;
  itemPricesData?: {
    prices: Record<number, number | null>;
  };
  onUpdate: (updates: {
    maxEnergy?: number;
    hoursPlayedPerDay?: number;
    xanaxPerDay?: number;
    hasPointsRefill?: boolean;
    daysSkippedPerMonth?: number;
  }) => void;
}

export default function EnergySourcesSection({
  maxEnergy,
  hoursPlayedPerDay,
  xanaxPerDay,
  hasPointsRefill,
  daysSkippedPerMonth,
  companyBenefit,
  showCosts,
  itemPricesData,
  onUpdate,
}: EnergySourcesSectionProps) {
  return (
    <>
      <Typography variant="subtitle2" gutterBottom>
        Energy Sources
      </Typography>

      <FormControl fullWidth margin="dense" size="small">
        <InputLabel>Max Energy</InputLabel>
        <Select
          value={maxEnergy}
          label="Max Energy"
          onChange={(e) => onUpdate({ maxEnergy: Number(e.target.value) })}
        >
          <MenuItem value={150}>150</MenuItem>
          <MenuItem value={100}>100</MenuItem>
        </Select>
      </FormControl>

      <TextField
        label="Hours/Day"
        type="number"
        value={hoursPlayedPerDay ?? ''}
        onChange={(e) =>
          onUpdate({
            hoursPlayedPerDay:
              e.target.value === '' ? 0 : Math.max(0, Math.min(24, Number(e.target.value))),
          })
        }
        fullWidth
        margin="dense"
        size="small"
        inputProps={{ step: 'any', min: 0, max: 24 }}
      />

      <TextField
        label="Xanax/Day"
        type="number"
        value={xanaxPerDay ?? ''}
        onChange={(e) =>
          onUpdate({
            xanaxPerDay: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)),
          })
        }
        fullWidth
        margin="dense"
        size="small"
        inputProps={{ step: 'any', min: 0 }}
      />

      {showCosts && itemPricesData && xanaxPerDay > 0 && itemPricesData.prices[CONSUMABLE_ITEM_IDS.XANAX] !== null && (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
          Cost: {formatCurrency(xanaxPerDay * itemPricesData.prices[CONSUMABLE_ITEM_IDS.XANAX]!)} per day
        </Typography>
      )}

      <FormControlLabel
        control={
          <Switch
            checked={hasPointsRefill}
            onChange={(e) => onUpdate({ hasPointsRefill: e.target.checked })}
            size="small"
          />
        }
        label="Points Refill"
        sx={{ mt: 1 }}
      />

      {showCosts && itemPricesData && hasPointsRefill && itemPricesData.prices[0] !== null && (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
          Cost: {formatCurrency(itemPricesData.prices[0]! * 30)} per day
        </Typography>
      )}

      <TextField
        label="Days Skipped/Month"
        type="number"
        value={daysSkippedPerMonth ?? ''}
        onChange={(e) =>
          onUpdate({
            daysSkippedPerMonth:
              e.target.value === '' ? 0 : Math.max(0, Math.min(30, Number(e.target.value))),
          })
        }
        fullWidth
        margin="dense"
        size="small"
        inputProps={{ step: 'any', min: 0, max: 30 }}
      />

      <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 1 }}>
        Daily E:{' '}
        {calculateDailyEnergy(
          hoursPlayedPerDay,
          xanaxPerDay,
          hasPointsRefill,
          companyBenefit.bonusEnergyPerDay,
          maxEnergy
        ).toLocaleString()}
      </Typography>
    </>
  );
}
