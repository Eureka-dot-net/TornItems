import {
  FormControlLabel,
  Switch,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Typography,
  Link,
} from '@mui/material';

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
          <TextField
            label="Days Between"
            type="number"
            value={frequency ?? ''}
            onChange={(e) =>
              onUpdate({
                edvdJumpFrequency: e.target.value === '' ? 1 : Math.max(1, Number(e.target.value)),
              })
            }
            fullWidth
            margin="dense"
            size="small"
            inputProps={{ step: 'any', min: 1 }}
          />

          <TextField
            label="DVDs Used"
            type="number"
            value={dvds ?? ''}
            onChange={(e) =>
              onUpdate({
                edvdJumpDvds: e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)),
              })
            }
            fullWidth
            margin="dense"
            size="small"
            inputProps={{ step: 'any', min: 0 }}
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
            <TextField
              label="Number of Jumps"
              type="number"
              value={count ?? ''}
              onChange={(e) =>
                onUpdate({
                  edvdJumpCount: e.target.value === '' ? 1 : Math.max(1, Number(e.target.value)),
                })
              }
              fullWidth
              margin="dense"
              size="small"
              inputProps={{ step: 'any', min: 1 }}
            />
          )}

          {limit === 'stat' && (
            <>
              <TextField
                label="Stat Target (Individual)"
                type="number"
                value={statTarget ?? ''}
                onChange={(e) =>
                  onUpdate({
                    edvdJumpStatTarget:
                      e.target.value === '' ? 140000 : Math.max(0, Number(e.target.value)),
                  })
                }
                fullWidth
                margin="dense"
                size="small"
                inputProps={{ step: 'any', min: 0 }}
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
