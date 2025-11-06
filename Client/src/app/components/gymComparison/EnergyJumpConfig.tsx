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
  ENERGY_ITEM_IDS,
  ENERGY_VALUES,
  DEFAULT_ENERGY_DRINK_QUANTITY,
  DEFAULT_FHC_QUANTITY,
} from '../../../lib/constants/gymConstants';
import { formatCurrency } from '../../../lib/utils/gymHelpers';

interface EnergyJumpConfigProps {
  enabled: boolean;
  itemId: number;
  quantity: number;
  factionBenefit: number;
  maxEnergy: number;
  showCosts: boolean;
  itemPricesData?: {
    prices: Record<number, number | null>;
  };
  onUpdate: (updates: {
    energyJumpEnabled?: boolean;
    energyJumpItemId?: number;
    energyJumpQuantity?: number;
    energyJumpFactionBenefit?: number;
  }) => void;
}

export default function EnergyJumpConfig({
  enabled,
  itemId,
  quantity,
  factionBenefit,
  maxEnergy,
  showCosts,
  itemPricesData,
  onUpdate,
}: EnergyJumpConfigProps) {
  return (
    <>
      <FormControlLabel
        control={
          <Switch
            checked={enabled}
            onChange={(e) => onUpdate({ energyJumpEnabled: e.target.checked })}
            size="small"
          />
        }
        label="Energy"
      />

      {enabled && (
        <>
          <FormControl fullWidth margin="dense" size="small">
            <InputLabel>Energy Item</InputLabel>
            <Select
              value={itemId}
              label="Energy Item"
              onChange={(e) => {
                const newItemId = Number(e.target.value);
                // Update quantity based on item type: 4 for FHC, 12 for others
                const newQuantity =
                  newItemId === ENERGY_ITEM_IDS.FHC ? DEFAULT_FHC_QUANTITY : DEFAULT_ENERGY_DRINK_QUANTITY;
                onUpdate({
                  energyJumpItemId: newItemId,
                  energyJumpQuantity: newQuantity,
                });
              }}
            >
              <MenuItem value={ENERGY_ITEM_IDS.ENERGY_5}>5 Energy</MenuItem>
              <MenuItem value={ENERGY_ITEM_IDS.ENERGY_10}>10 Energy</MenuItem>
              <MenuItem value={ENERGY_ITEM_IDS.ENERGY_15}>15 Energy</MenuItem>
              <MenuItem value={ENERGY_ITEM_IDS.ENERGY_20}>20 Energy</MenuItem>
              <MenuItem value={ENERGY_ITEM_IDS.ENERGY_25}>25 Energy</MenuItem>
              <MenuItem value={ENERGY_ITEM_IDS.ENERGY_30}>30 Energy</MenuItem>
              <MenuItem value={ENERGY_ITEM_IDS.FHC}>FHC (Refill)</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Items per Day"
            type="number"
            value={quantity ?? ''}
            onChange={(e) =>
              onUpdate({
                energyJumpQuantity:
                  e.target.value === ''
                    ? itemId === ENERGY_ITEM_IDS.FHC
                      ? DEFAULT_FHC_QUANTITY
                      : DEFAULT_ENERGY_DRINK_QUANTITY
                    : Math.max(1, Number(e.target.value)),
              })
            }
            fullWidth
            margin="dense"
            size="small"
            inputProps={{ step: 'any', min: 1 }}
          />

          <TextField
            label="Faction Benefit %"
            type="number"
            value={factionBenefit ?? ''}
            onChange={(e) =>
              onUpdate({
                energyJumpFactionBenefit:
                  e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)),
              })
            }
            fullWidth
            margin="dense"
            size="small"
            inputProps={{ step: 'any', min: 0 }}
          />

          <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
            {itemId === ENERGY_ITEM_IDS.FHC
              ? `FHC refills ${maxEnergy} energy per use${
                  showCosts && itemPricesData && itemPricesData.prices[ENERGY_ITEM_IDS.FHC] !== null
                    ? ` costing ${formatCurrency(quantity * itemPricesData.prices[ENERGY_ITEM_IDS.FHC]!)} per day`
                    : ''
                }`
              : (() => {
                  const baseEnergy = ENERGY_VALUES[itemId] || 0;
                  const totalEnergy = baseEnergy * quantity;
                  const withBenefit =
                    factionBenefit > 0 ? totalEnergy * (1 + factionBenefit / 100) : totalEnergy;
                  return `${Math.round(withBenefit)} extra energy per day${
                    showCosts && itemPricesData && itemPricesData.prices[itemId] !== null
                      ? ` costing ${formatCurrency(quantity * itemPricesData.prices[itemId]!)} per day`
                      : ''
                  }`;
                })()}
          </Typography>
        </>
      )}
    </>
  );
}
