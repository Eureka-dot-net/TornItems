import express, { Request, Response } from 'express';
import axios from 'axios';
import { DiscordUser } from '../models/DiscordUser';
import { MinMaxSubscription } from '../models/MinMaxSubscription';
import { encrypt } from '../utils/encryption';
import { DiscordUserManager } from '../services/DiscordUserManager';
import { logInfo, logError } from '../utils/logger';
import { authenticateDiscordBot } from '../middleware/discordAuth';
import { logApiCall } from '../utils/apiCallLogger';
import { fetchMinMaxStatus } from '../utils/minmaxHelper';

const router = express.Router({ mergeParams: true });

interface TornUserBasicResponse {
  profile: {
    id: number;
    name: string;
    level: number;
    gender: string;
    status: {
      description: string;
      details: string | null;
      state: string;
      color: string;
      until: number | null;
    };
  };
}

interface SetKeyRequestBody {
  discordId: string;
  apiKey: string;
}

interface MinMaxRequestBody {
  discordId: string;
  userId?: number;
}

interface MinMaxSubRequestBody {
  discordId: string;
  channelId: string;
  hoursBeforeReset: number;
  notifyEducation?: boolean;
  notifyInvestment?: boolean;
  notifyVirus?: boolean;
}

interface MinMaxUnsubRequestBody {
  discordId: string;
}

