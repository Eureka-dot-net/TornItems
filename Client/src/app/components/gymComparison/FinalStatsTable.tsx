import { Box, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { CHART_COLORS } from '../../../lib/constants/gymConstants';
import type { SimulationResult } from '../../../lib/utils/gymProgressionCalculator';

interface ComparisonState {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface Stats {
  strength: number;
  speed: number;
  defense: number;
  dexterity: number;
}

interface FinalStatsTableProps {
  comparisonStates: ComparisonState[];
  results: Record<string, SimulationResult>;
  initialStats: Stats;
}

export default function FinalStatsTable({
  comparisonStates,
  results,
  initialStats
}: FinalStatsTableProps) {
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>Final Stats Comparison</Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Stat</TableCell>
              {comparisonStates.map((state, index) => (
                <TableCell 
                  key={state.id} 
                  align="right" 
                  sx={{ 
                    fontWeight: 'bold',
                    color: CHART_COLORS[index % CHART_COLORS.length]
                  }}
                >
                  {state.name}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {(['strength', 'speed', 'defense', 'dexterity'] as const).map((statName) => (
              <TableRow key={statName}>
                <TableCell sx={{ textTransform: 'capitalize' }}>{statName}</TableCell>
                {comparisonStates.map((state) => {
                  const result = results[state.id];
                  if (!result) return <TableCell key={state.id} align="right">-</TableCell>;
                  const finalValue = result.finalStats[statName];
                  const difference = finalValue - initialStats[statName];
                  return (
                    <TableCell key={state.id} align="right">
                      <Box>
                        <Typography variant="body2">
                          {finalValue.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'success.main', display: 'block' }}>
                          +{difference.toLocaleString()}
                        </Typography>
                      </Box>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
            <TableRow sx={{ borderTop: 2, borderColor: 'divider' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
              {comparisonStates.map((state) => {
                const result = results[state.id];
                if (!result) return <TableCell key={state.id} align="right">-</TableCell>;
                const total = result.finalStats.strength + result.finalStats.speed + 
                            result.finalStats.defense + result.finalStats.dexterity;
                return (
                  <TableCell key={state.id} align="right" sx={{ fontWeight: 'bold' }}>
                    {total.toLocaleString()}
                  </TableCell>
                );
              })}
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', color: 'success.main' }}>Difference</TableCell>
              {comparisonStates.map((state) => {
                const result = results[state.id];
                if (!result) return <TableCell key={state.id} align="right">-</TableCell>;
                const totalGain = (result.finalStats.strength - initialStats.strength) + 
                                (result.finalStats.speed - initialStats.speed) + 
                                (result.finalStats.defense - initialStats.defense) + 
                                (result.finalStats.dexterity - initialStats.dexterity);
                return (
                  <TableCell key={state.id} align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    +{totalGain.toLocaleString()}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
