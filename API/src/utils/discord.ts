import axios from 'axios';
import { logInfo, logError } from './logger';

/**
 * Sends a message to the configured Discord webhook
 * @param message - The message content to send
 */
export async function sendDiscordAlert(message: string): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  
  if (!webhookUrl) {
    logError('Discord webhook URL not configured', new Error('DISCORD_WEBHOOK_URL environment variable not set'));
    return;
  }
  
  try {
    await axios.post(webhookUrl, { content: message });
    logInfo('Discord alert sent successfully');
  } catch (error) {
    logError('Failed to send Discord alert', error instanceof Error ? error : new Error(String(error)));
  }
}
