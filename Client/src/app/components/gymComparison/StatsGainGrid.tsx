import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
} from '@mui/material';

interface StatGain {
  strength: number;
  speed: number;
  defense: number;
  dexterity: number;
}

interface StatsGainGridProps {
  states: Array<{
    id: string;
    name: string;
    color?: string;
  }>;
  statGains: Record<string, StatGain>;
  initialStats?: StatGain;
  showDifference?: boolean;
  showGainOnly?: boolean;
  avgPerJumpLabel?: string;
}

export default function StatsGainGrid({
  states,
  statGains,
  initialStats,
  showDifference = false,
  showGainOnly = false,
  avgPerJumpLabel,
}: StatsGainGridProps) {
  const statNames: Array<keyof StatGain> = ['strength', 'speed', 'defense', 'dexterity'];

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>Stat</TableCell>
            {states.map((state) => (
              <TableCell
                key={state.id}
                align="right"
                sx={{
                  fontWeight: 'bold',
                  color: state.color || 'inherit',
                }}
              >
                {state.name}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {statNames.map((statName) => (
            <TableRow key={statName}>
              <TableCell sx={{ textTransform: 'capitalize' }}>
                {statName}
                {avgPerJumpLabel && ` ${avgPerJumpLabel}`}
              </TableCell>
              {states.map((state) => {
                const statData = statGains[state.id];
                if (!statData) {
                  return <TableCell key={state.id} align="right">-</TableCell>;
                }

                const finalValue = statData[statName];
                
                if (showGainOnly) {
                  return (
                    <TableCell key={state.id} align="right">
                      +{Math.round(finalValue).toLocaleString()}
                    </TableCell>
                  );
                }

                const difference = initialStats
                  ? finalValue - initialStats[statName]
                  : finalValue;

                return (
                  <TableCell key={state.id} align="right">
                    <Box>
                      <Typography variant="body2">
                        {Math.round(finalValue).toLocaleString()}
                      </Typography>
                      {initialStats && (
                        <Typography variant="caption" sx={{ color: 'success.main', display: 'block' }}>
                          +{Math.round(difference).toLocaleString()}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
          <TableRow sx={{ borderTop: 2, borderColor: 'divider' }}>
            <TableCell sx={{ fontWeight: 'bold' }}>
              Total{avgPerJumpLabel && ` ${avgPerJumpLabel}`}
            </TableCell>
            {states.map((state) => {
              const statData = statGains[state.id];
              if (!statData) {
                return <TableCell key={state.id} align="right">-</TableCell>;
              }

              const total = Math.round(
                statData.strength + statData.speed + statData.defense + statData.dexterity
              );

              return (
                <TableCell
                  key={state.id}
                  align="right"
                  sx={{ fontWeight: 'bold', color: showGainOnly ? 'success.main' : 'inherit' }}
                >
                  {showGainOnly && '+'}
                  {total.toLocaleString()}
                </TableCell>
              );
            })}
          </TableRow>
          {showDifference && initialStats && (
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', color: 'success.main' }}>Difference</TableCell>
              {states.map((state) => {
                const statData = statGains[state.id];
                if (!statData) {
                  return <TableCell key={state.id} align="right">-</TableCell>;
                }

                const totalGain = Math.round(
                  (statData.strength - initialStats.strength) +
                  (statData.speed - initialStats.speed) +
                  (statData.defense - initialStats.defense) +
                  (statData.dexterity - initialStats.dexterity)
                );

                return (
                  <TableCell
                    key={state.id}
                    align="right"
                    sx={{ fontWeight: 'bold', color: 'success.main' }}
                  >
                    +{totalGain.toLocaleString()}
                  </TableCell>
                );
              })}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
