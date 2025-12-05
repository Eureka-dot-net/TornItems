import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, Colors } from 'discord.js';
import { logInfo, logError } from '../../utils/logger';
import { fetchMinMaxStatus } from '../../utils/minmaxHelper';
import { DiscordUser } from '../../models/DiscordUser';

export const data = new SlashCommandBuilder()
  .setName('minmax')
  .setDescription('Check daily task completion status (market items, xanax, energy refill, casino, wheels, etc).');

export async function execute(interaction: ChatInputCommandInteraction) {
  const discordId = interaction.user.id;

  await interaction.reply({ content: '📊 Fetching daily task status...', ephemeral: true });

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

    const allDailyDone = status.cityItemsBought.completed &&
      status.xanaxTaken.completed &&
      status.energyRefill.completed;

    const dailyTasks = [
      `${itemsIcon} **City Items Bought:** ${status.cityItemsBought.current}/${status.cityItemsBought.target}`,
      `${xanIcon} **Xanax Taken:** ${status.xanaxTaken.current}/${status.xanaxTaken.target}`,
      `${refillIcon} **Energy Refill:** ${status.energyRefill.current}/${status.energyRefill.target}`
    ].join('\n');

    const activities = [];
    if (status.education)
      activities.push(`${status.education.active ? '✅' : '❌'} **Education:** ${status.education.active ? 'Yes' : 'No'}`);
    if (status.investment)
      activities.push(`${status.investment.active ? '✅' : '❌'} **Investment:** ${status.investment.active ? 'Yes' : 'No'}`);
    if (status.virusCoding)
      activities.push(`${status.virusCoding.active ? '✅' : '❌'} **Virus Coding:** ${status.virusCoding.active ? 'Yes' : 'No'}`);
    if (status.factionOC)
      activities.push(`${status.factionOC.active ? '✅' : '❌'} **Faction OC:** ${status.factionOC.active ? 'Yes' : 'No'}`);
    if (status.skimmers) {
      const skimmerIcon = status.skimmers.completed ? '✅' : '❌';
      activities.push(`${skimmerIcon} **Skimmers:** ${status.skimmers.active}/${status.skimmers.target}`);
    }
    
    const casinoActivities = [];
    let needsFullKeyMessage = false;
    
    if (status.casinoTickets) {
      const ticketIcon = status.casinoTickets.completed ? '✅' : '❌';
      casinoActivities.push(`${ticketIcon} **Tokens Used:** ${status.casinoTickets.used}/${status.casinoTickets.target}`);
    } else if (user.apiKeyType !== 'full') {
      needsFullKeyMessage = true;
    }
    
    if (status.wheels) {
      const lameIcon = status.wheels.lame.spun ? '✅' : '❌';
      const mediocreIcon = status.wheels.mediocre.spun ? '✅' : '❌';
      const awesomenessIcon = status.wheels.awesomeness.spun ? '✅' : '❌';
      casinoActivities.push(`${lameIcon} **Wheel of Lame:** ${status.wheels.lame.spun ? 'Yes' : 'No'}`);
      casinoActivities.push(`${mediocreIcon} **Wheel of Mediocrity:** ${status.wheels.mediocre.spun ? 'Yes' : 'No'}`);
      casinoActivities.push(`${awesomenessIcon} **Wheel of Awesomeness:** ${status.wheels.awesomeness.spun ? 'Yes' : 'No'}`);
    } else if (user.apiKeyType !== 'full') {
      needsFullKeyMessage = true;
    }

    const embed = new EmbedBuilder()
      .setTitle('🧭 Daily Minmax Check')
      .setColor(allDailyDone ? Colors.Green : Colors.Orange)
      .addFields(
        {
          name: '📅 Daily Task Completion',
          value: dailyTasks,
          inline: false,
        },
        // 👇 Add a spacer field to visually separate sections
        {
          name: '',        // 👈 instead of \u200B
          value: '\u00A0', // 👈 non-breaking space
          inline: false,
        },
        ...(activities.length
          ? [{
            name: '⚙️ Active Activities',
            value: activities.join('\n'),
            inline: false,
          }]
          : []),
        ...(casinoActivities.length
          ? [
            {
              name: '',
              value: '\u00A0',
              inline: false,
            },
            {
              name: '🎰 Casino Activities',
              value: casinoActivities.join('\n'),
              inline: false,
            }
          ]
          : []),
        ...(needsFullKeyMessage
          ? [
            {
              name: '',
              value: '\u00A0',
              inline: false,
            },
            {
              name: 'ℹ️ Want Casino & Wheel Tracking?',
              value: 'To see casino tickets and wheel spin tracking, you need a **full API key**.\n\nRun `/minmaxsetkey` with a full API key to enable these features.',
              inline: false,
            }
          ]
          : [])
      )
      .setFooter({ text: 'Use /minmaxsub to get notified automatically each day.' });

    await interaction.editReply({ embeds: [embed] });
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
