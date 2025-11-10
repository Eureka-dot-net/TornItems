/**
 * Export helpers for gym comparison data
 */

export interface DailySnapshot {
  day: number;
  strength: number;
  speed: number;
  defense: number;
  dexterity: number;
  currentGym: string;
  energySpentOnGymUnlock: number;
}

export interface ExportData {
  comparisonStates: Array<{
    name: string;
    finalStats: {
      strength: number;
      speed: number;
      defense: number;
      dexterity: number;
    };
    statGains: {
      strength: number;
      speed: number;
      defense: number;
      dexterity: number;
    };
    dailySnapshots?: DailySnapshot[];
    costs?: {
      edvd: number;
      xanax: number;
      candy: number;
      energy: number;
      lossReviveIncome: number;
      total: number;
    };
  }>;
  initialStats: {
    strength: number;
    speed: number;
    defense: number;
    dexterity: number;
  };
  months: number;
}

/**
 * Convert gym comparison data to CSV format
 */
export function exportToCSV(data: ExportData): string {
  const lines: string[] = [];
  
  // Header with initial stats
  lines.push(`Gym Comparison Data - ${data.months} months simulation`);
  lines.push('');
  lines.push('Initial Stats');
  lines.push(`Strength,Speed,Defense,Dexterity`);
  lines.push(`${data.initialStats.strength},${data.initialStats.speed},${data.initialStats.defense},${data.initialStats.dexterity}`);
  lines.push('');
  
  // Final Stats Comparison
  lines.push('Final Stats Comparison');
  const finalStatsHeader = ['Stat', ...data.comparisonStates.map(s => s.name)].join(',');
  lines.push(finalStatsHeader);
  
  ['strength', 'speed', 'defense', 'dexterity'].forEach(stat => {
    const statName = stat.charAt(0).toUpperCase() + stat.slice(1);
    const values = data.comparisonStates.map(s => s.finalStats[stat as keyof typeof s.finalStats]);
    lines.push([statName, ...values].join(','));
  });
  
  // Total stats
  const totals = data.comparisonStates.map(s => 
    s.finalStats.strength + s.finalStats.speed + s.finalStats.defense + s.finalStats.dexterity
  );
  lines.push(['Total', ...totals].join(','));
  lines.push('');
  
  // Stat Gains
  lines.push('Stat Gains');
  lines.push(finalStatsHeader);
  
  ['strength', 'speed', 'defense', 'dexterity'].forEach(stat => {
    const statName = stat.charAt(0).toUpperCase() + stat.slice(1);
    const values = data.comparisonStates.map(s => s.statGains[stat as keyof typeof s.statGains]);
    lines.push([statName, ...values.map(v => `+${v}`)].join(','));
  });
  
  // Total gains
  const totalGains = data.comparisonStates.map(s => 
    s.statGains.strength + s.statGains.speed + s.statGains.defense + s.statGains.dexterity
  );
  lines.push(['Total Gains', ...totalGains.map(v => `+${v}`)].join(','));
  lines.push('');
  
  // Cost Estimates (if available)
  if (data.comparisonStates.some(s => s.costs)) {
    lines.push('Cost Estimates');
    lines.push(['Cost Type', ...data.comparisonStates.map(s => s.name)].join(','));
    lines.push(['EDVD Cost', ...data.comparisonStates.map(s => s.costs?.edvd ?? 0)].join(','));
    lines.push(['Xanax Cost', ...data.comparisonStates.map(s => s.costs?.xanax ?? 0)].join(','));
    lines.push(['Candy Cost', ...data.comparisonStates.map(s => s.costs?.candy ?? 0)].join(','));
    lines.push(['Energy Cost', ...data.comparisonStates.map(s => s.costs?.energy ?? 0)].join(','));
    lines.push(['Loss/Revive Income', ...data.comparisonStates.map(s => s.costs?.lossReviveIncome ?? 0)].join(','));
    lines.push(['Total Cost', ...data.comparisonStates.map(s => s.costs?.total ?? 0)].join(','));
  }
  
  return lines.join('\n');
}

/**
 * Convert gym comparison data to CSV format with incremental daily values
 */
