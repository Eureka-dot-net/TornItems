/**
 * Export helpers for gym comparison data
 */

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
  const csv = exportToCSV(data);
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `gym-comparison-${timestamp}.csv`;
  downloadFile(csv, filename);
}
