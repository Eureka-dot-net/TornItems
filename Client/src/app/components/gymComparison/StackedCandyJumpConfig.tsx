import {
  FormControlLabel,
  Switch,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  Box,
} from '@mui/material';
import {
  CANDY_ITEM_IDS,
  DEFAULT_CANDY_QUANTITY,
  DEFAULT_EDVD_FREQUENCY_DAYS,
} from '../../../lib/constants/gymConstants';
import { formatCurrency } from '../../../lib/utils/gymHelpers';

interface StackedCandyJumpConfigProps {
  enabled: boolean;
  frequency: number;
  itemId: number;
  quantity: number;
  factionBenefit: number;
  limit: 'indefinite' | 'count' | 'stat';
  count: number;
  statTarget: number;
  usePointRefill: boolean;
  xanaxStacked: number;
  stackOnNaturalEnergy: boolean;
  hasPointsRefill: boolean; // Whether user already uses daily points refill
  showCosts: boolean;
  itemPricesData?: {
    prices: Record<number, number | null>;
  };
  onUpdate: (updates: {
    stackedCandyJumpEnabled?: boolean;
    stackedCandyJumpFrequency?: number;
    stackedCandyJumpItemId?: number;
    stackedCandyJumpQuantity?: number;
    stackedCandyJumpFactionBenefit?: number;
    stackedCandyJumpLimit?: 'indefinite' | 'count' | 'stat';
    stackedCandyJumpCount?: number;
    stackedCandyJumpStatTarget?: number;
    stackedCandyJumpUsePointRefill?: boolean;
    stackedCandyJumpXanaxStacked?: number;
    stackedCandyJumpStackOnNaturalEnergy?: boolean;
  }) => void;
}

