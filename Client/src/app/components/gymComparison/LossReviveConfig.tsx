import {
  FormControlLabel,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
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
          <TextField
            label="Number per Day"
            type="number"
            value={numberPerDay ?? ''}
            onChange={(e) =>
              onUpdate({
                lossReviveNumberPerDay:
                  e.target.value === ''
                    ? DEFAULT_LOSS_REVIVE_NUMBER_PER_DAY
                    : Math.max(1, Number(e.target.value)),
              })
            }
            fullWidth
            margin="dense"
            size="small"
            inputProps={{ step: 'any', min: 1 }}
          />

          <TextField
            label="Energy Cost per Loss/Revive"
            type="number"
            value={energyCost ?? ''}
            onChange={(e) =>
              onUpdate({
                lossReviveEnergyCost:
                  e.target.value === ''
                    ? DEFAULT_LOSS_REVIVE_ENERGY_COST
                    : Math.max(1, Number(e.target.value)),
              })
            }
            fullWidth
            margin="dense"
            size="small"
            inputProps={{ step: 'any', min: 1 }}
          />

          <TextField
            label="Days Between"
            type="number"
            value={daysBetween ?? ''}
            onChange={(e) =>
              onUpdate({
                lossReviveDaysBetween:
                  e.target.value === ''
                    ? DEFAULT_LOSS_REVIVE_DAYS_BETWEEN
                    : Math.max(1, Number(e.target.value)),
              })
            }
            fullWidth
            margin="dense"
            size="small"
            inputProps={{ step: 'any', min: 1 }}
          />

          {showCosts && (
            <TextField
              label="Price per Loss/Revive"
              type="number"
              value={pricePerLoss ?? ''}
              onChange={(e) =>
                onUpdate({
                  lossRevivePricePerLoss:
                    e.target.value === ''
                      ? DEFAULT_LOSS_REVIVE_PRICE
                      : Math.max(0, Number(e.target.value)),
                })
              }
              fullWidth
              margin="dense"
              size="small"
              inputProps={{ step: 'any', min: 0 }}
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
