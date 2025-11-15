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
    dataKey?: string;
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
          // entry.name might be "State 1" or undefined for sectioned lines
          // entry.dataKey might be "State 1_section0", "State 1_section1", etc.
          const dataKey = entry.dataKey || entry.name;
          
          // Extract base state name from dataKey (remove _sectionX suffix if present)
          const baseStateName = typeof dataKey === 'string' && dataKey.includes('_section') 
            ? dataKey.substring(0, dataKey.indexOf('_section'))
            : (entry.name || dataKey);
            
          const state = comparisonStates.find(s => s.name === baseStateName);
          const snapshot = state && results[state.id] ? 
            results[state.id].dailySnapshots.find(s => s.day === day) : null;
          
          return (
            <Box key={index} sx={{ mb: 1 }}>
              <Typography variant="body2" style={{ color: entry.color }}>
                {baseStateName}: {entry.value?.toLocaleString()}
              </Typography>
              {snapshot && (
                <>
                  <Typography variant="caption" sx={{ color: '#aaa', display: 'block', ml: 1 }}>
                    Gym: {snapshot.currentGym}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#aaa', display: 'block', ml: 1 }}>
                    Str: {snapshot.strength.toLocaleString()} | Spd: {snapshot.speed.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#aaa', display: 'block', ml: 1 }}>
                    Def: {snapshot.defense.toLocaleString()} | Dex: {snapshot.dexterity.toLocaleString()}
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
