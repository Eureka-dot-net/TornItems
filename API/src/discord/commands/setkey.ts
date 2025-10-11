import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import axios from 'axios';
import { DiscordUser } from '../../models/DiscordUser';
import { encrypt } from '../../utils/encryption';
import { DiscordUserManager } from '../../services/DiscordUserManager';
import { logInfo, logError } from '../../utils/logger';

export const data = new SlashCommandBuilder()
  .setName('setkey')
  .setDescription('Privately store your Torn API key for bot features.')
  .addStringOption(option =>
    option
      .setName('key')
      .setDescription('Your Torn API key (will be kept private).')
      .setRequired(true)
  );

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

export async function execute(interaction: ChatInputCommandInteraction) {
  const apiKey = interaction.options.getString('key', true);
  const discordId = interaction.user.id;

  await interaction.reply({ content: '🔑 Saving your Torn API key...', ephemeral: true });

  try {
    logInfo('Setting Discord API key via bot command', { discordId });

    // Fetch user profile from Torn API to validate the key and get user info
    let tornUserData: TornUserBasicResponse;
    try {
      const response = await axios.get<TornUserBasicResponse>(
        `https://api.torn.com/v2/user?selections=basic&key=${apiKey}`
      );
      tornUserData = response.data;
    } catch (error: any) {
      logError('Invalid Torn API key provided', error instanceof Error ? error : new Error(String(error)), {
        status: error.response?.status,
        discordId
      });
      await interaction.editReply({
        content: '❌ Failed to save your key. Please make sure it\'s valid and try again.',
      });
      return;
    }

    // Validate that the response has the expected structure
    if (!tornUserData || !tornUserData.profile || !tornUserData.profile.id) {
      logError('Invalid response from Torn API - missing profile data', new Error('Invalid API response structure'), {
        discordId,
        responseData: tornUserData
      });
      await interaction.editReply({
        content: '❌ Failed to save your key. Please make sure it\'s valid and try again.',
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

      logInfo('Updated existing Discord user via bot', {
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

      logInfo('Created new Discord user via bot', {
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

    await interaction.editReply({
      content: `✅ Your Torn API key was saved successfully.\nLinked to **${name}** (ID: ${tornId})`,
    });
  } catch (err) {
    logError('Error in /setkey command', err instanceof Error ? err : new Error(String(err)));
    await interaction.editReply({
      content: '❌ Failed to save your key. Please try again later.',
    });
  }
}

export default { data, execute };
