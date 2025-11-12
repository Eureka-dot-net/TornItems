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
  // Create a color map based on state index
  const stateColorMap = new Map<string, string>();
  comparisonStates.forEach((state, index) => {
    stateColorMap.set(state.id, CHART_COLORS[index % CHART_COLORS.length]);
  });

  // Log onLineClick prop at render time
  console.log('[StatsChart] Rendering with onLineClick:', onLineClick ? 'PRESENT' : 'MISSING');

  // Calculate total days from chart data
  const totalDays = chartData.length > 0 ? Math.max(...chartData.map(d => d.day || 0)) : 360;
  
  // Determine dot interval based on duration
  // <= 12 months (360 days): every 7 days
  // > 12 months and <= 24 months (720 days): every 14 days
  // > 24 months: every 21 days
  const getDotInterval = () => {
    if (totalDays <= 360) return 7;
    if (totalDays <= 720) return 14;
    return 21;
  };
  
  const dotInterval = getDotInterval();
  console.log('[StatsChart] Total days:', totalDays, '| Dot interval:', dotInterval);

  // Factory function to create a custom dot component for a specific series
  // This is necessary because Recharts doesn't pass custom props to the dot component
  const createCustomDot = (series: ChartSeries) => {
    return (props: { cx?: number; cy?: number; payload?: { day?: number } }) => {
      const { cx, cy, payload } = props;
      
      // Only show clickable dots at calculated intervals (excluding day 0)
      const day = payload?.day ?? 0;
      const isClickable = day > 0 && day % dotInterval === 0;
      
      if (!onLineClick || !cx || !cy || !payload || !isClickable) {
        return <></>;
      }
      
      const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        console.log('[StatsChart] ✅ DOT CLICKED! Day:', day, 'State:', series.stateId, 'Interval:', dotInterval);
        onLineClick(series.stateId, day);
      };
      
      return (
        <circle
          cx={cx}
          cy={cy}
          r={10}
          fill={stateColorMap.get(series.stateId) || CHART_COLORS[0]}
          fillOpacity={0.6}
          stroke={stateColorMap.get(series.stateId) || CHART_COLORS[0]}
          strokeWidth={3}
          style={{ 
            cursor: 'pointer', 
            pointerEvents: 'all',
            zIndex: 1000
          }}
          onClick={handleClick}
          onMouseDown={handleClick}
          onPointerDown={handleClick}
          onTouchStart={handleClick as unknown as React.TouchEventHandler}
        />
      );
    };
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>Total Battle Stats Over Time</Typography>
      {onLineClick && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Click on any marked point (every {dotInterval} days) on a line to add a time segment starting from that day
        </Typography>
      )}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" label={{ value: 'Days', position: 'insideBottom', offset: -5 }} />
          <YAxis label={{ value: 'Total Stats', angle: -90, position: 'insideLeft' }} />
          <Tooltip content={<ChartTooltip comparisonStates={comparisonStates} results={results} showCosts={showCosts} itemPricesData={itemPricesData} />} />
          <Legend />
          {chartSeries.map((series) => {
            const color = stateColorMap.get(series.stateId) || CHART_COLORS[0];
            const CustomDot = createCustomDot(series);
            return (
              <Line 
                key={series.id} 
                type="monotone" 
                dataKey={series.name} 
                stroke={color}
                strokeWidth={2} 
                strokeDasharray={series.isSegment ? "5 5" : undefined}
                dot={CustomDot}
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
