import { Box, Typography, TextField, Button, Select, MenuItem, FormControl, Tooltip, IconButton } from '@mui/material';
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
  trainingStrategy?: 'balanced' | 'bestGains';
  onStrategyUpdate?: (strategy: 'balanced' | 'bestGains') => void;
}

export default function StatWeightsSection({
  statWeights,
  onUpdate,
  getHanksRatio,
  getBaldrsRatio,
  getDefensiveBuildRatio,
  trainingStrategy,
  onStrategyUpdate,
}: StatWeightsSectionProps) {
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

      {/* Training Strategy Selection */}
      {onStrategyUpdate && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Training Strategy
            </Typography>
            <Tooltip 
              title={
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Balanced Training:</strong> Train the lowest stat according to your weighings to keep stats balanced based on target ratios.
                  </Typography>
                  <Typography variant="body2">
                    <strong>Best Gains Training:</strong> Train the stat with the highest gym dots (best gains) until George's gym is unlocked. If multiple stats have the same best dots, the most out-of-sync stat is trained. After George's gym, reverts to balanced training.
                  </Typography>
                </Box>
              }
              placement="top"
              arrow
            >
              <IconButton size="small" sx={{ p: 0, ml: 0.5 }}>
                <HelpOutlineIcon sx={{ fontSize: '1rem' }} />
              </IconButton>
            </Tooltip>
          </Box>
          <FormControl fullWidth size="small">
            <Select
              value={trainingStrategy || 'balanced'}
              onChange={(e) => onStrategyUpdate(e.target.value as 'balanced' | 'bestGains')}
              sx={{ fontSize: '0.875rem' }}
            >
              <MenuItem value="balanced">Balanced Training</MenuItem>
              <MenuItem value="bestGains">Best Gains Training</MenuItem>
            </Select>
          </FormControl>
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
