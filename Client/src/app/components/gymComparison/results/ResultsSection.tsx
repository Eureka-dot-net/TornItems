import { Grid } from '@mui/material';
import ChartSection from '../charts/ChartSection';
import FinalStatsComparison from './FinalStatsComparison';
import CostEstimateCard from './CostEstimateCard';
import DiabetesDayGainsCard from './DiabetesDayGainsCard';
import EdvdJumpGainsTable from './EdvdJumpGainsTable';
import type { SimulationResult } from '../../../../lib/utils/gymProgressionCalculator';

interface ResultsSectionProps {
  chartData: Array<Record<string, number>>;
  comparisonStates: Array<{
    id: string;
    name: string;
    diabetesDayEnabled: boolean;
    edvdJumpEnabled: boolean;
  }>;
  results: Record<string, SimulationResult>;
  initialStats: { strength: number; speed: number; defense: number; dexterity: number };
  months: number;
  showCosts: boolean;
  itemPricesData: { prices: Record<number, number | null> } | undefined;
  chartColors: string[];
}

export default function ResultsSection({
  chartData,
  comparisonStates,
  results,
  initialStats,
  months,
  showCosts,
  itemPricesData,
  chartColors,
}: ResultsSectionProps) {
  const hasCostEstimate = showCosts && itemPricesData;
  const hasDDEstimate = comparisonStates.some(state => state.diabetesDayEnabled);
  const hasExtraCards = hasCostEstimate || hasDDEstimate;

  if (hasExtraCards) {
    // Layout: Graph full width, then cards below in a row
    return (
      <>
        {/* Graph - Full Width */}
        <ChartSection
          chartData={chartData}
          comparisonStates={comparisonStates}
          results={results}
          chartColors={chartColors}
          showCosts={showCosts}
          itemPricesData={itemPricesData}
        />

        {/* Cards Row: Final Stats | Cost Estimate | DD Estimate */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Final Stats Comparison */}
          <Grid size={{ xs: 12, lg: hasCostEstimate && hasDDEstimate ? 4 : hasCostEstimate || hasDDEstimate ? 6 : 12 }}>
            <FinalStatsComparison
              comparisonStates={comparisonStates}
              results={results}
              initialStats={initialStats}
              chartColors={chartColors}
            />
          </Grid>

          {/* Cost Estimate Card */}
          {hasCostEstimate && (
            <Grid size={{ xs: 12, lg: hasDDEstimate ? 4 : 6 }}>
              <CostEstimateCard
                comparisonStates={comparisonStates}
                results={results}
                initialStats={initialStats}
                months={months}
                chartColors={chartColors}
              />
            </Grid>
          )}

          {/* DD Estimate Card */}
          {hasDDEstimate && (
            <Grid size={{ xs: 12, lg: hasCostEstimate ? 4 : 6 }}>
              <DiabetesDayGainsCard
                comparisonStates={comparisonStates}
                results={results}
                chartColors={chartColors}
              />
            </Grid>
          )}
        </Grid>
        
        {/* eDVD Jump Gains Table - Full Width Row Below */}
        <EdvdJumpGainsTable
          comparisonStates={comparisonStates}
          results={results}
          chartColors={chartColors}
        />
      </>
    );
  } else {
    // Original layout: Graph and Final Stats side by side
    return (
      <>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <ChartSection
              chartData={chartData}
              comparisonStates={comparisonStates}
              results={results}
              chartColors={chartColors}
              showCosts={showCosts}
              itemPricesData={itemPricesData}
            />
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <FinalStatsComparison
              comparisonStates={comparisonStates}
              results={results}
              initialStats={initialStats}
              chartColors={chartColors}
            />
          </Grid>
        </Grid>
        
        {/* eDVD Jump Gains Table - Full Width Below */}
        <EdvdJumpGainsTable
          comparisonStates={comparisonStates}
          results={results}
          chartColors={chartColors}
        />
      </>
    );
  }
}
