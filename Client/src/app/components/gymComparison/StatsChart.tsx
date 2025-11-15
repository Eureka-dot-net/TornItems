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
  ReferenceLine,
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

// Different line styles to alternate between sections - FIRST section is always solid
const LINE_STYLES = [undefined, '5 5', '10 5', '15 5', '5 10', '10 10'];

export default function StatsChart({
  chartData,
  comparisonStates,
  results,
  showCosts,
  itemPricesData
}: StatsChartProps) {
  // Prepare chart lines - create separate line for each section of each state
  const chartLines: Array<{
    dataKey: string;
    stroke: string;
    strokeDasharray?: string;
    name: string;
    stateIndex: number;
    sectionIndex: number;
  }> = [];

  // Collect section boundaries for reference lines
  const sectionBoundaries: Array<{ 
    day: number; 
    stateName: string;
    stateColor: string;
    snapshot: any;
    sectionNumber: number;
  }> = [];

  comparisonStates.forEach((state, stateIndex) => {
    const result = results[state.id];
    if (!result || !result.sectionBoundaries || result.sectionBoundaries.length === 0) {
      // No sections, render as single line
      chartLines.push({
        dataKey: state.name,
        stroke: CHART_COLORS[stateIndex % CHART_COLORS.length],
        name: state.name,
        stateIndex,
        sectionIndex: 0,
      });
    } else {
      // Multiple sections - create a separate line for each section
      // sectionBoundaries contains the END day of each section: [180, 360]
      // For 2 sections, we need 2 lines
      const numSections = result.sectionBoundaries.length;
      
      for (let sectionIdx = 0; sectionIdx < numSections; sectionIdx++) {
        const lineKey = `${state.name}_section${sectionIdx}`;
        // First section (index 0) is solid (undefined), rest have dash patterns
        const strokeDasharray = sectionIdx === 0 ? undefined : LINE_STYLES[(sectionIdx % (LINE_STYLES.length - 1)) + 1];
        
        chartLines.push({
          dataKey: lineKey,
          stroke: CHART_COLORS[stateIndex % CHART_COLORS.length],
          strokeDasharray,
          name: sectionIdx === 0 ? state.name : undefined as any, // Only show in legend once
          stateIndex,
          sectionIndex: sectionIdx,
        });
      }

      // Add section boundaries for reference lines
      // Reference lines should be placed where sections TRANSITION (between sections)
      // For 2 sections with boundaries [180, 360], we want a line at day 180 (between sections)
      for (let i = 0; i < result.sectionBoundaries.length - 1; i++) {
        const boundaryDay = result.sectionBoundaries[i]; // End of section i
        const snapshot = result.dailySnapshots.find(s => s.day === boundaryDay);
        sectionBoundaries.push({
          day: boundaryDay,
          stateName: state.name,
          stateColor: CHART_COLORS[stateIndex % CHART_COLORS.length],
          snapshot: snapshot,
          sectionNumber: i + 2, // Section number that STARTS after this boundary (section 2, 3, etc.)
        });
      }
    }
  });

  // Prepare chart data with separate data series for each section
  const processedChartData = chartData.map(dataPoint => {
    const newPoint: Record<string, number> = { day: dataPoint.day };
    
    comparisonStates.forEach((state) => {
      const result = results[state.id];
      const statValue = dataPoint[state.name];
      
      if (!result || !result.sectionBoundaries || result.sectionBoundaries.length === 0) {
        // No sections, copy value as-is
        newPoint[state.name] = statValue;
      } else {
        // Multiple sections - assign value to appropriate section's data key
        // sectionBoundaries = [180, 360] means:
        //   Section 0: days 1-180
        //   Section 1: days 181-360
        const day = dataPoint.day;
        
        for (let sectionIdx = 0; sectionIdx < result.sectionBoundaries.length; sectionIdx++) {
          const startDay = sectionIdx === 0 ? 1 : result.sectionBoundaries[sectionIdx - 1] + 1;
          const endDay = result.sectionBoundaries[sectionIdx];
          const lineKey = `${state.name}_section${sectionIdx}`;
          
          if (day >= startDay && day <= endDay) {
            newPoint[lineKey] = statValue;
          }
        }
      }
    });
    
    return newPoint;
  });
  
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>Total Battle Stats Over Time</Typography>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={processedChartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" label={{ value: 'Days', position: 'insideBottom', offset: -5 }} />
          <YAxis label={{ value: 'Total Stats', angle: -90, position: 'insideLeft' }} />
          <Tooltip content={<ChartTooltip comparisonStates={comparisonStates} results={results} showCosts={showCosts} itemPricesData={itemPricesData} />} />
          <Legend />
          {/* Section boundary reference lines */}
          {sectionBoundaries.map((boundary, idx) => {
            // Build label with stats information
            let label = `${boundary.stateName} Section ${boundary.sectionNumber}`;
            if (boundary.snapshot) {
              label += ` | Gym: ${boundary.snapshot.currentGym}`;
              label += `\nStr: ${boundary.snapshot.strength.toLocaleString()} | Spd: ${boundary.snapshot.speed.toLocaleString()}`;
              label += `\nDef: ${boundary.snapshot.defense.toLocaleString()} | Dex: ${boundary.snapshot.dexterity.toLocaleString()}`;
            }
            
            return (
              <ReferenceLine
                key={`boundary-${idx}`}
                x={boundary.day}
                stroke={boundary.stateColor}
                strokeWidth={2}
                strokeDasharray="3 3"
                label={{
                  value: label,
                  position: 'top',
                  fill: boundary.stateColor,
                  fontSize: 10,
                }}
              />
            );
          })}
          {chartLines.map((line, idx) => (
            <Line 
              key={`${line.dataKey}-${idx}`}
              type="monotone" 
              dataKey={line.dataKey} 
              stroke={line.stroke} 
              strokeWidth={2} 
              strokeDasharray={line.strokeDasharray}
              dot={false}
              connectNulls={false}
              name={line.name}
              legendType={line.name ? 'line' : 'none'}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );
}
