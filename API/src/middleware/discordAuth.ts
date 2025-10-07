import { Request, Response, NextFunction } from 'express';
import { logError, logWarn } from '../utils/logger';

/**
 * Middleware to authenticate requests from the Discord bot
 * Validates the Bearer token in the Authorization header against BOT_SECRET
 */
export const authenticateDiscordBot = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    logWarn('Discord bot authentication failed: Missing Authorization header', {
      path: req.path,
      method: req.method
    });
    res.status(401).json({ error: 'Unauthorized: Missing Authorization header' });
    return;
  }

  // Extract Bearer token
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    logWarn('Discord bot authentication failed: Invalid Authorization header format', {
      path: req.path,
      method: req.method
    });
    res.status(401).json({ error: 'Unauthorized: Invalid Authorization header format' });
    return;
  }

  const token = parts[1];
  const botSecret = process.env.BOT_SECRET;

  if (!botSecret) {
    logError('BOT_SECRET is not configured', new Error('Missing BOT_SECRET environment variable'));
    res.status(500).json({ error: 'Server configuration error' });
    return;
  }

  if (token !== botSecret) {
    logWarn('Discord bot authentication failed: Invalid token', {
      path: req.path,
      method: req.method
    });
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
    return;
  }

  // Authentication successful
  next();
};
