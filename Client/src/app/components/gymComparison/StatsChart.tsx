import { Paper, Typography } from '@mui/material';
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
import { CHART_COLORS } from '../../../lib/constants/gymConstants';
import ChartTooltip from './ChartTooltip';
import type { SimulationResult } from '../../../lib/utils/gymProgressionCalculator';
import type { ItemPrices } from '../../../lib/hooks/useItemPrices';

interface ComparisonState {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface ChartSeries {
  id: string;
  name: string;
  stateId: string;
  segmentId?: string;
  isSegment?: boolean;
}

interface StatsChartProps {
  chartData: Array<Record<string, number>>;
  chartSeries: ChartSeries[];
  comparisonStates: ComparisonState[];
  results: Record<string, SimulationResult>;
  showCosts: boolean;
  itemPricesData?: ItemPrices;
  onLineClick?: (stateId: string, day: number) => void;
}

export default function StatsChart({
  chartData,
  chartSeries,
  comparisonStates,
  results,
  showCosts,
  itemPricesData,
  onLineClick
}: StatsChartProps) {
  const handleLineClick = (data: any, series: ChartSeries) => {
    if (!onLineClick || !data || data.day === undefined) return;
    onLineClick(series.stateId, data.day);
  };

  // Create a color map based on state index
  const stateColorMap = new Map<string, string>();
  comparisonStates.forEach((state, index) => {
    stateColorMap.set(state.id, CHART_COLORS[index % CHART_COLORS.length]);
  });

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>Total Battle Stats Over Time</Typography>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" label={{ value: 'Days', position: 'insideBottom', offset: -5 }} />
          <YAxis label={{ value: 'Total Stats', angle: -90, position: 'insideLeft' }} />
          <Tooltip content={<ChartTooltip comparisonStates={comparisonStates} results={results} showCosts={showCosts} itemPricesData={itemPricesData} />} />
          <Legend />
          {chartSeries.map((series) => {
            const color = stateColorMap.get(series.stateId) || CHART_COLORS[0];
            return (
              <Line 
                key={series.id} 
                type="monotone" 
                dataKey={series.name} 
                stroke={color}
                strokeWidth={2} 
                strokeDasharray={series.isSegment ? "5 5" : undefined}
                dot={false}
                onClick={(data) => handleLineClick(data, series)}
                style={{ cursor: onLineClick ? 'pointer' : 'default' }}
                connectNulls={false}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );
}
