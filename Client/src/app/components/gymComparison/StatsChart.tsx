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
  const handleDotClick = (data: { day?: number }, series: ChartSeries) => {
    if (!onLineClick || !data || data.day === undefined) return;
    // Only allow clicks on 7-day intervals (excluding day 0)
    if (data.day === 0 || data.day % 7 !== 0) return;
    onLineClick(series.stateId, data.day);
  };

  // Create a color map based on state index
  const stateColorMap = new Map<string, string>();
  comparisonStates.forEach((state, index) => {
    stateColorMap.set(state.id, CHART_COLORS[index % CHART_COLORS.length]);
  });

  // Custom dot component for clickable points
  const CustomDot = (props: { cx?: number; cy?: number; payload?: { day?: number }; series?: ChartSeries }) => {
    const { cx, cy, series, payload } = props;
    if (!onLineClick || !cx || !cy || !series || !payload) return null;
    
    // Only show clickable dots on 7-day intervals (excluding day 0)
    const day = payload.day ?? 0;
    const isClickable = day > 0 && day % 7 === 0;
    
    if (!isClickable) return null;
    
    return (
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill={stateColorMap.get(series.stateId) || CHART_COLORS[0]}
        fillOpacity={0.3}
        stroke={stateColorMap.get(series.stateId) || CHART_COLORS[0]}
        strokeWidth={2}
        style={{ cursor: 'pointer' }}
        onClick={() => handleDotClick(payload, series)}
      />
    );
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>Total Battle Stats Over Time</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
        Click on any marked point (every 7 days) on a line to add a time segment starting from that day
      </Typography>
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
                dot={(dotProps: { cx?: number; cy?: number; payload?: { day?: number } }) => 
                  <CustomDot {...dotProps} series={series} />
                }
                activeDot={onLineClick ? { r: 6, style: { cursor: 'pointer' } } : undefined}
                connectNulls={false}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );
}