// POST /discord/setkey
router.post('/discord/setkey', authenticateDiscordBot, async (req: Request, res: Response): Promise<void> => {
  try {
    const { discordId, apiKey } = req.body as SetKeyRequestBody;

    // Validate input
    if (!discordId || !apiKey) {
      res.status(400).json({ 
        error: 'Missing required fields: discordId and apiKey are required' 
      });
      return;
    }

    logInfo('Setting Discord API key', { discordId });

    // Fetch user profile from Torn API to validate the key and get user info
    let tornUserData: TornUserBasicResponse;
    try {
      const response = await axios.get<TornUserBasicResponse>(
        `https://api.torn.com/v2/user?selections=basic&key=${apiKey}`
      );
      tornUserData = response.data;
      
      // Log the API call
      await logApiCall('user/basic', 'discord-route');
    } catch (error: any) {
      // Check if it's an axios error (either real or mocked)
      if (error.isAxiosError || (error.response && error.response.status)) {
        logError('Invalid Torn API key provided', error instanceof Error ? error : new Error(String(error)), {
          status: error.response?.status,
          discordId
        });
        res.status(400).json({ 
          error: 'Invalid API key or failed to fetch user data from Torn API' 
        });
        return;
      }
      throw error;
    }

    // Validate that the response has the expected structure
    if (!tornUserData || !tornUserData.profile || !tornUserData.profile.id) {
      logError('Invalid response from Torn API - missing profile data', new Error('Invalid API response structure'), {
        discordId,
        responseData: tornUserData
      });
      res.status(400).json({ 
        error: 'Invalid API key or failed to fetch user data from Torn API' 
      });
      return;
    }

    const { id: tornId, name, level } = tornUserData.profile;

    // Encrypt the API key before storing
    const encryptedApiKey = encrypt(apiKey);

    // Check if user already exists and update, or create new
    const existingUser = await DiscordUser.findOne({ discordId });

    if (existingUser) {
      // Update existing user
      existingUser.tornId = tornId;
      existingUser.name = name;
      existingUser.apiKey = encryptedApiKey;
      existingUser.level = level;
      await existingUser.save();

      logInfo('Updated existing Discord user', {
        discordId,
        tornId,
        name,
        level
      });
    } else {
      // Create new user
      const newUser = new DiscordUser({
        discordId,
        tornId,
        name,
        apiKey: encryptedApiKey,
        level
      });
      await newUser.save();

      logInfo('Created new Discord user', {
        discordId,
        tornId,
        name,
        level
      });
    }

    // Fetch and store battle stats
    try {
      await DiscordUserManager.fetchAndStoreBattleStats(discordId);
    } catch (error) {
      // Log the error but don't fail the request
      logError('Failed to fetch battle stats, but user was saved', error instanceof Error ? error : new Error(String(error)), {
        tornId,
        discordId
      });
    }

    res.status(200).json({
      success: true,
      message: 'API key set successfully',
      data: {
        discordId,
        tornId,
        name,
        level
      }
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      logError('Error setting Discord API key', err);
    } else {
      logError('Unknown error setting Discord API key', new Error(String(err)));
    }

    res.status(500).json({ error: 'Failed to set API key' });
  }
});

// POST /discord/minmax
router.post('/discord/minmax', authenticateDiscordBot, async (req: Request, res: Response): Promise<void> => {
  try {
    const { discordId, userId } = req.body as MinMaxRequestBody;

    // Validate input
    if (!discordId) {
      res.status(400).json({ 
        error: 'Missing required field: discordId' 
      });
      return;
    }

    logInfo('Fetching minmax stats', { discordId, userId });

    // Check if user has API key
    const user = await DiscordUser.findOne({ discordId });
    
    if (!user || !user.apiKey) {
      res.status(400).json({
        error: 'You need to set your API key first. Use `/minmaxsetkey` to store your Torn API key. Note: Please use a limited API key for security purposes.'
      });
      return;
    }

    try {
      // Use helper function to fetch minmax status
      const status = await fetchMinMaxStatus(discordId, userId, !userId || userId === user.tornId);
      
      res.status(200).json({
        success: true,
        data: status
      });
    } catch (error: any) {
      if (error.message === 'User has not set their API key') {
        res.status(400).json({
          error: 'You need to set your API key first. Use `/minmaxsetkey` to store your Torn API key. Note: Please use a limited API key for security purposes.'
        });
        return;
      }
      
      if (error.message.includes('Failed to fetch')) {
        logError('Failed to fetch minmax stats', error instanceof Error ? error : new Error(String(error)), {
          discordId,
          userId
        });
        res.status(400).json({ 
          error: 'Failed to fetch personal stats from Torn API. Please check your API key and user ID.' 
        });
        return;
      }
      
      throw error;
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      logError('Error fetching minmax stats', err);
    } else {
      logError('Unknown error fetching minmax stats', new Error(String(err)));
    }

    res.status(500).json({ error: 'Failed to fetch minmax stats' });
  }
});

// POST /discord/minmaxsub
router.post('/discord/minmaxsub', authenticateDiscordBot, async (req: Request, res: Response): Promise<void> => {
  try {
    const { discordId, channelId, hoursBeforeReset, notifyEducation, notifyInvestment, notifyVirus } = req.body as MinMaxSubRequestBody;

    // Validate input
    if (!discordId || !channelId || hoursBeforeReset === undefined) {
      res.status(400).json({ 
        error: 'Missing required fields: discordId, channelId, and hoursBeforeReset are required' 
      });
      return;
    }

    // Validate hoursBeforeReset range
    if (hoursBeforeReset < 1 || hoursBeforeReset > 23) {
      res.status(400).json({ 
        error: 'hoursBeforeReset must be between 1 and 23' 
      });
      return;
    }

    logInfo('Setting minmax subscription', { discordId, channelId, hoursBeforeReset });

    // Check if user has API key
    const user = await DiscordUser.findOne({ discordId });
    
    if (!user || !user.apiKey) {
      res.status(400).json({
        error: 'You need to set your API key first. Use `/minmaxsetkey` to store your Torn API key.'
      });
      return;
    }

    // Check if subscription already exists
    let subscription = await MinMaxSubscription.findOne({ discordUserId: discordId });

    if (subscription) {
      // Update existing subscription
      subscription.channelId = channelId;
      subscription.hoursBeforeReset = hoursBeforeReset;
      subscription.notifyEducation = notifyEducation !== undefined ? notifyEducation : true;
      subscription.notifyInvestment = notifyInvestment !== undefined ? notifyInvestment : true;
      subscription.notifyVirus = notifyVirus !== undefined ? notifyVirus : true;
      subscription.enabled = true;
      subscription.lastNotificationSent = null; // Reset to ensure notification is sent
      await subscription.save();

      logInfo('Updated minmax subscription', {
        discordId,
        channelId,
        hoursBeforeReset,
        notifyEducation: subscription.notifyEducation,
        notifyInvestment: subscription.notifyInvestment,
        notifyVirus: subscription.notifyVirus
      });

      res.status(200).json({
        success: true,
        message: 'Minmax subscription updated successfully',
        data: {
          discordId,
          channelId,
          hoursBeforeReset,
          notifyEducation: subscription.notifyEducation,
          notifyInvestment: subscription.notifyInvestment,
          notifyVirus: subscription.notifyVirus
        }
      });
    } else {
      // Create new subscription
      subscription = new MinMaxSubscription({
        discordUserId: discordId,
        channelId,
        hoursBeforeReset,
        notifyEducation: notifyEducation !== undefined ? notifyEducation : true,
        notifyInvestment: notifyInvestment !== undefined ? notifyInvestment : true,
        notifyVirus: notifyVirus !== undefined ? notifyVirus : true,
        enabled: true,
        lastNotificationSent: null
      });
      await subscription.save();

      logInfo('Created minmax subscription', {
        discordId,
        channelId,
        hoursBeforeReset,
        notifyEducation: subscription.notifyEducation,
        notifyInvestment: subscription.notifyInvestment,
        notifyVirus: subscription.notifyVirus
      });

      res.status(200).json({
        success: true,
        message: 'Minmax subscription created successfully',
        data: {
          discordId,
          channelId,
          hoursBeforeReset,
          notifyEducation: subscription.notifyEducation,
          notifyInvestment: subscription.notifyInvestment,
          notifyVirus: subscription.notifyVirus
        }
      });
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      logError('Error setting minmax subscription', err);
    } else {
      logError('Unknown error setting minmax subscription', new Error(String(err)));
    }

    res.status(500).json({ error: 'Failed to set minmax subscription' });
  }
});

// POST /discord/minmaxunsub
router.post('/discord/minmaxunsub', authenticateDiscordBot, async (req: Request, res: Response): Promise<void> => {
  try {
    const { discordId } = req.body as MinMaxUnsubRequestBody;

    // Validate input
    if (!discordId) {
      res.status(400).json({ 
        error: 'Missing required field: discordId' 
      });
      return;
    }

    logInfo('Removing minmax subscription', { discordId });

    // Find and delete subscription
    const subscription = await MinMaxSubscription.findOneAndDelete({ discordUserId: discordId });

    if (!subscription) {
      res.status(404).json({
        error: 'No minmax subscription found for this user'
      });
      return;
    }

    logInfo('Deleted minmax subscription', { discordId });

    res.status(200).json({
      success: true,
      message: 'Minmax subscription removed successfully'
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      logError('Error removing minmax subscription', err);
    } else {
      logError('Unknown error removing minmax subscription', new Error(String(err)));
    }

    res.status(500).json({ error: 'Failed to remove minmax subscription' });
  }
});

export default router;
