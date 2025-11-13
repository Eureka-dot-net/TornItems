import { useState } from 'react';
import { Paper, Typography, Box, Checkbox, FormControlLabel, Grid, Button } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { SimulationResult } from '../../../lib/utils/gymProgressionCalculator';
import { exportIndividualComparisonData, type IndividualComparisonExportData } from '../../../lib/utils/exportHelpers';
import type { ItemPrices } from '../../../lib/hooks/useItemPrices';

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

interface IndividualStatsSectionProps {
  comparisonStates: ComparisonState[];
  results: Record<string, SimulationResult>;
  initialStats: Stats;
  months: number;
  showCosts: boolean;
  itemPricesData?: ItemPrices;
}

export default function IndividualStatsSection({
  comparisonStates,
  results,
  initialStats,
  months,
  showCosts,
  itemPricesData
}: IndividualStatsSectionProps) {
  // Track which states should show individual stats
  const [selectedStates, setSelectedStates] = useState<Set<string>>(new Set());

  const toggleStateSelection = (stateId: string) => {
    setSelectedStates((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(stateId)) {
        newSet.delete(stateId);
      } else {
        newSet.add(stateId);
      }
      return newSet;
    });
  };

  const handleDownload = (stateId: string) => {
    const state = comparisonStates.find(s => s.id === stateId);
    const result = results[stateId];
    
    if (!state || !result) return;
    
    const statGains = {
      strength: result.finalStats.strength - initialStats.strength,
      speed: result.finalStats.speed - initialStats.speed,
      defense: result.finalStats.defense - initialStats.defense,
      dexterity: result.finalStats.dexterity - initialStats.dexterity,
    };
    
    const costs = (showCosts && itemPricesData) ? {
      edvd: result.edvdJumpCosts?.totalCost || 0,
      xanax: result.xanaxCosts?.totalCost || 0,
      points: result.pointsRefillCosts?.totalCost || 0,
      candy: result.candyJumpCosts?.totalCost || 0,
      energy: result.energyJumpCosts?.totalCost || 0,
      lossReviveIncome: result.lossReviveIncome?.totalIncome || 0,
      total: (result.edvdJumpCosts?.totalCost || 0) + 
             (result.xanaxCosts?.totalCost || 0) + 
             (result.pointsRefillCosts?.totalCost || 0) + 
             (result.candyJumpCosts?.totalCost || 0) + 
             (result.energyJumpCosts?.totalCost || 0) - 
             (result.lossReviveIncome?.totalIncome || 0),
    } : undefined;
    
    const exportData: IndividualComparisonExportData = {
      name: state.name,
      finalStats: result.finalStats,
      statGains,
      initialStats,
      months,
      dailySnapshots: result.dailySnapshots,
      costs,
    };
    
    exportIndividualComparisonData(exportData);
  };

  // Prepare chart data for a specific state
  const prepareIndividualChartData = (stateId: string) => {
    const result = results[stateId];
    if (!result || !result.dailySnapshots) return [];

    // Add day 0 with initial stats
    const chartData = [
      {
        day: 0,
        strength: initialStats.strength,
        speed: initialStats.speed,
        defense: initialStats.defense,
        dexterity: initialStats.dexterity,
      },
      ...result.dailySnapshots.map((snapshot) => ({
        day: snapshot.day,
        strength: snapshot.strength,
        speed: snapshot.speed,
        defense: snapshot.defense,
        dexterity: snapshot.dexterity,
      })),
    ];

    return chartData;
  };

  // Get selected states that have results
  const statesToDisplay = Array.from(selectedStates)
    .filter((stateId) => results[stateId])
    .map((stateId) => ({
      id: stateId,
      state: comparisonStates.find((s) => s.id === stateId)!,
      data: prepareIndividualChartData(stateId),
    }));

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Individual Stats Over Time
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Select which comparison states to display individual stat breakdowns for:
      </Typography>

      {/* Checkboxes for selecting states */}
      <Box sx={{ mt: 2, mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {comparisonStates.map((state) => (
          <FormControlLabel
            key={state.id}
            control={
              <Checkbox
                checked={selectedStates.has(state.id)}
                onChange={() => toggleStateSelection(state.id)}
                disabled={!results[state.id]}
              />
            }
            label={state.name}
          />
        ))}
      </Box>

      {/* Display individual stat charts */}
      {statesToDisplay.length > 0 && (
        <Grid container spacing={2}>
          {statesToDisplay.map(({ id, state, data }) => (
            <Grid
              key={id}
              size={{ xs: 12, md: statesToDisplay.length === 1 ? 12 : 6 }}
            >
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1">
                    {state.name}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDownload(id)}
                  >
                    Download
                  </Button>
                </Box>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="day"
                      label={{ value: 'Days', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis label={{ value: 'Stat Value', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="strength"
                      stroke="#e74c3c"
                      strokeWidth={2}
                      dot={false}
                      name="Strength"
                    />
                    <Line
                      type="monotone"
                      dataKey="speed"
                      stroke="#3498db"
                      strokeWidth={2}
                      dot={false}
                      name="Speed"
                    />
                    <Line
                      type="monotone"
                      dataKey="defense"
                      stroke="#2ecc71"
                      strokeWidth={2}
                      dot={false}
                      name="Defense"
                    />
                    <Line
                      type="monotone"
                      dataKey="dexterity"
                      stroke="#f39c12"
                      strokeWidth={2}
                      dot={false}
                      name="Dexterity"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {statesToDisplay.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          Select one or more comparison states above to view individual stat progressions
        </Typography>
      )}
    </Paper>
  );
}
