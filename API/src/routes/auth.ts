import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { TrainingAuthorizedUser } from '../models/TrainingAuthorizedUser';

const router = express.Router({ mergeParams: true });

// Simple in-memory rate limiter for auth endpoints
const authAttempts = new Map<string, { count: number; resetTime: number }>();

// Rate limit: 10 requests per minute per IP
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10;

const authRateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  
  const clientData = authAttempts.get(clientIp);
  
  if (!clientData || now > clientData.resetTime) {
    // First request or window expired - reset counter
    authAttempts.set(clientIp, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    next();
    return;
  }
  
  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    // Rate limit exceeded
    const retryAfter = Math.ceil((clientData.resetTime - now) / 1000);
    res.setHeader('Retry-After', retryAfter.toString());
    res.status(429).json({ 
      error: 'Too many authentication attempts. Please try again later.',
      retryAfter 
    });
    return;
  }
  
  // Increment counter
  clientData.count++;
  next();
};

// Clean up old entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of authAttempts.entries()) {
    if (now > data.resetTime) {
      authAttempts.delete(ip);
    }
  }
}, 5 * 60 * 1000);

// POST /auth/training - Authenticate user for training recommendations
router.post('/auth/training', authRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { tornUserId, tornUserName } = req.body;

    if (!tornUserId || typeof tornUserId !== 'number') {
      res.status(400).json({ error: 'Invalid tornUserId provided' });
      return;
    }

    // Check if user is authorized
    const authorizedUser = await TrainingAuthorizedUser.findOne({ tornUserId });

    if (!authorizedUser) {
      res.status(403).json({ 
        error: 'User is not authorized to access training recommendations',
        authorized: false 
      });
      return;
    }

    // Generate JWT token for authorized user
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is not configured');
      res.status(500).json({ error: 'Server configuration error' });
      return;
    }

    const token = jwt.sign(
      { 
        tornUserId: authorizedUser.tornUserId,
        name: authorizedUser.name || tornUserName,
        type: 'training'
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    console.log(`Training auth successful for user ${tornUserId} (${tornUserName || authorizedUser.name})`);

    res.json({
      authorized: true,
      token,
      user: {
        tornUserId: authorizedUser.tornUserId,
        name: authorizedUser.name
      }
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('Training auth error:', err.message);
    } else {
      console.error('Unknown training auth error');
    }

    res.status(500).json({ error: 'Failed to authenticate user' });
  }
});

// GET /auth/training/verify - Verify existing training token
router.get('/auth/training/verify', authRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({ valid: false, error: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401).json({ valid: false, error: 'No token provided' });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      res.status(500).json({ error: 'Server configuration error' });
      return;
    }

    const payload = jwt.verify(token, jwtSecret) as { 
      tornUserId: number; 
      name: string; 
      type: string 
    };

    if (payload.type !== 'training') {
      res.status(401).json({ valid: false, error: 'Invalid token type' });
      return;
    }

    // Verify user is still authorized
    const authorizedUser = await TrainingAuthorizedUser.findOne({ 
      tornUserId: payload.tornUserId 
    });

    if (!authorizedUser) {
      res.status(403).json({ valid: false, error: 'User no longer authorized' });
      return;
    }

    res.json({
      valid: true,
      user: {
        tornUserId: authorizedUser.tornUserId,
        name: authorizedUser.name
      }
    });
  } catch (err: unknown) {
    console.log('Token verification failed:', err instanceof Error ? err.message : 'Unknown error');
    res.status(401).json({ valid: false, error: 'Invalid or expired token' });
  }
});

export default router;
