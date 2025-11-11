import {
  Typography,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import type { SimulationResult } from '../../../../lib/utils/gymProgressionCalculator';

interface EdvdJumpGainsTableProps {
  comparisonStates: Array<{ id: string; name: string; edvdJumpEnabled: boolean }>;
  results: Record<string, SimulationResult>;
  chartColors: string[];
}

export default function EdvdJumpGainsTable({
  comparisonStates,
  results,
  chartColors,
}: EdvdJumpGainsTableProps) {
  const edvdStates = comparisonStates.filter(s => s.edvdJumpEnabled);
  
  if (edvdStates.length === 0) {
    return null;
  }

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>eDVD Jump Stat Gains</Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Stat</TableCell>
              {edvdStates.map((state) => {
                const stateIndex = comparisonStates.indexOf(state);
                return (
                  <TableCell 
                    key={state.id} 
                    align="right" 
                    sx={{ 
                      fontWeight: 'bold',
                      color: chartColors[stateIndex % chartColors.length]
                    }}
                  >
                    {state.name}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {(['strength', 'speed', 'defense', 'dexterity'] as const).map((statName) => (
              <TableRow key={statName}>
                <TableCell sx={{ textTransform: 'capitalize' }}>{statName} (avg/jump)</TableCell>
                {edvdStates.map((state) => {
                  const result = results[state.id];
                  if (!result || !result.edvdJumpGains) {
                    return <TableCell key={state.id} align="right">-</TableCell>;
                  }
                  return (
                    <TableCell key={state.id} align="right">
                      +{Math.round(result.edvdJumpGains.averagePerJump[statName]).toLocaleString()}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
            <TableRow sx={{ borderTop: 2, borderColor: 'divider' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Total (avg/jump)</TableCell>
              {edvdStates.map((state) => {
                const result = results[state.id];
                if (!result || !result.edvdJumpGains) {
                  return <TableCell key={state.id} align="right">-</TableCell>;
                }
                const avgGains = result.edvdJumpGains.averagePerJump;
                const totalAvg = avgGains.strength + avgGains.speed + avgGains.defense + avgGains.dexterity;
                return (
                  <TableCell key={state.id} align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    +{Math.round(totalAvg).toLocaleString()}
                  </TableCell>
                );
              })}
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Total Jumps</TableCell>
              {edvdStates.map((state) => {
                const result = results[state.id];
                if (!result || !result.edvdJumpCosts) {
                  return <TableCell key={state.id} align="right">-</TableCell>;
                }
                return (
                  <TableCell key={state.id} align="right">
                    {result.edvdJumpCosts.totalJumps}
                  </TableCell>
                );
              })}
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Total Gains</TableCell>
              {edvdStates.map((state) => {
                const result = results[state.id];
                if (!result || !result.edvdJumpGains) {
                  return <TableCell key={state.id} align="right">-</TableCell>;
                }
                const totalGains = result.edvdJumpGains.totalGains;
                const total = totalGains.strength + totalGains.speed + totalGains.defense + totalGains.dexterity;
                return (
                  <TableCell key={state.id} align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    +{Math.round(total).toLocaleString()}
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
