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
    
    // Calculate per-stat perk multipliers from gym-related perks
    // Perks are multiplicative: 5% + 2% = (1.05) * (1.02) = 1.071 = 7.1%
    const perkMultipliers = {
      strength: 1,
      speed: 1,
      defense: 1,
      dexterity: 1
    };
    
    // Include all perk sources EXCEPT merit_perks
    const allPerks = [
      ...data.faction_perks,
      ...data.property_perks,
      ...data.education_perks,
      ...data.book_perks,
      ...data.stock_perks,
      ...data.enhancer_perks,
      ...data.job_perks
    ];
    
    // Extract and apply gym perk percentages per stat (multiplicative)
    allPerks.forEach(perk => {
      // Match specific stat gym gains (e.g., "+ 5% strength gym gains")
      const strengthMatch = perk.match(/\+\s*(\d+)%\s+strength\s+gym gains?/i);
      const speedMatch = perk.match(/\+\s*(\d+)%\s+speed\s+gym gains?/i);
      const defenseMatch = perk.match(/\+\s*(\d+)%\s+defense\s+gym gains?/i);
      const dexterityMatch = perk.match(/\+\s*(\d+)%\s+dexterity\s+gym gains?/i);
      
      // Match general gym gains (e.g., "+ 2% gym gains")
      const generalMatch = perk.match(/\+\s*(\d+)%\s+gym gains?$/i);
      
      if (strengthMatch) {
        const perc = parseInt(strengthMatch[1], 10);
        perkMultipliers.strength *= (1 + perc / 100);
      }
      if (speedMatch) {
        const perc = parseInt(speedMatch[1], 10);
        perkMultipliers.speed *= (1 + perc / 100);
      }
      if (defenseMatch) {
        const perc = parseInt(defenseMatch[1], 10);
        perkMultipliers.defense *= (1 + perc / 100);
      }
      if (dexterityMatch) {
        const perc = parseInt(dexterityMatch[1], 10);
        perkMultipliers.dexterity *= (1 + perc / 100);
      }
      
      // General gym gains apply to all stats (multiplicatively)
      if (generalMatch) {
        const perc = parseInt(generalMatch[1], 10);
        const multiplier = 1 + perc / 100;
        perkMultipliers.strength *= multiplier;
        perkMultipliers.speed *= multiplier;
        perkMultipliers.defense *= multiplier;
        perkMultipliers.dexterity *= multiplier;
      }
    });
    
    // Convert multipliers to percentages for display
    // e.g., 1.071 becomes 7.1
    const perkPercs = {
      strength: (perkMultipliers.strength - 1) * 100,
      speed: (perkMultipliers.speed - 1) * 100,
      defense: (perkMultipliers.defense - 1) * 100,
      dexterity: (perkMultipliers.dexterity - 1) * 100
    };
    
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
