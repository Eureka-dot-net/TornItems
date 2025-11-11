import { Box, Paper, Typography } from '@mui/material';
import { formatCurrency, formatDaysToHumanReadable } from '../../../lib/utils/gymHelpers';
import type { SimulationResult } from '../../../lib/utils/gymProgressionCalculator';
import type { ItemPrices } from '../../../lib/hooks/useItemPrices';

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ 
    payload: { day: number }; 
    name: string; 
    value: number; 
    color: string;
  }>;
  comparisonStates: Array<{ id: string; name: string; [key: string]: unknown }>;
  results: Record<string, SimulationResult>;
  showCosts: boolean;
  itemPricesData?: ItemPrices;
}

export default function ChartTooltip({ 
  active, 
  payload, 
  comparisonStates, 
  results, 
  showCosts, 
  itemPricesData 
}: ChartTooltipProps) {
  if (active && payload && payload.length) {
    const day = payload[0].payload.day;
    const timeStr = formatDaysToHumanReadable(day);
    
    return (
      <Paper sx={{ p: 2, backgroundColor: 'rgba(0, 0, 0, 0.9)', border: '1px solid #555' }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
          Time: {timeStr}
        </Typography>
        {payload.map((entry, index: number) => {
          const state = comparisonStates.find(s => s.name === entry.name);
          const snapshot = state && results[state.id] ? 
            results[state.id].dailySnapshots.find(s => s.day === day) : null;
          
          return (
            <Box key={index} sx={{ mb: 1 }}>
              <Typography variant="body2" style={{ color: entry.color }}>
                {entry.name}: {entry.value?.toLocaleString()}
              </Typography>
              {snapshot && (
                <>
                  <Typography variant="caption" sx={{ color: '#aaa', display: 'block', ml: 1 }}>
                    Gym: {snapshot.currentGym}
                  </Typography>
                  {showCosts && state && results[state.id] && itemPricesData && (
                    <>
                      {(() => {
                        const edvdCosts = results[state.id].edvdJumpCosts;
                        const xanaxCosts = results[state.id].xanaxCosts;
                        return (
                          <>
                            {edvdCosts && (
                              <Typography variant="caption" sx={{ color: '#ffa726', display: 'block', ml: 1 }}>
                                EDVD: {formatCurrency(edvdCosts.totalCost)} ({edvdCosts.totalJumps} jumps)
                              </Typography>
                            )}
                            {xanaxCosts && (
                              <Typography variant="caption" sx={{ color: '#ffa726', display: 'block', ml: 1 }}>
                                Xanax: {formatCurrency(xanaxCosts.totalCost)}
                              </Typography>
                            )}
                          </>
                        );
                      })()}
                    </>
                  )}
                </>
              )}
            </Box>
          );
        })}
      </Paper>
    );
  }
  return null;
}
