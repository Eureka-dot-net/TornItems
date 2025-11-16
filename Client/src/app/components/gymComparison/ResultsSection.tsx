import { Grid, Alert, Box, IconButton, Collapse } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useState } from 'react';
import StatsChart from './StatsChart';
import FinalStatsTable from './FinalStatsTable';
import CostEstimateCard from './CostEstimateCard';
import DiabetesDayEstimateCard from './DiabetesDayEstimateCard';
import EdvdJumpGainsTable from './EdvdJumpGainsTable';
import IndividualStatsSection from './IndividualStatsSection';
import type { SimulationResult } from '../../../lib/utils/gymProgressionCalculator';
import type { ItemPrices } from '../../../lib/hooks/useItemPrices';
import type { HistoricalStat } from '../../../lib/hooks/useHistoricalStats';

interface ComparisonState {
  id: string;
  name: string;
  diabetesDayEnabled: boolean;
  edvdJumpEnabled: boolean;
  statDriftPercent?: number;
  balanceAfterGymIndex?: number;
  [key: string]: unknown;
}

interface Stats {
  strength: number;
  speed: number;
  defense: number;
  dexterity: number;
}

interface ResultsSectionProps {
  chartData: Array<Record<string, number>>;
  comparisonStates: ComparisonState[];
  results: Record<string, SimulationResult>;
  initialStats: Stats;
  months: number;
  showCosts: boolean;
  itemPricesData?: ItemPrices;
  historicalData?: HistoricalStat[];
  simulatedDate?: Date | null;
}

export default function ResultsSection({
  chartData,
  comparisonStates,
  results,
  initialStats,
  months,
  showCosts,
  itemPricesData,
  historicalData = [],
  simulatedDate = null,
}: ResultsSectionProps) {
  const [showWarning, setShowWarning] = useState(true);
  
  const hasCostEstimate = showCosts && itemPricesData;
  const hasDDEstimate = comparisonStates.some(state => state.diabetesDayEnabled);
  const hasExtraCards = hasCostEstimate || hasDDEstimate;
  
  // Check if any state has drift > 0 and if George's gym is not unlocked by end of simulation
  const shouldShowDriftWarning = comparisonStates.some(state => {
    const drift = state.statDriftPercent ?? 0;
    if (drift === 0) return false;
    
    // Check if George's gym (index 23) is unlocked by the end
    // George's gym energyToUnlock is 551255
    const result = results[state.id];
    if (!result || !result.dailySnapshots || result.dailySnapshots.length === 0) return false;
    
    // Check final snapshot's current gym
    const finalSnapshot = result.dailySnapshots[result.dailySnapshots.length - 1];
    // If final gym is not George's or later, show warning
    return finalSnapshot.currentGym !== "George's" && 
           !finalSnapshot.currentGym.includes("Gym 3000") &&
           !finalSnapshot.currentGym.includes("Mr. Isoyama's") &&
           !finalSnapshot.currentGym.includes("Total Rebound") &&
           !finalSnapshot.currentGym.includes("Elites");
  });

  if (hasExtraCards) {
    // Layout: Graph full width, then cards below in a row
    return (
      <>
        {/* Drift Warning */}
        {shouldShowDriftWarning && showWarning && (
          <Collapse in={showWarning}>
            <Alert 
              severity="warning" 
              sx={{ mb: 2 }}
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => setShowWarning(false)}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
            >
              <Box>
                <strong>Note:</strong> Training with stat drift can cause short-term stat imbalance.
                This makes early-game curves look much stronger than they really are — try viewing the 24-month comparison for a realistic picture.
              </Box>
            </Alert>
          </Collapse>
        )}
        
        <StatsChart
          chartData={chartData}
          comparisonStates={comparisonStates}
          results={results}
          showCosts={showCosts}
          itemPricesData={itemPricesData}
          historicalData={historicalData}
          simulatedDate={simulatedDate}
        />

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, lg: hasCostEstimate && hasDDEstimate ? 4 : hasCostEstimate || hasDDEstimate ? 6 : 12 }}>
            <FinalStatsTable
              comparisonStates={comparisonStates}
              results={results}
              initialStats={initialStats}
            />
          </Grid>

          {hasCostEstimate && (
            <Grid size={{ xs: 12, lg: hasDDEstimate ? 4 : 6 }}>
              <CostEstimateCard
                comparisonStates={comparisonStates}
                results={results}
                initialStats={initialStats}
                months={months}
              />
            </Grid>
          )}

          {hasDDEstimate && (
            <Grid size={{ xs: 12, lg: hasCostEstimate ? 4 : 6 }}>
              <DiabetesDayEstimateCard
                comparisonStates={comparisonStates}
                results={results}
              />
            </Grid>
          )}
        </Grid>
        
        <IndividualStatsSection
          comparisonStates={comparisonStates}
          results={results}
          initialStats={initialStats}
          months={months}
          showCosts={showCosts}
          itemPricesData={itemPricesData}
        />
        
        <EdvdJumpGainsTable
          comparisonStates={comparisonStates}
          results={results}
        />
      </>
    );
  } else {
    // Original layout: Graph and Final Stats side by side
    return (
      <>
        {/* Drift Warning */}
        {shouldShowDriftWarning && showWarning && (
          <Collapse in={showWarning}>
            <Alert 
              severity="warning" 
              sx={{ mb: 2 }}
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => setShowWarning(false)}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
            >
              <Box>
                <strong>Note:</strong> Training with stat drift can cause short-term stat imbalance.
                This makes early-game curves look much stronger than they really are — try viewing the 24-month comparison for a realistic picture.
              </Box>
            </Alert>
          </Collapse>
        )}
        
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <StatsChart
              chartData={chartData}
              comparisonStates={comparisonStates}
              results={results}
              showCosts={showCosts}
              itemPricesData={itemPricesData}
              historicalData={historicalData}
              simulatedDate={simulatedDate}
            />
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <FinalStatsTable
              comparisonStates={comparisonStates}
              results={results}
              initialStats={initialStats}
            />
          </Grid>
        </Grid>
        
        <IndividualStatsSection
          comparisonStates={comparisonStates}
          results={results}
          initialStats={initialStats}
          months={months}
          showCosts={showCosts}
          itemPricesData={itemPricesData}
        />
        
        <EdvdJumpGainsTable
          comparisonStates={comparisonStates}
          results={results}
        />
      </>
    );
  }
}