export default function StackedCandyJumpConfig({
  enabled,
  frequency,
  itemId,
  quantity,
  factionBenefit,
  limit,
  count,
  statTarget,
  usePointRefill,
  xanaxStacked,
  stackOnNaturalEnergy,
  hasPointsRefill,
  showCosts,
  itemPricesData,
  onUpdate,
}: StackedCandyJumpConfigProps) {
  return (
    <>
      <FormControlLabel
        control={
          <Switch
            checked={enabled}
            onChange={(e) => onUpdate({ stackedCandyJumpEnabled: e.target.checked })}
            size="small"
          />
        }
        label="Stacked Candy Jumps"
      />

      {enabled && (
        <>
          <Alert severity="info" sx={{ mt: 1, mb: 2 }}>
            <Typography variant="body2">
              A <strong>Stacked Candy Jump</strong> works like an eDVD jump but uses candies instead of DVDs.
              You stack xanax before the jump, then on jump day use 1 more xanax and 1 ecstasy
              along with candies to get a happiness boost for enhanced training.
            </Typography>
          </Alert>

          <TextField
            label="Days Between Jumps"
            type="number"
            value={frequency ?? ''}
            onChange={(e) =>
              onUpdate({
                stackedCandyJumpFrequency: e.target.value === '' ? DEFAULT_EDVD_FREQUENCY_DAYS : Math.max(1, Number(e.target.value)),
              })
            }
            fullWidth
            margin="dense"
            size="small"
            inputProps={{ step: 'any', min: 1 }}
          />

          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Xanax Stacking Options
            </Typography>
          </Box>

          <TextField
            label="Number of Xanax to Stack"
            type="number"
            value={xanaxStacked ?? 4}
            onChange={(e) => {
              const value = e.target.value === '' ? 4 : Math.min(4, Math.max(1, Number(e.target.value)));
              onUpdate({ stackedCandyJumpXanaxStacked: value });
            }}
            fullWidth
            margin="dense"
            size="small"
            inputProps={{ step: 1, min: 1, max: 4 }}
            helperText="1-4 xanax. 4 xanax = 1000 energy, 3 = 750, 2 = 500, 1 = 250"
          />

          {xanaxStacked < 4 && (
            <FormControlLabel
              control={
                <Switch
                  checked={stackOnNaturalEnergy}
                  onChange={(e) => onUpdate({ stackedCandyJumpStackOnNaturalEnergy: e.target.checked })}
                  size="small"
                />
              }
              label="Stack on top of natural energy bar"
              sx={{ mt: 1, display: 'block' }}
            />
          )}

          {xanaxStacked < 4 && stackOnNaturalEnergy && (
            <Typography variant="caption" sx={{ display: 'block', ml: 4, color: 'text.secondary' }}>
              Your energy bar will be added to the stacked xanax energy at jump time
            </Typography>
          )}

          {!hasPointsRefill && (
            <FormControlLabel
              control={
                <Switch
                  checked={usePointRefill}
                  onChange={(e) => onUpdate({ stackedCandyJumpUsePointRefill: e.target.checked })}
                  size="small"
                />
              }
              label="Use point refill during jump"
              sx={{ mt: 1, display: 'block' }}
            />
          )}

          {!hasPointsRefill && usePointRefill && (
            <Typography variant="caption" sx={{ display: 'block', ml: 4, color: 'text.secondary' }}>
              Point refill energy will be added to your jump energy
            </Typography>
          )}

          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Candy Configuration
            </Typography>
          </Box>

          <FormControl fullWidth margin="dense" size="small">
            <InputLabel>Candy Type</InputLabel>
            <Select
              value={itemId}
              label="Candy Type"
              onChange={(e) => onUpdate({ stackedCandyJumpItemId: Number(e.target.value) })}
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
                stackedCandyJumpQuantity:
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
                stackedCandyJumpFactionBenefit:
                  e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)),
              })
            }
            fullWidth
            margin="dense"
            size="small"
            inputProps={{ step: 'any', min: 0 }}
            helperText="Faction perk percentage that boosts happiness from candies"
          />

          <FormControl fullWidth margin="dense" size="small">
            <InputLabel>Jump Limit</InputLabel>
            <Select
              value={limit}
              label="Jump Limit"
              onChange={(e) =>
                onUpdate({ stackedCandyJumpLimit: e.target.value as 'indefinite' | 'count' | 'stat' })
              }
            >
              <MenuItem value="indefinite">Indefinite</MenuItem>
              <MenuItem value="count">Set Amount</MenuItem>
              <MenuItem value="stat">Until Stat Level</MenuItem>
            </Select>
          </FormControl>

          {limit === 'count' && (
            <TextField
              label="Number of Jumps"
              type="number"
              value={count ?? ''}
              onChange={(e) =>
                onUpdate({
                  stackedCandyJumpCount: e.target.value === '' ? 1 : Math.max(1, Number(e.target.value)),
                })
              }
              fullWidth
              margin="dense"
              size="small"
              inputProps={{ step: 'any', min: 1 }}
            />
          )}

          {limit === 'stat' && (
            <TextField
              label="Stat Target (Individual)"
              type="number"
              value={statTarget ?? ''}
              onChange={(e) =>
                onUpdate({
                  stackedCandyJumpStatTarget:
                    e.target.value === '' ? 1000000 : Math.max(0, Number(e.target.value)),
                })
              }
              fullWidth
              margin="dense"
              size="small"
              inputProps={{ step: 'any', min: 0 }}
            />
          )}

          <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.secondary' }}>
            One stacked candy jump every {frequency} day{frequency > 1 ? 's' : ''} using {quantity} candies with {xanaxStacked} xanax stacked
            {showCosts && itemPricesData && itemPricesData.prices[itemId] !== null && (() => {
              const candyPrice = itemPricesData.prices[itemId]!;
              const costPerJump = quantity * candyPrice;
              return ` costing ${formatCurrency(costPerJump)} per jump (candies only, excludes xanax/ecstasy)`;
            })()}
          </Typography>
        </>
      )}
    </>
  );
}
