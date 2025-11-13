import { Paper, Typography } from '@mui/material';
import { formatDaysToHumanReadable } from '../../../lib/utils/gymHelpers';
import type { SimulationResult } from '../../../lib/utils/gymProgressionCalculator';

interface IndividualStatsTooltipProps {
  active?: boolean;
  payload?: Array<{ 
    payload: { day: number; strength: number; speed: number; defense: number; dexterity: number }; 
    name: string; 
    value: number; 
    color: string;
    dataKey: string;
  }>;
  result: SimulationResult;
}

export default function IndividualStatsTooltip({ 
  active, 
  payload,
  result
}: IndividualStatsTooltipProps) {
  if (active && payload && payload.length) {
    const day = payload[0].payload.day;
    const timeStr = formatDaysToHumanReadable(day);
    
    // Get snapshot for this day to find gym
    const snapshot = result.dailySnapshots.find(s => s.day === day);
    
    // Calculate total stats from payload
    const totalStats = payload[0].payload.strength + 
                      payload[0].payload.speed + 
                      payload[0].payload.defense + 
                      payload[0].payload.dexterity;
    
    return (
      <Paper sx={{ p: 2, backgroundColor: 'rgba(0, 0, 0, 0.9)', border: '1px solid #555' }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
          Time: {timeStr}
        </Typography>
        {payload.map((entry, index: number) => (
          <Typography key={index} variant="body2" style={{ color: entry.color }}>
            {entry.name}: {entry.value?.toLocaleString()}
          </Typography>
        ))}
        <Typography variant="body2" sx={{ fontWeight: 'bold', mt: 0.5 }}>
          Total: {totalStats.toLocaleString()}
        </Typography>
        {snapshot && (
          <Typography variant="caption" sx={{ color: '#aaa', display: 'block', mt: 0.5 }}>
            Gym: {snapshot.currentGym}
          </Typography>
        )}
      </Paper>
    );
  }
  return null;
}
