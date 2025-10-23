import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { logInfo, logError } from '../../utils/logger';
import { fetchMinMaxStatus } from '../../utils/minmaxHelper';
import { DiscordUser } from '../../models/DiscordUser';

export const data = new SlashCommandBuilder()
  .setName('minmax')
  .setDescription('Check daily task completion status (market items, xanax, energy refill).');

export async function execute(interaction: ChatInputCommandInteraction) {
  const discordId = interaction.user.id;

  await interaction.reply({ content: '📊 Fetching daily task status...' });

  try {
    logInfo('Fetching minmax stats via bot command', { discordId });

    // Check if user has API key
    const user = await DiscordUser.findOne({ discordId });
    
    if (!user || !user.apiKey) {
      await interaction.editReply({
        content: '❌ You need to set your API key first.\nUse `/minmaxsetkey` to store your Torn API key.\n\n**Note:** Please use a limited API key to ensure you can get current data.',
      });
      return;
    }

    // Use helper function to fetch minmax status
    const status = await fetchMinMaxStatus(discordId, undefined, true);

    // Format the response
    const itemsIcon = status.cityItemsBought.completed ? '✅' : '❌';
    const xanIcon = status.xanaxTaken.completed ? '✅' : '❌';
    const refillIcon = status.energyRefill.completed ? '✅' : '❌';

    const messageParts = [
      `**Daily Task Completion:**`,
      `${itemsIcon} **City Items Bought:** ${status.cityItemsBought.current}/${status.cityItemsBought.target}`,
      `${xanIcon} **Xanax Taken:** ${status.xanaxTaken.current}/${status.xanaxTaken.target}`,
      `${refillIcon} **Energy Refill:** ${status.energyRefill.current}/${status.energyRefill.target}`,
    ];

    // Add activity data if available
    if (status.education || status.investment || status.virusCoding) {
      messageParts.push('');
      messageParts.push('**Active Activities:**');

      if (status.education) {
        const educationIcon = status.education.active ? '✅' : '❌';
        messageParts.push(`${educationIcon} **Education:** ${status.education.active ? 'Yes' : 'No'}`);
      }

      if (status.investment) {
        const investmentIcon = status.investment.active ? '✅' : '❌';
        messageParts.push(`${investmentIcon} **Investment:** ${status.investment.active ? 'Yes' : 'No'}`);
      }

      if (status.virusCoding) {
        const virusIcon = status.virusCoding.active ? '✅' : '❌';
        messageParts.push(`${virusIcon} **Virus Coding:** ${status.virusCoding.active ? 'Yes' : 'No'}`);
      }
    }

    const message = messageParts.join('\n');

    await interaction.editReply({
      content: message,
    });
  } catch (err) {
    logError('Error in /minmax command', err instanceof Error ? err : new Error(String(err)));
    
    let errorMessage = '❌ Failed to fetch daily task status. Please try again later.';
    if (err instanceof Error && err.message === 'User has not set their API key') {
      errorMessage = '❌ You need to set your API key first.\nUse `/minmaxsetkey` to store your Torn API key.';
    }
    
    await interaction.editReply({
      content: errorMessage,
    });
  }
}

export default { data, execute };
