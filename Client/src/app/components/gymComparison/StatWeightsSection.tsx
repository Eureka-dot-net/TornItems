import { Box, Typography, TextField, Button, FormControlLabel, Checkbox, Tooltip, IconButton, Select, MenuItem, FormControl } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

interface StatWeights {
  strength: number;
  speed: number;
  defense: number;
  dexterity: number;
}

type StatType = 'strength' | 'speed' | 'defense' | 'dexterity';

interface StatWeightsSectionProps {
  statWeights: StatWeights;
  onUpdate: (updates: Partial<StatWeights>) => void;
  getHanksRatio: (primaryStat: StatType) => StatWeights;
  getBaldrsRatio: (primaryStat: StatType) => StatWeights;
  getDefensiveBuildRatio: (primaryStat: 'defense' | 'dexterity') => StatWeights;
  statDriftPercent?: number;
  onDriftUpdate?: (percent: number) => void;
  balanceAfterGymIndex?: number;
  onBalanceAfterGymIndexUpdate?: (gymIndex: number) => void;
  ignorePerksForGymSelection?: boolean;
  onIgnorePerksForGymSelectionUpdate?: (ignore: boolean) => void;
}

export default function StatWeightsSection({
  statWeights,
  onUpdate,
  getHanksRatio,
  getBaldrsRatio,
  getDefensiveBuildRatio,
  statDriftPercent,
  onDriftUpdate,
  balanceAfterGymIndex,
  onBalanceAfterGymIndexUpdate,
  ignorePerksForGymSelection,
  onIgnorePerksForGymSelectionUpdate,
}: StatWeightsSectionProps) {
  // Helper to get display value for dropdown
  const getDriftDisplayValue = () => {
    if (statDriftPercent === 0) return '0';
    if (statDriftPercent === 25) return '25';
    if (statDriftPercent === 50) return '50';
    if (statDriftPercent === 75) return '75';
    if (statDriftPercent === 100) return '100';
    // Default to closest value if not exact
    return '0';
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2">
          Stat Target Ratios
        </Typography>
        <Button
          size="small"
          variant="outlined"
          onClick={() => onUpdate({ strength: 1, speed: 1, defense: 1, dexterity: 1 })}
          sx={{ fontSize: '0.7rem', minWidth: '70px', p: 0.5 }}
          aria-label="Set all stat weights to balanced (1:1:1:1)"
        >
          Balanced
        </Button>
      </Box>

      {/* Stat Drift Configuration */}
      {onDriftUpdate && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
              Stat Drift
            </Typography>
            <Tooltip 
              title={
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>No stat drift:</strong> Always maintain exact ratio balance (e.g., 1:1:1:1).
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>25%-75%:</strong> Allow flexibility to train stats with better gains while staying relatively balanced.
                  </Typography>
                  <Typography variant="body2">
                    <strong>No limits:</strong> Pure "train best stat" behavior. Train the stat with the highest actual gain (considering perks) until George's gym unlocks.
                  </Typography>
                </Box>
              }
              placement="top"
              arrow
            >
              <IconButton size="small" sx={{ p: 0 }}>
                <HelpOutlineIcon sx={{ fontSize: '1rem' }} />
              </IconButton>
            </Tooltip>
            <FormControl size="small" sx={{ flexGrow: 1 }}>
              <Select
                value={getDriftDisplayValue()}
                onChange={(e) => onDriftUpdate(Number(e.target.value))}
                sx={{ fontSize: '0.875rem' }}
              >
                <MenuItem value="0">No stat drift</MenuItem>
                <MenuItem value="25">25%</MenuItem>
                <MenuItem value="50">50%</MenuItem>
                <MenuItem value="75">75%</MenuItem>
                <MenuItem value="100">No limits</MenuItem>
              </Select>
            </FormControl>
          </Box>
          {onBalanceAfterGymIndexUpdate && (statDriftPercent ?? 0) > 0 && (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, mt: 0.5 }}>
                <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                  Revert to balanced after
                </Typography>
                <FormControl size="small" sx={{ flexGrow: 1 }}>
                  <Select
                    value={balanceAfterGymIndex ?? 19}
                    onChange={(e) => onBalanceAfterGymIndexUpdate(Number(e.target.value))}
                    sx={{ fontSize: '0.875rem' }}
                  >
                    <MenuItem value={-1}>Never</MenuItem>
                    <MenuItem value={19}>Cha Cha's</MenuItem>
                    <MenuItem value={23}>George's</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              {onIgnorePerksForGymSelectionUpdate && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={ignorePerksForGymSelection ?? false}
                      onChange={(e) => onIgnorePerksForGymSelectionUpdate(e.target.checked)}
                      size="small"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="caption">
                        Ignore perks for gym selection
                      </Typography>
                      <Tooltip 
                        title="When enabled, perks are ignored when deciding which gym/stat to train. Perks are still applied to actual gains."
                        placement="top"
                        arrow
                      >
                        <IconButton size="small" sx={{ p: 0 }}>
                          <HelpOutlineIcon sx={{ fontSize: '0.875rem' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                  sx={{ mt: 0.5 }}
                />
              )}
            </>
          )}
        </Box>
      )}

      {/* Strength */}
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mb: 1 }}>
        <TextField
          label="Str"
          type="number"
          value={statWeights.strength ?? ''}
          onChange={(e) =>
            onUpdate({
              strength: e.target.value === '' ? 0 : Number(e.target.value),
            })
          }
          size="small"
          inputProps={{ step: 'any', min: 0 }}
          sx={{ width: 80 }}
        />
        <Button
          size="small"
          variant="outlined"
          onClick={() => onUpdate(getHanksRatio('strength'))}
          sx={{ fontSize: '0.65rem', minWidth: '45px', p: 0.5 }}
        >
          Hank
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={() => onUpdate(getBaldrsRatio('strength'))}
          sx={{ fontSize: '0.65rem', minWidth: '45px', p: 0.5 }}
        >
          Baldr
        </Button>
      </Box>

      {/* Speed */}
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mb: 1 }}>
        <TextField
          label="Spd"
          type="number"
          value={statWeights.speed ?? ''}
          onChange={(e) =>
            onUpdate({
              speed: e.target.value === '' ? 0 : Number(e.target.value),
            })
          }
          size="small"
          inputProps={{ step: 'any', min: 0 }}
          sx={{ width: 80 }}
        />
        <Button
          size="small"
          variant="outlined"
          onClick={() => onUpdate(getHanksRatio('speed'))}
          sx={{ fontSize: '0.65rem', minWidth: '45px', p: 0.5 }}
        >
          Hank
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={() => onUpdate(getBaldrsRatio('speed'))}
          sx={{ fontSize: '0.65rem', minWidth: '45px', p: 0.5 }}
        >
          Baldr
        </Button>
      </Box>

      {/* Defense */}
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mb: 1 }}>
        <TextField
          label="Def"
          type="number"
          value={statWeights.defense ?? ''}
          onChange={(e) =>
            onUpdate({
              defense: e.target.value === '' ? 0 : Number(e.target.value),
            })
          }
          size="small"
          inputProps={{ step: 'any', min: 0 }}
          sx={{ width: 80 }}
        />
        <Button
          size="small"
          variant="outlined"
          onClick={() => onUpdate(getHanksRatio('defense'))}
          sx={{ fontSize: '0.65rem', minWidth: '45px', p: 0.5 }}
        >
          Hank
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={() => onUpdate(getBaldrsRatio('defense'))}
          sx={{ fontSize: '0.65rem', minWidth: '45px', p: 0.5 }}
        >
          Baldr
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={() => onUpdate(getDefensiveBuildRatio('defense'))}
          sx={{ fontSize: '0.65rem', minWidth: '45px', p: 0.5 }}
        >
          Def
        </Button>
      </Box>

      {/* Dexterity */}
      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mb: 1 }}>
        <TextField
          label="Dex"
          type="number"
          value={statWeights.dexterity ?? ''}
          onChange={(e) =>
            onUpdate({
              dexterity: e.target.value === '' ? 0 : Number(e.target.value),
            })
          }
          size="small"
          inputProps={{ step: 'any', min: 0 }}
          sx={{ width: 80 }}
        />
        <Button
          size="small"
          variant="outlined"
          onClick={() => onUpdate(getHanksRatio('dexterity'))}
          sx={{ fontSize: '0.65rem', minWidth: '45px', p: 0.5 }}
        >
          Hank
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={() => onUpdate(getBaldrsRatio('dexterity'))}
          sx={{ fontSize: '0.65rem', minWidth: '45px', p: 0.5 }}
        >
          Baldr
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={() => onUpdate(getDefensiveBuildRatio('dexterity'))}
          sx={{ fontSize: '0.65rem', minWidth: '45px', p: 0.5 }}
        >
          Dex
        </Button>
      </Box>
    </>
  );
}
