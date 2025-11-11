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
import { formatCurrency } from '../../../../lib/utils/gymHelpers';
import type { SimulationResult } from '../../../../lib/utils/gymProgressionCalculator';

interface CostEstimateCardProps {
  comparisonStates: Array<{ id: string; name: string }>;
  results: Record<string, SimulationResult>;
  initialStats: { strength: number; speed: number; defense: number; dexterity: number };
  months: number;
  chartColors: string[];
}

export default function CostEstimateCard({
  comparisonStates,
  results,
  initialStats,
  months,
  chartColors,
}: CostEstimateCardProps) {
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>Cost Estimate</Typography>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Cost Type</TableCell>
              {comparisonStates.map((state, index) => (
                <TableCell 
                  key={state.id} 
                  align="right" 
                  sx={{ 
                    fontWeight: 'bold',
                    color: chartColors[index % chartColors.length]
                  }}
                >
                  {state.name}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>EDVD Cost</TableCell>
              {comparisonStates.map((state) => {
                const result = results[state.id];
                if (!result || !result.edvdJumpCosts) {
                  return <TableCell key={state.id} align="right">-</TableCell>;
                }
                
                return (
                  <TableCell key={state.id} align="right" sx={{ fontSize: '0.875rem' }}>
                    {formatCurrency(result.edvdJumpCosts.totalCost)}
                  </TableCell>
                );
              })}
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Xanax Cost</TableCell>
              {comparisonStates.map((state) => {
                const result = results[state.id];
                if (!result || !result.xanaxCosts) {
                  return <TableCell key={state.id} align="right">-</TableCell>;
                }
                
                return (
                  <TableCell key={state.id} align="right" sx={{ fontSize: '0.875rem' }}>
                    {formatCurrency(result.xanaxCosts.totalCost)}
                  </TableCell>
                );
              })}
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Candy Cost</TableCell>
              {comparisonStates.map((state) => {
                const result = results[state.id];
                if (!result || !result.candyJumpCosts) {
                  return <TableCell key={state.id} align="right">-</TableCell>;
                }
                
                return (
                  <TableCell key={state.id} align="right" sx={{ fontSize: '0.875rem' }}>
                    {formatCurrency(result.candyJumpCosts.totalCost)}
                  </TableCell>
                );
              })}
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Energy Cost</TableCell>
              {comparisonStates.map((state) => {
                const result = results[state.id];
                if (!result || !result.energyJumpCosts) {
                  return <TableCell key={state.id} align="right">-</TableCell>;
                }
                
                return (
                  <TableCell key={state.id} align="right" sx={{ fontSize: '0.875rem' }}>
                    {formatCurrency(result.energyJumpCosts.totalCost)}
                  </TableCell>
                );
              })}
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', color: 'success.main' }}>Loss/Revive Income</TableCell>
              {comparisonStates.map((state) => {
                const result = results[state.id];
                if (!result || !result.lossReviveIncome) {
                  return <TableCell key={state.id} align="right">-</TableCell>;
                }
                
                return (
                  <TableCell key={state.id} align="right" sx={{ fontSize: '0.875rem', color: 'success.main' }}>
                    {formatCurrency(result.lossReviveIncome.totalIncome)}
                  </TableCell>
                );
              })}
            </TableRow>
            <TableRow sx={{ borderTop: 2, borderColor: 'divider' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Total Cost</TableCell>
              {comparisonStates.map((state) => {
                const result = results[state.id];
                if (!result) {
                  return <TableCell key={state.id} align="right">-</TableCell>;
                }
                
                const edvdCost = result.edvdJumpCosts?.totalCost || 0;
                const xanaxCost = result.xanaxCosts?.totalCost || 0;
                const candyCost = result.candyJumpCosts?.totalCost || 0;
                const energyCost = result.energyJumpCosts?.totalCost || 0;
                const lossReviveIncome = result.lossReviveIncome?.totalIncome || 0;
                const totalCost = edvdCost + xanaxCost + candyCost + energyCost - lossReviveIncome;
                
                return (
                  <TableCell key={state.id} align="right" sx={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
                    {formatCurrency(totalCost)}
                  </TableCell>
                );
              })}
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Cost per Day</TableCell>
              {comparisonStates.map((state) => {
                const result = results[state.id];
                if (!result) {
                  return <TableCell key={state.id} align="right">-</TableCell>;
                }
                
                const edvdCost = result.edvdJumpCosts?.totalCost || 0;
                const xanaxCost = result.xanaxCosts?.totalCost || 0;
                const candyCost = result.candyJumpCosts?.totalCost || 0;
                const energyCost = result.energyJumpCosts?.totalCost || 0;
                const lossReviveIncome = result.lossReviveIncome?.totalIncome || 0;
                const totalCost = edvdCost + xanaxCost + candyCost + energyCost - lossReviveIncome;
                
                // Calculate total days from months
                const totalDays = months * 30;
                const pricePerDay = totalDays > 0 ? totalCost / totalDays : 0;
                
                return (
                  <TableCell key={state.id} align="right" sx={{ fontSize: '0.875rem' }}>
                    {pricePerDay > 0 ? formatCurrency(pricePerDay) : '-'}
                  </TableCell>
                );
              })}
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Cost per Stat Gain</TableCell>
              {(() => {
                // Helper function to calculate total stat gain
                const calculateTotalGain = (result: SimulationResult) => {
                  return (result.finalStats.strength - initialStats.strength) + 
                         (result.finalStats.speed - initialStats.speed) + 
                         (result.finalStats.defense - initialStats.defense) + 
                         (result.finalStats.dexterity - initialStats.dexterity);
                };
                
                // Calculate max gain across all states once for baseline determination
                const maxGain = Math.max(...comparisonStates.map(s => {
                  const r = results[s.id];
                  return r ? calculateTotalGain(r) : 0;
                }));
                
                // Determine appropriate baseline (1k, 10k, or 100k)
                let baseline = 1000;
                let baselineLabel = '1k';
                if (maxGain >= 100000) {
                  baseline = 100000;
                  baselineLabel = '100k';
                } else if (maxGain >= 10000) {
                  baseline = 10000;
                  baselineLabel = '10k';
                }
                
                return comparisonStates.map((state) => {
                  const result = results[state.id];
                  if (!result) {
                    return <TableCell key={state.id} align="right">-</TableCell>;
                  }
                  
                  const edvdCost = result.edvdJumpCosts?.totalCost || 0;
                  const xanaxCost = result.xanaxCosts?.totalCost || 0;
                  const candyCost = result.candyJumpCosts?.totalCost || 0;
                  const energyCost = result.energyJumpCosts?.totalCost || 0;
                  const lossReviveIncome = result.lossReviveIncome?.totalIncome || 0;
                  const totalCost = edvdCost + xanaxCost + candyCost + energyCost - lossReviveIncome;
                  const totalGain = calculateTotalGain(result);
                  
                  if (totalGain === 0) {
                    return <TableCell key={state.id} align="right">-</TableCell>;
                  }
                  
                  const costPerBaseline = (totalCost / totalGain) * baseline;
                  
                  return (
                    <TableCell key={state.id} align="right" sx={{ fontSize: '0.875rem' }}>
                      {formatCurrency(costPerBaseline)}/{baselineLabel}
                    </TableCell>
                  );
                });
              })()}
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
