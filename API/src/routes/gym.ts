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
    
    // Calculate per-stat perk percentages from gym-related perks
    const perkPercs = {
      strength: 0,
      speed: 0,
      defense: 0,
      dexterity: 0
    };
    
    const allPerks = [
      ...data.faction_perks,
      ...data.property_perks,
      ...data.merit_perks
    ];
    
    // Extract gym perk percentages per stat
    allPerks.forEach(perk => {
      // Match specific stat gym gains (e.g., "+ 5% strength gym gains")
      const strengthMatch = perk.match(/\+\s*(\d+)%\s+strength\s+gym gains?/i);
      const speedMatch = perk.match(/\+\s*(\d+)%\s+speed\s+gym gains?/i);
      const defenseMatch = perk.match(/\+\s*(\d+)%\s+defense\s+gym gains?/i);
      const dexterityMatch = perk.match(/\+\s*(\d+)%\s+dexterity\s+gym gains?/i);
      
      // Match general gym gains (e.g., "+ 2% gym gains")
      const generalMatch = perk.match(/\+\s*(\d+)%\s+gym gains?$/i);
      
      if (strengthMatch) {
        perkPercs.strength += parseInt(strengthMatch[1], 10);
      }
      if (speedMatch) {
        perkPercs.speed += parseInt(speedMatch[1], 10);
      }
      if (defenseMatch) {
        perkPercs.defense += parseInt(defenseMatch[1], 10);
      }
      if (dexterityMatch) {
        perkPercs.dexterity += parseInt(dexterityMatch[1], 10);
      }
      
      // General gym gains apply to all stats
      if (generalMatch) {
        const generalPerc = parseInt(generalMatch[1], 10);
        perkPercs.strength += generalPerc;
        perkPercs.speed += generalPerc;
        perkPercs.defense += generalPerc;
        perkPercs.dexterity += generalPerc;
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
      perkPercs: perkPercs
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
