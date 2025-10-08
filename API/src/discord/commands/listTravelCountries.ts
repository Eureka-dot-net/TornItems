import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { TravelTime } from '../../models/TravelTime';
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

export const data = new SlashCommandBuilder()
  .setName('listtravelcountries')
  .setDescription('List all available countries for travel notifications.');

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true });

  try {
    // Fetch travel times from database to show which countries are available
    const travelTimes = await TravelTime.find().lean();
    
    // Create a map of country codes to travel times
    const travelTimeMap = new Map<string, number>();
    for (const travelTime of travelTimes) {
      travelTimeMap.set(travelTime.countryCode, travelTime.travelTimeMinutes);
    }

    // Build message with all available countries
    let message = '✈️ **Available Countries for Travel Notifications**\n\n';
    message += 'You can set up travel notifications for these countries:\n\n';

    const sortedCountries = Object.entries(COUNTRY_CODE_MAP).sort(([, nameA], [, nameB]) => 
      nameA.localeCompare(nameB)
    );

    for (const [code, name] of sortedCountries) {
      const travelTime = travelTimeMap.get(code);
      if (travelTime !== undefined) {
        message += `• **${name}** - ${travelTime} minutes travel time\n`;
      } else {
        message += `• **${name}**\n`;
      }
    }

    message += '\n**To set up a notification:**\n';
    message += '```\n/notifytravel <country> [seconds_before] [has_private_island] [watch_items...]\n```\n';
    message += '\n**Examples:**\n';
    message += '• `/notifytravel Mexico` - Basic notification\n';
    message += '• `/notifytravel Japan 10 true` - With private island\n';
    message += '• `/notifytravel China 15 false 1429 258 259` - With watch items\n';

    await interaction.editReply({
      content: message,
    });

    logInfo('Listed travel countries', {
      discordUserId: interaction.user.id,
    });
  } catch (err) {
    logError('Error in /listtravelcountries command', err instanceof Error ? err : new Error(String(err)));
    await interaction.editReply({
      content: '❌ Failed to list travel countries. Please try again later.',
    });
  }
}

export default { data, execute };
