import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { TravelNotification } from '../../models/TravelNotification';
import { DiscordUser } from '../../models/DiscordUser';
import { logInfo, logError } from '../../utils/logger';

const COUNTRY_CODE_MAP: Record<string, string> = {
  mex: 'Mexico',
  can: 'Canada',
  haw: 'Hawaii',
  jap: 'Japan',
  chi: 'China',
  arg: 'Argentina',
  uni: 'United Kingdom',
  uae: 'UAE',
  sou: 'South Africa',
  cay: 'Cayman Islands',
  swi: 'Switzerland',
};

const COUNTRY_NAME_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRY_CODE_MAP).map(([code, name]) => [name.toLowerCase(), code])
);

export const data = new SlashCommandBuilder()
  .setName('disabletravelnotification')
  .setDescription('Disable a travel notification for a specific country.')
  .addStringOption(option =>
    option
      .setName('country')
      .setDescription('Destination country (e.g., Mexico, Canada, Japan)')
      .setRequired(true)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const countryInput = interaction.options.getString('country', true).trim();
  const discordUserId = interaction.user.id;

  await interaction.deferReply({ ephemeral: true });

  try {
    // Check if user has registered their API key
    const user = await DiscordUser.findOne({ discordId: discordUserId });
    
    if (!user) {
      await interaction.editReply({
        content: '❌ You must first set your API key using `/setkey` before managing travel notifications.',
      });
      return;
    }

    // Convert country name to code
    const countryCode = COUNTRY_NAME_TO_CODE[countryInput.toLowerCase()];
    
    if (!countryCode) {
      const validCountries = Object.values(COUNTRY_CODE_MAP).join(', ');
      await interaction.editReply({
        content: `❌ Invalid country: "${countryInput}"\n\nValid countries: ${validCountries}`,
      });
      return;
    }

    // Find and disable the notification
    const notification = await TravelNotification.findOne({ 
      discordUserId, 
      countryCode 
    });

    if (!notification) {
      await interaction.editReply({
        content: `❌ You don't have a travel notification set up for ${COUNTRY_CODE_MAP[countryCode]}.`,
      });
      return;
    }

    notification.enabled = false;
    await notification.save();

    await interaction.editReply({
      content: `✅ Disabled travel notification for **${COUNTRY_CODE_MAP[countryCode]}**.\n\nYou can re-enable it by running \`/notifytravel ${COUNTRY_CODE_MAP[countryCode]}\`.`,
    });

    logInfo('Disabled travel notification', {
      discordUserId,
      countryCode,
    });
  } catch (err) {
    logError('Error in /disabletravelnotification command', err instanceof Error ? err : new Error(String(err)));
    await interaction.editReply({
      content: '❌ Failed to disable travel notification. Please try again later.',
    });
  }
}

export default { data, execute };
