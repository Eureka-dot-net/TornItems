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

interface StatsChartProps {
  chartData: Array<Record<string, number>>;
  comparisonStates: ComparisonState[];
  results: Record<string, SimulationResult>;
  showCosts: boolean;
  itemPricesData?: ItemPrices;
}

// Different line styles to alternate between sections
const LINE_STYLES = ['5 5', '10 5', '15 5', '5 10', '10 10'];

export default function StatsChart({
  chartData,
  comparisonStates,
  results,
  showCosts,
  itemPricesData
}: StatsChartProps) {
  // Helper function to create segment keys for each section
  const createSegmentedData = () => {
    if (chartData.length === 0) return { data: chartData, segments: [] };
    
    const segmentedData: Array<Record<string, number | null>> = chartData.map(d => ({ ...d }));
    const segments: Array<{ stateName: string; sectionIndex: number; startDay: number; endDay: number; strokeDasharray: string }> = [];
    
    // For each state, check if it has section boundaries
    comparisonStates.forEach((state) => {
      const result = results[state.id];
      if (!result || !result.sectionBoundaries || result.sectionBoundaries.length === 0) {
        // No sections, just render normally
        return;
      }
      
      const boundaries = [0, ...result.sectionBoundaries];
      
      // Create segment data for each section
      for (let sectionIndex = 0; sectionIndex < boundaries.length; sectionIndex++) {
        const startDay = sectionIndex === 0 ? 0 : boundaries[sectionIndex - 1];
        const endDay = boundaries[sectionIndex];
        const segmentKey = `${state.name}_section_${sectionIndex}`;
        const strokeDasharray = LINE_STYLES[sectionIndex % LINE_STYLES.length];
        
        segments.push({
          stateName: state.name,
          sectionIndex,
          startDay,
          endDay,
          strokeDasharray
        });
        
        // For each data point, add the segmented value
        segmentedData.forEach((dataPoint) => {
          const day = dataPoint.day as number;
          if (day >= startDay && day <= endDay) {
            dataPoint[segmentKey] = dataPoint[state.name] as number;
          } else {
            dataPoint[segmentKey] = null;
          }
        });
      }
      
      // Remove the original state key since we're replacing it with segments
      segmentedData.forEach(dataPoint => {
        delete dataPoint[state.name];
      });
    });
    
    return { data: segmentedData, segments };
  };
  
  const { data: processedData, segments } = createSegmentedData();
  
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>Total Battle Stats Over Time</Typography>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={processedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" label={{ value: 'Days', position: 'insideBottom', offset: -5 }} />
          <YAxis label={{ value: 'Total Stats', angle: -90, position: 'insideLeft' }} />
          <Tooltip content={<ChartTooltip comparisonStates={comparisonStates} results={results} showCosts={showCosts} itemPricesData={itemPricesData} />} />
          <Legend />
          {segments.length === 0 ? (
            // No sections, render normally
            comparisonStates.map((state, index) => (
              <Line 
                key={state.id} 
                type="monotone" 
                dataKey={state.name} 
                stroke={CHART_COLORS[index % CHART_COLORS.length]} 
                strokeWidth={2} 
                dot={false} 
              />
            ))
          ) : (
            // Render segments with different line styles
            segments.map((segment) => {
              const stateIndex = comparisonStates.findIndex(s => s.name === segment.stateName);
              const segmentKey = `${segment.stateName}_section_${segment.sectionIndex}`;
              return (
                <Line 
                  key={segmentKey}
                  type="monotone" 
                  dataKey={segmentKey} 
                  stroke={CHART_COLORS[stateIndex % CHART_COLORS.length]} 
                  strokeWidth={2} 
                  strokeDasharray={segment.strokeDasharray}
                  dot={false}
                  connectNulls={false}
                  name={segment.sectionIndex === 0 ? segment.stateName : undefined} // Only show legend for first segment
                  legendType={segment.sectionIndex === 0 ? 'line' : 'none'}
                />
              );
            })
          )}
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );
}
