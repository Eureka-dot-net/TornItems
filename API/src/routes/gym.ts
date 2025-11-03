import express, { Request, Response } from 'express';
import { fetchGymStats } from '../utils/tornApi';
import { logInfo, logError } from '../utils/logger';

const router = express.Router({ mergeParams: true });

/**
 * GET /api/gym/stats
 * Fetch user's gym stats including battlestats, active gym, and perks
 * Requires API key in query parameter
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { apiKey } = req.query;
    
    if (!apiKey || typeof apiKey !== 'string') {
      return res.status(400).json({ error: 'API key is required' });
    }
    
    logInfo('Fetching gym stats for user');
    
    const data = await fetchGymStats(apiKey);
    
    // Calculate total perk percentage from gym-related perks
    let perkPerc = 0;
    const allPerks = [
      ...data.faction_perks,
      ...data.property_perks,
      ...data.merit_perks
    ];
    
    // Extract gym perk percentages
    allPerks.forEach(perk => {
      const gymGainMatch = perk.match(/\+\s*(\d+)%\s+(?:strength|speed|defense|dexterity)?\s*gym gains?/i);
      if (gymGainMatch) {
        perkPerc += parseInt(gymGainMatch[1], 10);
      }
    });
    
    // Return formatted response
    res.json({
      battlestats: {
        strength: data.battlestats.strength.value,
        speed: data.battlestats.speed.value,
        defense: data.battlestats.defense.value,
        dexterity: data.battlestats.dexterity.value,
        total: data.battlestats.total
      },
      activeGym: data.active_gym,
      perkPerc: perkPerc
    });
  } catch (error) {
    logError('Error fetching gym stats', error instanceof Error ? error : new Error(String(error)));
    
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as { response?: { status: number; data: { error?: { error?: string } } } };
      if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
        return res.status(401).json({ error: 'Invalid API key' });
      }
      if (axiosError.response?.data?.error?.error) {
        return res.status(400).json({ error: axiosError.response.data.error.error });
      }
    }
    
    res.status(500).json({ error: 'Failed to fetch gym stats' });
  }
});

export default router;
