import axios from 'axios';
import { logInfo, logError } from './logger';
import { getDiscordClient } from '../services/discordBot';
import { TextChannel } from 'discord.js';

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
    await axios.post(webhookUrl, { content: message.substring(0, 2000) }); // Discord message limit
    logInfo('Discord alert sent successfully');
  } catch (error) {
    logError('Failed to send Discord alert', error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Sends a message to a specific Discord channel using the bot client
 * @param channelId - The Discord channel ID
 * @param message - The message content to send
 */
export async function sendDiscordChannelAlert(channelId: string, message: string): Promise<void> {
  const client = getDiscordClient();
  
  if (!client || !client.isReady()) {
    logError('Discord bot not ready', new Error('Discord client is not initialized or not ready'));
    return;
  }
  
  try {
    const channel = await client.channels.fetch(channelId);
    
    if (!channel || !channel.isTextBased()) {
      logError('Invalid channel or not a text channel', new Error(`Channel ${channelId} is not a text channel`));
      return;
    }
    
    // Type guard to ensure we have a sendable channel
    if (channel instanceof TextChannel || 'send' in channel) {
      await (channel as any).send({ content: message.substring(0, 2000) }); // Discord message limit
      logInfo('Discord channel alert sent successfully', { channelId });
    } else {
      logError('Channel does not support sending messages', new Error(`Channel ${channelId} cannot send messages`));
    }
  } catch (error) {
    logError('Failed to send Discord channel alert', error instanceof Error ? error : new Error(String(error)), { channelId });
  }
}

/**
 * Sends a direct message to a Discord user using the bot client
 * @param userId - The Discord user ID
 * @param message - The message content to send
 */
export async function sendDirectMessage(userId: string, message: string): Promise<void> {
  const client = getDiscordClient();
  
  if (!client || !client.isReady()) {
    logError('Discord bot not ready', new Error('Discord client is not initialized or not ready'));
    return;
  }
  
  try {
    const user = await client.users.fetch(userId);
    
    if (!user) {
      logError('User not found', new Error(`User ${userId} not found`));
      return;
    }
    
    await user.send({ content: message.substring(0, 2000) }); // Discord message limit
    logInfo('Discord DM sent successfully', { userId });
  } catch (error) {
    logError('Failed to send Discord DM', error instanceof Error ? error : new Error(String(error)), { userId });
  }
}

/**
 * Sends a message to a user via DM, with fallback to channel if DM fails
 * @param userId - The Discord user ID
 * @param message - The message content to send
 * @param fallbackChannelId - Optional channel ID to use if DM fails
 */
export async function sendDirectMessageWithFallback(userId: string, message: string, fallbackChannelId?: string): Promise<void> {
  const client = getDiscordClient();
  
  if (!client || !client.isReady()) {
    logError('Discord bot not ready', new Error('Discord client is not initialized or not ready'));
    return;
  }
  
  try {
    const user = await client.users.fetch(userId);
    
    if (!user) {
      logError('User not found', new Error(`User ${userId} not found`));
      // Try fallback channel
      if (fallbackChannelId) {
        await sendDiscordChannelAlert(fallbackChannelId, `<@${userId}> ${message}`);
      }
      return;
    }
    
    try {
      await user.send({ content: message.substring(0, 2000) }); // Discord message limit
      logInfo('Discord DM sent successfully', { userId });
    } catch (dmError) {
      logError('Failed to send Discord DM, trying fallback channel', dmError instanceof Error ? dmError : new Error(String(dmError)), { userId });
      
      // Try fallback to channel
      if (fallbackChannelId) {
        await sendDiscordChannelAlert(fallbackChannelId, `<@${userId}> ${message}`);
        logInfo('Sent message to fallback channel instead of DM', { userId, channelId: fallbackChannelId });
      }
    }
  } catch (error) {
    logError('Failed to send message (DM or channel)', error instanceof Error ? error : new Error(String(error)), { userId });
  }
}
