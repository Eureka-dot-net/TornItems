import { Grid } from '@mui/material';
import StatsChart from './StatsChart';
import FinalStatsTable from './FinalStatsTable';
import CostEstimateCard from './CostEstimateCard';
import DiabetesDayEstimateCard from './DiabetesDayEstimateCard';
import EdvdJumpGainsTable from './EdvdJumpGainsTable';
import type { SimulationResult } from '../../../lib/utils/gymProgressionCalculator';
import type { ItemPrices } from '../../../lib/hooks/useItemPrices';

interface ComparisonState {
  id: string;
  name: string;
  diabetesDayEnabled: boolean;
  edvdJumpEnabled: boolean;
  [key: string]: unknown;
}

interface ChartSeries {
  id: string;
  name: string;
  stateId: string;
  segmentId?: string;
  isSegment?: boolean;
}

interface Stats {
  strength: number;
  speed: number;
  defense: number;
  dexterity: number;
}

interface ResultsSectionProps {
  chartData: Array<Record<string, number>>;
  chartSeries: ChartSeries[];
  comparisonStates: ComparisonState[];
  results: Record<string, SimulationResult>;
  initialStats: Stats;
  months: number;
  showCosts: boolean;
  itemPricesData?: ItemPrices;
  onLineClick?: (stateId: string, day: number) => void;
}

export default function ResultsSection({
  chartData,
  chartSeries,
  comparisonStates,
  results,
  initialStats,
  months,
  showCosts,
  itemPricesData,
  onLineClick
}: ResultsSectionProps) {
  const hasCostEstimate = showCosts && itemPricesData;
  const hasDDEstimate = comparisonStates.some(state => state.diabetesDayEnabled);
  const hasExtraCards = hasCostEstimate || hasDDEstimate;

  if (hasExtraCards) {
    // Layout: Graph full width, then cards below in a row
    return (
      <>
        <StatsChart
          chartData={chartData}
          chartSeries={chartSeries}
          comparisonStates={comparisonStates}
          results={results}
          showCosts={showCosts}
          itemPricesData={itemPricesData}
          onLineClick={onLineClick}
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
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <StatsChart
              chartData={chartData}
              chartSeries={chartSeries}
              comparisonStates={comparisonStates}
              results={results}
              showCosts={showCosts}
              itemPricesData={itemPricesData}
              onLineClick={onLineClick}
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
        
        <EdvdJumpGainsTable
          comparisonStates={comparisonStates}
          results={results}
        />
      </>
    );
  }
}
