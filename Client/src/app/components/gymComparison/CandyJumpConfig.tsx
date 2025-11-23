import {
  FormControlLabel,
  Switch,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  RadioGroup,
  Radio,
  Box,
  Alert,
} from '@mui/material';
import {
  CANDY_ITEM_IDS,
  DEFAULT_CANDY_QUANTITY,
  CONSUMABLE_ITEM_IDS,
} from '../../../lib/constants/gymConstants';
import { formatCurrency } from '../../../lib/utils/gymHelpers';

interface CandyJumpConfigProps {
  enabled: boolean;
  frequencyDays: number;
  itemId: number;
  quantity: number;
  factionBenefit: number;
  drugUsed: 'none' | 'xanax' | 'ecstasy';
  drugAlreadyIncluded: boolean;
  usePointRefill: boolean;
  hasPointsRefill: boolean;
  xanaxPerDay: number;
  maxEnergy: number;
  showCosts: boolean;
  itemPricesData?: {
    prices: Record<number, number | null>;
  };
  onUpdate: (updates: {
    candyJumpEnabled?: boolean;
    candyJumpFrequencyDays?: number;
    candyJumpItemId?: number;
    candyJumpQuantity?: number;
    candyJumpFactionBenefit?: number;
    candyJumpDrugUsed?: 'none' | 'xanax' | 'ecstasy';
    candyJumpDrugAlreadyIncluded?: boolean;
    candyJumpUsePointRefill?: boolean;
  }) => void;
}

export default function CandyJumpConfig({
  enabled,
  frequencyDays,
  itemId,
  quantity,
  factionBenefit,
  drugUsed,
  drugAlreadyIncluded,
  usePointRefill,
  hasPointsRefill,
  xanaxPerDay,
  maxEnergy,
  showCosts,
  itemPricesData,
  onUpdate,
}: CandyJumpConfigProps) {
  // Calculate energy used
  let energyUsed = maxEnergy;
  if (usePointRefill) {
    energyUsed += maxEnergy;
  }
  if (drugUsed === 'xanax') {
    energyUsed += 250;
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
        label="Half Candy Jump"
      />

      {enabled && (
        <>
          <Alert severity="info" sx={{ mt: 1, mb: 2 }}>
            <Typography variant="body2">
              A <strong>Half Candy Jump</strong> is a frequent jump done without stacking xanax. 
              This involves consuming happiness-boosting candies before training to temporarily 
              increase your happiness level for better gym gains.
            </Typography>
          </Alert>

          <TextField
            label="Jump Frequency (every X days)"
            type="number"
            value={frequencyDays}
            onChange={(e) =>
              onUpdate({
                candyJumpFrequencyDays: Math.max(1, Number(e.target.value) || 1),
              })
            }
            fullWidth
            margin="dense"
            size="small"
            inputProps={{ step: 1, min: 1 }}
            helperText="How often you perform this jump (1 = every day, 2 = every other day, etc.)"
          />

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
            label="Candies per Jump"
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

          <TextField
            label="Faction Perk % (Increase in Happiness)"
            type="number"
            value={factionBenefit ?? ''}
            onChange={(e) =>
              onUpdate({
                candyJumpFactionBenefit:
                  e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)),
              })
            }
            fullWidth
            margin="dense"
            size="small"
            inputProps={{ step: 'any', min: 0 }}
            helperText="Faction perk percentage that boosts happiness from candies"
          />

          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Drug Used with Candy
            </Typography>
            <RadioGroup
              value={drugUsed}
              onChange={(e) => onUpdate({ candyJumpDrugUsed: e.target.value as 'none' | 'xanax' | 'ecstasy' })}
            >
              <FormControlLabel value="none" control={<Radio size="small" />} label="None" />
              <FormControlLabel 
                value="xanax" 
                control={<Radio size="small" />} 
                label="Xanax (Extra 250 energy during the jump)" 
              />
              <FormControlLabel 
                value="ecstasy" 
                control={<Radio size="small" />} 
                label="Ecstasy (Doubles happiness)" 
              />
            </RadioGroup>
          </Box>

          {(drugUsed === 'xanax' || drugUsed === 'ecstasy') && xanaxPerDay > 0 && (
            <Box sx={{ mt: 1, mb: 1, ml: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                You use {xanaxPerDay} xanax per day for training normally.
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={drugAlreadyIncluded}
                    onChange={(e) => onUpdate({ candyJumpDrugAlreadyIncluded: e.target.checked })}
                    size="small"
                  />
                }
                label={drugUsed === 'xanax' 
                  ? "This xanax is already included in my daily xanax count"
                  : "This ecstasy replaces one of my daily xanax (counts toward 3 drug limit)"}
              />
            </Box>
          )}

          {!hasPointsRefill && (
            <Box sx={{ mt: 2, mb: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={usePointRefill}
                    onChange={(e) => onUpdate({ candyJumpUsePointRefill: e.target.checked })}
                    size="small"
                  />
                }
                label={`Use point refill during jump (extra ${maxEnergy} energy)`}
              />
            </Box>
          )}

          <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.secondary' }}>
            One half candy jump every {frequencyDays} day{frequencyDays > 1 ? 's' : ''} using {energyUsed} energy at{' '}
            {drugUsed === 'ecstasy'
              ? `(base happiness + (num candy × happiness × (1 + faction perk %))) × 2`
              : `base happiness + (num candy × happiness × (1 + faction perk %))`}
            {showCosts && itemPricesData && itemPricesData.prices[itemId] !== null && (() => {
              const candyPrice = itemPricesData.prices[itemId]!;
              let costPerJump = quantity * candyPrice;
              if (drugUsed === 'ecstasy' && !drugAlreadyIncluded && itemPricesData.prices[CONSUMABLE_ITEM_IDS.ECSTASY_CANDY] !== null) {
                costPerJump += itemPricesData.prices[CONSUMABLE_ITEM_IDS.ECSTASY_CANDY]!;
              } else if (drugUsed === 'xanax' && !drugAlreadyIncluded && itemPricesData.prices[CONSUMABLE_ITEM_IDS.XANAX] !== null) {
                costPerJump += itemPricesData.prices[CONSUMABLE_ITEM_IDS.XANAX]!;
              }
              return ` costing ${formatCurrency(costPerJump)} per jump`;
            })()}
          </Typography>
        </>
      )}
    </>
  );
}
