import {
  FormControlLabel,
  Switch,
  Typography,
} from '@mui/material';
import { NumericTextField } from '../../../lib/components';
import {
  DEFAULT_LOSS_REVIVE_NUMBER_PER_DAY,
  DEFAULT_LOSS_REVIVE_ENERGY_COST,
  DEFAULT_LOSS_REVIVE_DAYS_BETWEEN,
  DEFAULT_LOSS_REVIVE_PRICE,
} from '../../../lib/constants/gymConstants';
import { formatCurrency } from '../../../lib/utils/gymHelpers';

interface LossReviveConfigProps {
  enabled: boolean;
  numberPerDay: number;
  energyCost: number;
  daysBetween: number;
  pricePerLoss: number;
  showCosts: boolean;
  onUpdate: (updates: {
    lossReviveEnabled?: boolean;
    lossReviveNumberPerDay?: number;
    lossReviveEnergyCost?: number;
    lossReviveDaysBetween?: number;
    lossRevivePricePerLoss?: number;
  }) => void;
}

export default function LossReviveConfig({
  enabled,
  numberPerDay,
  energyCost,
  daysBetween,
  pricePerLoss,
  showCosts,
  onUpdate,
}: LossReviveConfigProps) {
  return (
    <>
      <FormControlLabel
        control={
          <Switch
            checked={enabled}
            onChange={(e) => onUpdate({ lossReviveEnabled: e.target.checked })}
            size="small"
          />
        }
        label="Loss / Revive"
      />

      {enabled && (
        <>
          <NumericTextField
            label="Number per Day"
            value={numberPerDay}
            onChange={(value) => onUpdate({ lossReviveNumberPerDay: value })}
            fullWidth
            margin="dense"
            size="small"
            min={1}
            defaultValue={DEFAULT_LOSS_REVIVE_NUMBER_PER_DAY}
          />

          <NumericTextField
            label="Energy Cost per Loss/Revive"
            value={energyCost}
            onChange={(value) => onUpdate({ lossReviveEnergyCost: value })}
            fullWidth
            margin="dense"
            size="small"
            min={1}
            defaultValue={DEFAULT_LOSS_REVIVE_ENERGY_COST}
          />

          <NumericTextField
            label="Days Between"
            value={daysBetween}
            onChange={(value) => onUpdate({ lossReviveDaysBetween: value })}
            fullWidth
            margin="dense"
            size="small"
            min={1}
            defaultValue={DEFAULT_LOSS_REVIVE_DAYS_BETWEEN}
          />

          {showCosts && (
            <NumericTextField
              label="Price per Loss/Revive"
              value={pricePerLoss}
              onChange={(value) => onUpdate({ lossRevivePricePerLoss: value })}
              fullWidth
              margin="dense"
              size="small"
              min={0}
              defaultValue={DEFAULT_LOSS_REVIVE_PRICE}
            />
          )}

          <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
            Energy reduced by {numberPerDay * energyCost} every {daysBetween} day{daysBetween !== 1 ? 's' : ''}
            {showCosts && pricePerLoss > 0 && ` • Income: ${formatCurrency(pricePerLoss)} per loss/revive`}
          </Typography>
        </>
      )}
    </>
  );
}
