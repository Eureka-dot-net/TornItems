import cron from 'node-cron';
import { logInfo, logError } from '../utils/logger';
import { checkMinMaxSubscriptions } from './minmaxNotificationService';

/**
 * Start the notification scheduler service.
 * This service runs minmax subscription checks on a regular schedule.
 */
export function startNotificationScheduler() {
  logInfo('Starting notification scheduler service...');
  
  // Run every minute for minmax subscription checks
  // (minmax only needs minute-level precision as it triggers on specific hours)
  cron.schedule('* * * * *', () => {
    checkMinMaxSubscriptions().catch((error) => {
      logError('Error in notification scheduler service', error instanceof Error ? error : new Error(String(error)));
    });
  });
  
  logInfo('Notification scheduler service started (checking every minute)');
}

/**
 * @deprecated Use startNotificationScheduler instead. This function is kept for backward compatibility.
 */
export function startTravelNotificationService() {
  startNotificationScheduler();
}
