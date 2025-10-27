import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { ChainWatch } from '../../models/ChainWatch';
import { DiscordUser } from '../../models/DiscordUser';
import { decrypt } from '../../utils/encryption';
import { logInfo, logError } from '../../utils/logger';
import axios from 'axios';
import { logApiCall } from '../../utils/apiCallLogger';

export const data = new SlashCommandBuilder()
  .setName('watchchain')
  .setDescription('Get notified when your faction chain timeout is low.')
  .addIntegerOption(option =>
    option
      .setName('secondsbeforefail')
      .setDescription('Notify when chain timeout is below this many seconds')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(600)
  );

// Response format for user faction API
interface UserFactionResponse {
  faction?: {
    id: number;
    name: string;
    tag: string;
    tag_image: string;
    position: string;
    days_in_faction: number;
  };
  error?: {
    code: number;
    error: string;
  };
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const secondsBeforeFail = interaction.options.getInteger('secondsbeforefail', true);
  const discordUserId = interaction.user.id;
  const channelId = interaction.channelId;

  await interaction.deferReply();

  try {
    // Check if user has registered their API key
    const user = await DiscordUser.findOne({ discordId: discordUserId });

    if (!user || !user.apiKey) {
      await interaction.editReply({
        content: '❌ You must first set your API key using `/minmaxsetkey` before setting up chain notifications.',
      });
      return;
    }

    // Decrypt the API key
    const apiKey = decrypt(user.apiKey);

    // Fetch user's faction information
    let factionId: number;
    try {
      const response = await axios.get<UserFactionResponse>(
        `https://api.torn.com/v2/user/faction?key=${apiKey}`
      );
      
      await logApiCall('user/faction', 'watchchain-command');

      if (response.data.error) {
        throw new Error(`Torn API error: ${response.data.error.error}`);
      }

      if (!response.data.faction || !response.data.faction.id) {
        await interaction.editReply({
          content: '❌ You are not in a faction. You must be in a faction to use chain notifications.',
        });
        return;
      }

      factionId = response.data.faction.id;
      
      // Update user's faction ID in the database
      user.factionId = factionId;
      await user.save();

      logInfo('Updated user faction ID', {
        discordId: discordUserId,
        tornId: user.tornId,
        factionId
      });
    } catch (error: any) {
      logError('Failed to fetch user faction', error instanceof Error ? error : new Error(String(error)), {
        discordUserId
      });
      
      await interaction.editReply({
        content: '❌ Failed to fetch your faction information from Torn API. Please try again later.',
      });
      return;
    }

    // Check if chain watch already exists
    let chainWatch = await ChainWatch.findOne({ discordId: discordUserId });

    if (chainWatch) {
      // Update existing chain watch
      chainWatch.channelId = channelId;
      chainWatch.secondsBeforeFail = secondsBeforeFail;
      chainWatch.factionId = factionId;
      chainWatch.enabled = true;
      await chainWatch.save();

      logInfo('Updated chain watch', {
        discordUserId,
        channelId,
        secondsBeforeFail,
        factionId
      });
    } else {
      // Create new chain watch
      chainWatch = new ChainWatch({
        discordId: discordUserId,
        channelId,
        secondsBeforeFail,
        factionId,
        enabled: true,
      });
      await chainWatch.save();

      logInfo('Created chain watch', {
        discordUserId,
        channelId,
        secondsBeforeFail,
        factionId
      });
    }

    await interaction.editReply({
      content: `✅ **Chain Watch Enabled**\n\n` +
        `You will be notified in <#${channelId}> when your faction's chain timeout is below **${secondsBeforeFail} seconds**.\n\n` +
        `Please do not rely on this value alone to maintain your faction chain. Always monitor your chain status actively.\n\n` +
        `Run \`/watchchain\` again to update your settings or disable with \`/disablewatchchain\`.`
    });
  } catch (err) {
    logError('Error in /watchchain command', err instanceof Error ? err : new Error(String(err)));

    await interaction.editReply({
      content: '❌ Failed to set up chain notifications. Please try again later.',
    });
  }
}

export default { data, execute };
