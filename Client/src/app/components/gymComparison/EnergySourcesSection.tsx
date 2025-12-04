import {
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { NumericTextField } from '../../../lib/components';
import { calculateDailyEnergy } from '../../../lib/utils/gymProgressionCalculator';
import type { CompanyBenefit } from '../../../lib/utils/gymProgressionCalculator';
import { formatCurrency } from '../../../lib/utils/gymHelpers';
import { CONSUMABLE_ITEM_IDS, DEFAULT_POINTS_REFILL_DAYS_PER_WEEK } from '../../../lib/constants/gymConstants';

interface EnergySourcesSectionProps {
  maxEnergy: number;
  hoursPlayedPerDay: number;
  xanaxPerDay: number;
  hasPointsRefill: boolean;
  pointsRefillDaysPerWeek?: number;
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
    pointsRefillDaysPerWeek?: number;
    daysSkippedPerMonth?: number;
  }) => void;
}

export default function EnergySourcesSection({
  maxEnergy,
  hoursPlayedPerDay,
  xanaxPerDay,
  hasPointsRefill,
  pointsRefillDaysPerWeek = DEFAULT_POINTS_REFILL_DAYS_PER_WEEK,
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

      <NumericTextField
        label="Hours/Day"
        value={hoursPlayedPerDay}
        onChange={(value) => onUpdate({ hoursPlayedPerDay: value })}
        fullWidth
        margin="dense"
        size="small"
        min={0}
        max={24}
      />

      <NumericTextField
        label="Xanax/Day"
        value={xanaxPerDay}
        onChange={(value) => onUpdate({ xanaxPerDay: value })}
        fullWidth
        margin="dense"
        size="small"
        min={0}
        helperText={`Decimals allowed (e.g., ${(2.5).toLocaleString()} for averaging usage)`}
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

      {hasPointsRefill && (
        <NumericTextField
          label="Days/Week Using Refill"
          value={pointsRefillDaysPerWeek ?? DEFAULT_POINTS_REFILL_DAYS_PER_WEEK}
          onChange={(value) => onUpdate({ pointsRefillDaysPerWeek: value })}
          fullWidth
          margin="dense"
          size="small"
          min={1}
          max={7}
          defaultValue={DEFAULT_POINTS_REFILL_DAYS_PER_WEEK}
          step={1}
          helperText="How many days per week do you use points refill?"
        />
      )}

      {showCosts && itemPricesData && hasPointsRefill && itemPricesData.prices[0] !== null && (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
          Cost: {formatCurrency(itemPricesData.prices[0]! * 30 * (pointsRefillDaysPerWeek / 7))} per day (avg)
        </Typography>
      )}

      <NumericTextField
        label="Days Skipped/Month"
        value={daysSkippedPerMonth}
        onChange={(value) => onUpdate({ daysSkippedPerMonth: value })}
        fullWidth
        margin="dense"
        size="small"
        min={0}
        max={30}
      />

      <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 1 }}>
        Daily E:{' '}
        {calculateDailyEnergy(
          hoursPlayedPerDay,
          xanaxPerDay,
          hasPointsRefill,
          companyBenefit.bonusEnergyPerDay,
          maxEnergy,
          pointsRefillDaysPerWeek
        ).toLocaleString()}
      </Typography>
    </>
  );
}
