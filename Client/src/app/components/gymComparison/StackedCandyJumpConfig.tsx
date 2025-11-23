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
              You stack 3 xanax over 16 hours before the jump, then on jump day use 1 more xanax and 1 ecstasy
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
            One stacked candy jump every {frequency} day{frequency > 1 ? 's' : ''} using {quantity} candies
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
