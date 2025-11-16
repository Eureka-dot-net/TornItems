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
import type { HistoricalStat } from '../../../lib/hooks/useHistoricalStats';

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
  historicalData?: HistoricalStat[];
  simulatedDate?: Date | null;
}

// Different line styles to alternate between sections - FIRST section is always solid
const LINE_STYLES = [undefined, '5 5', '10 5', '15 5', '5 10', '10 10'];

// Types for section boundary label props
interface SectionBoundaryLabelProps {
  viewBox?: {
    x?: number;
    y?: number;
    height?: number;
    width?: number;
  };
  boundary: {
    day: number;
    stateName: string;
    stateColor: string;
    snapshot?: {
      day: number;
      currentGym: string;
      strength: number;
      speed: number;
      defense: number;
      dexterity: number;
    };
    sectionNumber: number;
  };
}

// Custom label component for section boundaries with icon and tooltip
const SectionBoundaryLabel = (props: SectionBoundaryLabelProps) => {
  const { viewBox, boundary } = props;
  
  if (!viewBox || viewBox.x === undefined || viewBox.y === undefined || viewBox.height === undefined) {
    return null;
  }
  
  const { x, y, height } = viewBox;
  
  // Position icon at the bottom of the chart (near the x-axis)
  const iconX = x - 8; // Center the icon (16px width / 2)
  const iconY = y + height - 25; // Position near bottom
  
  // Build tooltip content with individual stats
  let tooltipContent = `Section ${boundary.sectionNumber} starts`;
  if (boundary.snapshot) {
    tooltipContent += `\nGym: ${boundary.snapshot.currentGym}`;
    tooltipContent += `\nStrength: ${boundary.snapshot.strength.toLocaleString()}`;
    tooltipContent += `\nSpeed: ${boundary.snapshot.speed.toLocaleString()}`;
    tooltipContent += `\nDefense: ${boundary.snapshot.defense.toLocaleString()}`;
    tooltipContent += `\nDexterity: ${boundary.snapshot.dexterity.toLocaleString()}`;
    const total = boundary.snapshot.strength + boundary.snapshot.speed + 
                  boundary.snapshot.defense + boundary.snapshot.dexterity;
    tooltipContent += `\nTotal: ${total.toLocaleString()}`;
  }
  
  return (
    <g>
      {/* Invisible wider hitbox for easier hovering */}
      <rect
        x={x - 15}
        y={y}
        width={30}
        height={height}
        fill="transparent"
        style={{ cursor: 'pointer' }}
      >
        <title>{tooltipContent}</title>
      </rect>
      {/* Icon marker at bottom */}
      <g transform={`translate(${iconX}, ${iconY})`}>
        <circle
          cx={8}
          cy={8}
          r={10}
          fill={boundary.stateColor}
          opacity={0.9}
          style={{ cursor: 'pointer' }}
        >
          <title>{tooltipContent}</title>
        </circle>
        {/* Flag icon */}
        <path
          d="M8 4 L8 12 M8 4 L14 6 L8 8"
          stroke="white"
          strokeWidth={1.5}
          fill="white"
          style={{ cursor: 'pointer', pointerEvents: 'none' }}
        />
      </g>
    </g>
  );
};

export default function StatsChart({
  chartData,
  comparisonStates,
  results,
  showCosts,
  itemPricesData,
  historicalData = [],
  simulatedDate = null,
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
    snapshot?: {
      day: number;
      currentGym: string;
      strength: number;
      speed: number;
      defense: number;
      dexterity: number;
    };
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
          name: sectionIdx === 0 ? state.name : '', // Only show in legend once
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
  
  // Process historical data and merge with chart data
  // Convert historical data timestamps to day numbers based on simulatedDate
  let mergedChartData = processedChartData;
  if (historicalData && historicalData.length > 0 && simulatedDate) {
    // Calculate the reference timestamp (start of the day for simulatedDate)
    const simulatedDateStart = new Date(simulatedDate);
    simulatedDateStart.setHours(0, 0, 0, 0);
    const referenceTimestamp = Math.floor(simulatedDateStart.getTime() / 1000);
    
    const historicalPoints = historicalData.map(stat => {
      // Calculate days from the simulatedDate (which is day 1 in the simulation)
      const daysSinceReference = Math.round((stat.timestamp - referenceTimestamp) / (24 * 60 * 60));
      // Add 1 because simulation starts at day 1, not day 0
      const day = daysSinceReference + 1;
      return {
        day,
        'Historical Data': stat.totalstats,
      };
    });
    
    // Merge historical data with existing chart data
    mergedChartData = processedChartData.map(point => {
      const historicalPoint = historicalPoints.find(hp => hp.day === point.day);
      if (historicalPoint) {
        return { ...point, 'Historical Data': historicalPoint['Historical Data'] };
      }
      return point;
    });
    
    // Add historical points that don't exist in chart data
    historicalPoints.forEach(hp => {
      if (!processedChartData.some(p => p.day === hp.day)) {
        mergedChartData.push({ ...hp });
      }
    });
    
    // Sort by day
    mergedChartData.sort((a, b) => a.day - b.day);
  }
  
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>Total Battle Stats Over Time</Typography>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={mergedChartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" label={{ value: 'Days', position: 'insideBottom', offset: -5 }} />
          <YAxis label={{ value: 'Total Stats', angle: -90, position: 'insideLeft' }} />
          <Tooltip content={<ChartTooltip comparisonStates={comparisonStates} results={results} showCosts={showCosts} itemPricesData={itemPricesData} />} />
          <Legend />
          {/* Section boundary reference lines */}
          {sectionBoundaries.map((boundary, idx) => {
            return (
              <ReferenceLine
                key={`boundary-${idx}`}
                x={boundary.day}
                stroke={boundary.stateColor}
                strokeWidth={2}
                strokeDasharray="3 3"
                label={<SectionBoundaryLabel boundary={boundary} />}
              />
            );
          })}
          {/* Historical data line (if present) */}
          {historicalData && historicalData.length > 0 && (
            <Line 
              type="monotone" 
              dataKey="Historical Data" 
              stroke="#FFFFFF"
              strokeWidth={3} 
              strokeDasharray="5 5"
              dot={false}
              connectNulls={false}
              name="Historical Data (Actual)"
              legendType="line"
            />
          )}
          {/* Simulated data lines */}
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
