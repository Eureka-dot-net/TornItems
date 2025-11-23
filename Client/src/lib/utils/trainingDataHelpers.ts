/**
 * Shared helper functions for processing training data
 * Used by both TrainingBreakdown page and CSV export to ensure consistency
 */

import type { DailySnapshot } from './exportHelpers';

export interface TrainingRow {
  day: number | string;
  strength: number | string;
  speed: number | string;
  defense: number | string;
  dexterity: number | string;
  total: number | string;
  totalEnergyUsed: number;
  strengthTraining: string;
  speedTraining: string;
  defenseTraining: string;
  dexterityTraining: string;
  notes: string;
}

/**
 * Calculate total energy used from training details
 */
export function calculateTotalEnergy(trainingDetails?: {
  strength?: { gym: string; energy: number; };
  speed?: { gym: string; energy: number; };
  defense?: { gym: string; energy: number; };
  dexterity?: { gym: string; energy: number; };
}): number {
  if (!trainingDetails) return 0;
  let total = 0;
  if (trainingDetails.strength) total += trainingDetails.strength.energy;
  if (trainingDetails.speed) total += trainingDetails.speed.energy;
  if (trainingDetails.defense) total += trainingDetails.defense.energy;
  if (trainingDetails.dexterity) total += trainingDetails.dexterity.energy;
  return total;
}

/**
 * Format training details for a specific stat
 */
export function formatTrainingDetails(
  stat: 'strength' | 'speed' | 'defense' | 'dexterity',
  trainingDetails?: {
    strength?: { gym: string; energy: number; };
    speed?: { gym: string; energy: number; };
    defense?: { gym: string; energy: number; };
    dexterity?: { gym: string; energy: number; };
  }
): string {
  if (trainingDetails && trainingDetails[stat]) {
    const details = trainingDetails[stat]!;
    return `${details.energy} energy at ${details.gym}`;
  }
  return '';
}

/**
 * Convert daily snapshots into training rows
 * This is the shared logic used by both the web page and CSV export
 * 
 * For days with multiple training sessions (e.g., candy/eDVD jumps + post-jump training),
 * this will return multiple rows - one for each session.
 */
export function convertSnapshotsToTrainingRows(
  snapshots: DailySnapshot[],
  initialStats: {
    strength: number;
    speed: number;
    defense: number;
    dexterity: number;
  }
): TrainingRow[] {
  const rows: TrainingRow[] = [];
  
  // Add day 0 (initial stats)
  const initialTotal = 
    initialStats.strength +
    initialStats.speed +
    initialStats.defense +
    initialStats.dexterity;

  rows.push({
    day: 0,
    strength: initialStats.strength,
    speed: initialStats.speed,
    defense: initialStats.defense,
    dexterity: initialStats.dexterity,
    total: initialTotal,
    totalEnergyUsed: 0,
    strengthTraining: '',
    speedTraining: '',
    defenseTraining: '',
    dexterityTraining: '',
    notes: 'Starting stats',
  });

  // Process each daily snapshot
  snapshots.forEach((snapshot) => {
    // Check if this day has multiple training sessions (jump + post-jump)
    if (snapshot.trainingSessions && snapshot.trainingSessions.length > 0) {
      // Create separate rows for each training session
      snapshot.trainingSessions.forEach((session, sessionIndex) => {
        const totalEnergy = calculateTotalEnergy(session.trainingDetails);
        
        rows.push({
          day: sessionIndex === 0 ? snapshot.day : '', // Only show day number on first row
          strength: session.strength ?? '',
          speed: session.speed ?? '',
          defense: session.defense ?? '',
          dexterity: session.dexterity ?? '',
          total: session.strength && session.speed && session.defense && session.dexterity 
            ? session.strength + session.speed + session.defense + session.dexterity 
            : '',
          totalEnergyUsed: totalEnergy,
          strengthTraining: formatTrainingDetails('strength', session.trainingDetails),
          speedTraining: formatTrainingDetails('speed', session.trainingDetails),
          defenseTraining: formatTrainingDetails('defense', session.trainingDetails),
          dexterityTraining: formatTrainingDetails('dexterity', session.trainingDetails),
          notes: session.notes ? session.notes.join('; ') : '',
        });
      });
    } else {
      // Regular day with no separate sessions
      const total = snapshot.strength + snapshot.speed + snapshot.defense + snapshot.dexterity;
      const totalEnergy = calculateTotalEnergy(snapshot.trainingDetails);
      
      rows.push({
        day: snapshot.day,
        strength: snapshot.strength,
        speed: snapshot.speed,
        defense: snapshot.defense,
        dexterity: snapshot.dexterity,
        total,
        totalEnergyUsed: totalEnergy,
        strengthTraining: formatTrainingDetails('strength', snapshot.trainingDetails),
        speedTraining: formatTrainingDetails('speed', snapshot.trainingDetails),
        defenseTraining: formatTrainingDetails('defense', snapshot.trainingDetails),
        dexterityTraining: formatTrainingDetails('dexterity', snapshot.trainingDetails),
        notes: snapshot.notes ? snapshot.notes.join('; ') : '',
      });
    }
  });

  return rows;
}
