import {
  FormControlLabel,
  Switch,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from '@mui/material';
import {
  CANDY_ITEM_IDS,
  DEFAULT_CANDY_QUANTITY,
} from '../../../lib/constants/gymConstants';
import { formatCurrency } from '../../../lib/utils/gymHelpers';

interface CandyJumpConfigProps {
  enabled: boolean;
  itemId: number;
  useEcstasy: boolean;
  quantity: number;
  hasPointsRefill: boolean;
  xanaxPerDay: number;
  maxEnergy: number;
  showCosts: boolean;
  itemPricesData?: {
    prices: Record<number, number | null>;
  };
  onUpdate: (updates: {
    candyJumpEnabled?: boolean;
    candyJumpItemId?: number;
    candyJumpUseEcstasy?: boolean;
    candyJumpQuantity?: number;
  }) => void;
}

export default function CandyJumpConfig({
  enabled,
  itemId,
  useEcstasy,
  quantity,
  hasPointsRefill,
  xanaxPerDay,
  maxEnergy,
  showCosts,
  itemPricesData,
  onUpdate,
}: CandyJumpConfigProps) {
  // Calculate energy used
  let energyUsed = maxEnergy;
  if (hasPointsRefill && xanaxPerDay >= 1) {
    energyUsed = maxEnergy + maxEnergy + 250;
  } else if (xanaxPerDay >= 1) {
    energyUsed = maxEnergy + 250;
  } else if (hasPointsRefill) {
    energyUsed = maxEnergy + maxEnergy;
  }

  return (
    <>
      <FormControlLabel
        control={
          <Switch
            checked={enabled}
            onChange={(e) => onUpdate({ candyJumpEnabled: e.target.checked })}
            size="small"
          />
        }
        label="Candy"
      />

      {enabled && (
        <>
          <FormControl fullWidth margin="dense" size="small">
            <InputLabel>Candy Type</InputLabel>
            <Select
              value={itemId}
              label="Candy Type"
              onChange={(e) => onUpdate({ candyJumpItemId: Number(e.target.value) })}
            >
              <MenuItem value={CANDY_ITEM_IDS.HAPPY_25}>25 Happy</MenuItem>
              <MenuItem value={CANDY_ITEM_IDS.HAPPY_35}>35 Happy</MenuItem>
              <MenuItem value={CANDY_ITEM_IDS.HAPPY_75}>75 Happy</MenuItem>
              <MenuItem value={CANDY_ITEM_IDS.HAPPY_100}>100 Happy</MenuItem>
              <MenuItem value={CANDY_ITEM_IDS.HAPPY_150}>150 Happy</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Candies per Day"
            type="number"
            value={quantity ?? ''}
            onChange={(e) =>
              onUpdate({
                candyJumpQuantity:
                  e.target.value === '' ? DEFAULT_CANDY_QUANTITY : Math.max(1, Number(e.target.value)),
              })
            }
            fullWidth
            margin="dense"
            size="small"
            inputProps={{ step: 'any', min: 1 }}
          />

          <FormControlLabel
            control={
              <Switch
                checked={useEcstasy}
                onChange={(e) => onUpdate({ candyJumpUseEcstasy: e.target.checked })}
                size="small"
              />
            }
            label="Use Ecstasy"
            sx={{ mt: 1 }}
          />

          <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
            One candy train per day using {energyUsed} energy at{' '}
            {useEcstasy
              ? `(base happy + candy happy × ${quantity}) × 2`
              : `base happy + (candy happy × ${quantity})`}
            {showCosts && itemPricesData && itemPricesData.prices[itemId] !== null && (() => {
              const candyPrice = itemPricesData.prices[itemId]!;
              let costPerDay = quantity * candyPrice;
              if (useEcstasy && itemPricesData.prices[197] !== null) {
                costPerDay += itemPricesData.prices[197]!;
              }
              return ` costing ${formatCurrency(costPerDay)} per day`;
            })()}
          </Typography>
        </>
      )}
    </>
  );
}
