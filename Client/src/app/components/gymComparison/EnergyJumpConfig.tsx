import {
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from '@mui/material';
import { NumericTextField } from '../../../lib/components';
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
                // Update quantity based on item type (uses constants for default values)
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

          <NumericTextField
            label="Items per Day"
            value={quantity}
            onChange={(value) => onUpdate({ energyJumpQuantity: value })}
            fullWidth
            margin="dense"
            size="small"
            min={1}
            defaultValue={itemId === ENERGY_ITEM_IDS.FHC ? DEFAULT_FHC_QUANTITY : DEFAULT_ENERGY_DRINK_QUANTITY}
          />

          <NumericTextField
            label="Faction Benefit %"
            value={factionBenefit}
            onChange={(value) => onUpdate({ energyJumpFactionBenefit: value })}
            fullWidth
            margin="dense"
            size="small"
            min={0}
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
