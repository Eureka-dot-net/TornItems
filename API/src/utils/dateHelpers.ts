/**
 * Rounds a date up to the next quarter-hour boundary (:00, :15, :30, or :45)
 * @param date - The date to round up
 * @returns A new Date object rounded up to the next 15-minute mark
 */
export function roundUpToNextQuarterHour(date: Date): Date {
  const result = new Date(date);
  const minutes = result.getMinutes();
  const seconds = result.getSeconds();
  const milliseconds = result.getMilliseconds();
  
  // Calculate minutes to next quarter hour
  const minutesToAdd = 15 - (minutes % 15);
  
  // If we're exactly on a quarter hour boundary with no seconds/ms, return as-is
  if (minutesToAdd === 15 && seconds === 0 && milliseconds === 0) {
    return result;
  }
  
  // Otherwise, round up to next quarter hour
  result.setMinutes(minutes + minutesToAdd);
  result.setSeconds(0);
  result.setMilliseconds(0);
  
  return result;
}

/**
 * Calculates the number of minutes between two dates
 * @param startDate - The start date
 * @param endDate - The end date
 * @returns The number of minutes between the two dates (can be negative if endDate is before startDate)
 */
export function minutesBetween(startDate: Date, endDate: Date): number {
  return (endDate.getTime() - startDate.getTime()) / 60000;
}
