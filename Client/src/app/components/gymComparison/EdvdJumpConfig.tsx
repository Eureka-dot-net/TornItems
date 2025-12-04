import {
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Typography,
  Link,
} from '@mui/material';
import { NumericTextField } from '../../../lib/components';

interface EdvdJumpConfigProps {
  enabled: boolean;
  frequency: number;
  dvds: number;
  limit: 'indefinite' | 'count' | 'stat';
  count: number;
  statTarget: number;
  adultNovelties: boolean;
  stackedCandyJumpEnabled?: boolean; // Optional prop to check for conflict
  onUpdate: (updates: {
    edvdJumpEnabled?: boolean;
    edvdJumpFrequency?: number;
    edvdJumpDvds?: number;
    edvdJumpLimit?: 'indefinite' | 'count' | 'stat';
    edvdJumpCount?: number;
    edvdJumpStatTarget?: number;
    edvdJumpAdultNovelties?: boolean;
  }) => void;
}

export default function EdvdJumpConfig({
  enabled,
  frequency,
  dvds,
  limit,
  count,
  statTarget,
  adultNovelties,
  stackedCandyJumpEnabled,
  onUpdate,
}: EdvdJumpConfigProps) {
  return (
    <>
      <FormControlLabel
        control={
          <Switch
            checked={enabled}
            onChange={(e) => onUpdate({ edvdJumpEnabled: e.target.checked })}
            size="small"
          />
        }
        label="EDVD Jumps"
      />

      {enabled && stackedCandyJumpEnabled && (
        <Alert severity="warning" sx={{ mt: 1, mb: 2 }}>
          Both eDVD and Stacked Candy jumps are enabled. eDVD jumps will take priority if scheduled on the same day.
        </Alert>
      )}

      {enabled && (
        <>
          <NumericTextField
            label="Days Between"
            value={frequency}
            onChange={(value) => onUpdate({ edvdJumpFrequency: value })}
            fullWidth
            margin="dense"
            size="small"
            min={1}
            defaultValue={1}
          />

          <NumericTextField
            label="DVDs Used"
            value={dvds}
            onChange={(value) => onUpdate({ edvdJumpDvds: value })}
            fullWidth
            margin="dense"
            size="small"
            min={0}
          />

          <FormControl fullWidth margin="dense" size="small">
            <InputLabel>Jump Limit</InputLabel>
            <Select
              value={limit}
              label="Jump Limit"
              onChange={(e) =>
                onUpdate({ edvdJumpLimit: e.target.value as 'indefinite' | 'count' | 'stat' })
              }
            >
              <MenuItem value="indefinite">Indefinite</MenuItem>
              <MenuItem value="count">Set Amount</MenuItem>
              <MenuItem value="stat">Until Stat Level</MenuItem>
            </Select>
          </FormControl>

          {limit === 'count' && (
            <NumericTextField
              label="Number of Jumps"
              value={count}
              onChange={(value) => onUpdate({ edvdJumpCount: value })}
              fullWidth
              margin="dense"
              size="small"
              min={1}
              defaultValue={1}
            />
          )}

          {limit === 'stat' && (
            <>
              <NumericTextField
                label="Stat Target (Individual)"
                value={statTarget}
                onChange={(value) => onUpdate({ edvdJumpStatTarget: value })}
                fullWidth
                margin="dense"
                size="small"
                min={0}
                defaultValue={140000}
                helperText="Recommended: Stop at 140k per stat"
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                <Link 
                  href="https://www.torn.com/forums.php#/p=threads&f=3&t=16259382&b=0&a=0&start=0&to=22124548" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  📖 Read the eDVD guide for more info on when to stop jumping
                </Link>
              </Typography>
            </>
          )}

          <FormControlLabel
            control={
              <Switch
                checked={adultNovelties}
                onChange={(e) => onUpdate({ edvdJumpAdultNovelties: e.target.checked })}
                size="small"
              />
            }
            label="10★ Adult Novelties"
            sx={{ mt: 1 }}
          />
        </>
      )}
    </>
  );
}