export function exportToIncrementalCSV(data: ExportData): string {
  const lines: string[] = [];
  
  // Determine sampling interval based on months
  // 1) Every day for less than 12 months
  // 2) Every two days for less than 24 months
  // 3) Every three days otherwise
  let interval = 1;
  if (data.months >= 24) {
    interval = 3;
  } else if (data.months >= 12) {
    interval = 2;
  }
  
  // Check if we have daily snapshots data
  const hasIncrementalData = data.comparisonStates.some(s => s.dailySnapshots && s.dailySnapshots.length > 0);
  
  if (!hasIncrementalData) {
    // Fallback to regular export if no incremental data
    return exportToCSV(data);
  }
  
  // Header
  lines.push(`Gym Comparison Data - ${data.months} months simulation (sampled every ${interval} day${interval > 1 ? 's' : ''})`);
  lines.push('');
  
  // Build header row for incremental data
  // Format: Day | Comparison 1 - Strength | Speed | Defense | Dexterity | Comparison 2 - Strength | ...
  const headerParts = ['Day'];
  data.comparisonStates.forEach(state => {
    headerParts.push(`${state.name} - Strength`);
    headerParts.push(`${state.name} - Speed`);
    headerParts.push(`${state.name} - Defense`);
    headerParts.push(`${state.name} - Dexterity`);
  });
  lines.push(headerParts.join(','));
  
  // Add initial stats (Day 0)
  const day0Parts = ['0'];
  data.comparisonStates.forEach(() => {
    day0Parts.push(String(data.initialStats.strength));
    day0Parts.push(String(data.initialStats.speed));
    day0Parts.push(String(data.initialStats.defense));
    day0Parts.push(String(data.initialStats.dexterity));
  });
  lines.push(day0Parts.join(','));
  
  // Get the maximum number of days from all snapshots
  const maxDays = Math.max(...data.comparisonStates
    .filter(s => s.dailySnapshots)
    .map(s => s.dailySnapshots!.length));
  
  // Add daily data with the specified interval
  for (let i = 0; i < maxDays; i += interval) {
    const dayParts: string[] = [];
    
    // Get day number from first comparison that has data
    const firstSnapshot = data.comparisonStates.find(s => s.dailySnapshots && s.dailySnapshots[i]);
    if (!firstSnapshot || !firstSnapshot.dailySnapshots) continue;
    
    const day = firstSnapshot.dailySnapshots[i].day;
    dayParts.push(String(day));
    
    // Add stats for each comparison state
    data.comparisonStates.forEach(state => {
      if (state.dailySnapshots && state.dailySnapshots[i]) {
        const snapshot = state.dailySnapshots[i];
        dayParts.push(String(Math.round(snapshot.strength)));
        dayParts.push(String(Math.round(snapshot.speed)));
        dayParts.push(String(Math.round(snapshot.defense)));
        dayParts.push(String(Math.round(snapshot.dexterity)));
      } else {
        // If no data for this state, use empty or zero
        dayParts.push('', '', '', '');
      }
    });
    
    lines.push(dayParts.join(','));
  }
  
  lines.push('');
  lines.push('');
  
  // Add summary section
  lines.push('Summary - Final Stats');
  const finalStatsHeader = ['Stat', ...data.comparisonStates.map(s => s.name)].join(',');
  lines.push(finalStatsHeader);
  
  ['strength', 'speed', 'defense', 'dexterity'].forEach(stat => {
    const statName = stat.charAt(0).toUpperCase() + stat.slice(1);
    const values = data.comparisonStates.map(s => Math.round(s.finalStats[stat as keyof typeof s.finalStats]));
    lines.push([statName, ...values].join(','));
  });
  
  // Total stats
  const totals = data.comparisonStates.map(s => 
    Math.round(s.finalStats.strength + s.finalStats.speed + s.finalStats.defense + s.finalStats.dexterity)
  );
  lines.push(['Total', ...totals].join(','));
  lines.push('');
  
  // Stat Gains
  lines.push('Summary - Stat Gains');
  lines.push(finalStatsHeader);
  
  ['strength', 'speed', 'defense', 'dexterity'].forEach(stat => {
    const statName = stat.charAt(0).toUpperCase() + stat.slice(1);
    const values = data.comparisonStates.map(s => Math.round(s.statGains[stat as keyof typeof s.statGains]));
    lines.push([statName, ...values.map(v => `+${v}`)].join(','));
  });
  
  // Total gains
  const totalGains = data.comparisonStates.map(s => 
    Math.round(s.statGains.strength + s.statGains.speed + s.statGains.defense + s.statGains.dexterity)
  );
  lines.push(['Total Gains', ...totalGains.map(v => `+${v}`)].join(','));
  lines.push('');
  
  // Cost Estimates (if available)
  if (data.comparisonStates.some(s => s.costs)) {
    lines.push('Summary - Cost Estimates');
    lines.push(['Cost Type', ...data.comparisonStates.map(s => s.name)].join(','));
    lines.push(['EDVD Cost', ...data.comparisonStates.map(s => s.costs?.edvd ?? 0)].join(','));
    lines.push(['Xanax Cost', ...data.comparisonStates.map(s => s.costs?.xanax ?? 0)].join(','));
    lines.push(['Candy Cost', ...data.comparisonStates.map(s => s.costs?.candy ?? 0)].join(','));
    lines.push(['Energy Cost', ...data.comparisonStates.map(s => s.costs?.energy ?? 0)].join(','));
    lines.push(['Loss/Revive Income', ...data.comparisonStates.map(s => s.costs?.lossReviveIncome ?? 0)].join(','));
    lines.push(['Total Cost', ...data.comparisonStates.map(s => s.costs?.total ?? 0)].join(','));
  }
  
  return lines.join('\n');
}

/**
 * Download a string as a file
 */
export function downloadFile(content: string, filename: string, contentType: string = 'text/csv'): void {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export gym comparison data as CSV file
 */
export function exportGymComparisonData(data: ExportData): void {
  const csv = exportToIncrementalCSV(data);
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `gym-comparison-${timestamp}.csv`;
  downloadFile(csv, filename);
}
