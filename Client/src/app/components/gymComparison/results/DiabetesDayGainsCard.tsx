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

interface DiabetesDayGainsCardProps {
  comparisonStates: Array<{ id: string; name: string; diabetesDayEnabled: boolean }>;
  results: Record<string, SimulationResult>;
  chartColors: string[];
}

export default function DiabetesDayGainsCard({
  comparisonStates,
  results,
  chartColors,
}: DiabetesDayGainsCardProps) {
  const diabetesStates = comparisonStates.filter(s => s.diabetesDayEnabled);
  
  if (diabetesStates.length === 0) {
    return null;
  }

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>Diabetes Day Gains</Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Stat</TableCell>
              {diabetesStates.map((state) => {
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
                <TableCell sx={{ textTransform: 'capitalize' }}>{statName}</TableCell>
                {diabetesStates.map((state) => {
                  const result = results[state.id];
                  if (!result || !result.diabetesDayTotalGains) {
                    return <TableCell key={state.id} align="right">-</TableCell>;
                  }
                  return (
                    <TableCell key={state.id} align="right">
                      +{result.diabetesDayTotalGains[statName].toLocaleString()}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
            <TableRow sx={{ borderTop: 2, borderColor: 'divider' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
              {diabetesStates.map((state) => {
                const result = results[state.id];
                if (!result || !result.diabetesDayTotalGains) {
                  return <TableCell key={state.id} align="right">-</TableCell>;
                }
                const ddGains = result.diabetesDayTotalGains;
                const totalGain = ddGains.strength + ddGains.speed + ddGains.defense + ddGains.dexterity;
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
