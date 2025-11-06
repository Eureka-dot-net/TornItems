import { Box, Typography, TextField, Button } from '@mui/material';

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
}

export default function StatWeightsSection({
  statWeights,
  onUpdate,
  getHanksRatio,
  getBaldrsRatio,
  getDefensiveBuildRatio,
}: StatWeightsSectionProps) {
  return (
    <>
      <Typography variant="subtitle2" gutterBottom>
        Stat Target Ratios
      </Typography>

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
