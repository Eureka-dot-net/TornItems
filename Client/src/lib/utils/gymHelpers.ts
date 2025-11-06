/**
 * Helper utilities for the Gym Comparison tool
 */

/**
 * Format a number as currency (shortened for large values)
 */
export function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}b`;
  } else if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}m`;
  } else if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}k`;
  }
  return `$${value.toFixed(0)}`;
}

/**
 * Format days into human-readable time (years, months, days)
 */
export function formatDaysToHumanReadable(days: number): string {
  const years = Math.floor(days / 365);
  const remainingAfterYears = days % 365;
  const months = Math.floor(remainingAfterYears / 30);
  const remainingDays = remainingAfterYears % 30;

  const parts = [];
  if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
  if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
  if (remainingDays > 0 || parts.length === 0)
    parts.push(`${remainingDays} day${remainingDays !== 1 ? 's' : ''}`);

  return parts.join(', ');
}
