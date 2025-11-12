import { Paper, Typography, Box } from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceDot,
} from 'recharts';
import { CHART_COLORS } from '../../../lib/constants/gymConstants';
import ChartTooltip from './ChartTooltip';
import type { SimulationResult } from '../../../lib/utils/gymProgressionCalculator';
import type { ItemPrices } from '../../../lib/hooks/useItemPrices';
import type { SegmentedSimulationConfig } from '../../../lib/types/gymComparison';

interface ComparisonState {
  id: string;
  name: string;
  segmentConfig?: SegmentedSimulationConfig;
  [key: string]: unknown;
}

interface StatsChartProps {
  chartData: Array<Record<string, number>>;
  comparisonStates: ComparisonState[];
  results: Record<string, SimulationResult>;
  showCosts: boolean;
  itemPricesData?: ItemPrices;
  activeStateId?: string;
  onSegmentCreate?: (stateId: string, day: number) => void;
}

export default function StatsChart({
  chartData,
  comparisonStates,
  results,
  showCosts,
  itemPricesData,
  activeStateId,
  onSegmentCreate,
}: StatsChartProps) {
  // Calculate clickable intervals based on total days
  const totalDays = chartData.length > 0 ? chartData[chartData.length - 1].day : 0;
  const clickableIntervals: number[] = [];
  
  if (totalDays > 0) {
    // Determine interval based on total days
    let interval = 7;
    if (totalDays > 365) {
      interval = 21; // For longer durations, use 21-day intervals
    } else if (totalDays > 180) {
      interval = 14; // For medium durations, use 14-day intervals
    }
    
    // Create intervals from day 7/14/21 onwards (not day 0)
    for (let day = interval; day < totalDays; day += interval) {
      clickableIntervals.push(day);
    }
  }
  
  // Find active state and its segments
  const activeState = activeStateId ? comparisonStates.find(s => s.id === activeStateId) : null;
  const segmentsEnabled = activeState?.segmentConfig?.enabled ?? false;
  const existingSegments = activeState?.segmentConfig?.segments ?? [];
  
  // Get data for the active state
  const activeStateName = activeState?.name;
  
  const handleDotClick = (day: number) => {
    if (onSegmentCreate && activeStateId && segmentsEnabled) {
      onSegmentCreate(activeStateId, day);
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>Total Battle Stats Over Time</Typography>
      {segmentsEnabled && activeStateName && (
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Click on the dots to create time segments for {activeStateName}
        </Typography>
      )}
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" label={{ value: 'Days', position: 'insideBottom', offset: -5 }} />
          <YAxis label={{ value: 'Total Stats', angle: -90, position: 'insideLeft' }} />
          <Tooltip content={<ChartTooltip comparisonStates={comparisonStates} results={results} showCosts={showCosts} itemPricesData={itemPricesData} />} />
          <Legend />
          {comparisonStates.map((state, index) => (
            <Line key={state.id} type="monotone" dataKey={state.name} stroke={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth={2} dot={false} />
          ))}
          
          {/* Render clickable dots for segment creation */}
          {segmentsEnabled && activeStateName && clickableIntervals.map((day) => {
            const dataPoint = chartData.find(d => d.day === day);
            if (!dataPoint || dataPoint[activeStateName] === undefined) return null;
            
            // Check if segment already exists at this day
            const hasSegment = existingSegments.some(seg => seg.startDay === day);
            
            return (
              <ReferenceDot
                key={`dot-${day}`}
                x={day}
                y={dataPoint[activeStateName]}
                r={hasSegment ? 8 : 6}
                fill={hasSegment ? '#ff9800' : '#2196f3'}
                stroke={hasSegment ? '#f57c00' : '#1976d2'}
                strokeWidth={2}
                style={{ cursor: 'pointer' }}
                onClick={() => handleDotClick(day)}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
      {segmentsEnabled && existingSegments.length > 0 && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            🔵 Available segment points • 🟠 Active segments
          </Typography>
        </Box>
      )}
    </Paper>
  );
}
