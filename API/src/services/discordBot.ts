import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import { logInfo, logError } from '../utils/logger';

// Extend the Client type to include `commands`
declare module 'discord.js' {
  interface Client {
    commands: Collection<string, any>;
  }
}

let discordClient: Client | null = null;

/**
 * Initialize and start the Discord bot
 */
export async function startDiscordBot(): Promise<void> {
  const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
  
  if (!DISCORD_TOKEN) {
    logInfo('Discord bot not starting - DISCORD_TOKEN not set');
    return;
  }

  try {
    logInfo('Starting Discord bot...');
    
    const client = new Client({
      intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
    });

    client.commands = new Collection();

    // Dynamically load all command files
    const commandsPath = join(__dirname, '../discord/commands');
    try {
      const files = readdirSync(commandsPath);
      
      for (const file of files) {
        if (!file.endsWith('.js') && !file.endsWith('.ts')) continue;

        try {
          // Use require for CommonJS compatibility
          const commandModule = require(`../discord/commands/${file.replace(/\.ts$/, '')}`);
          const command = commandModule.default || commandModule;
          
          if (command.data && command.execute) {
            client.commands.set(command.data.name, command);
            logInfo(`Loaded Discord command: ${command.data.name}`);
          }
        } catch (error) {
          logError(`Failed to load command ${file}`, error instanceof Error ? error : new Error(String(error)));
        }
      }
    } catch (error) {
      logError('Failed to read commands directory', error instanceof Error ? error : new Error(String(error)));
    }

    client.once('ready', () => {
      logInfo(`Discord bot logged in as ${client.user?.tag}`);
    });

    client.on('interactionCreate', async (interaction) => {
      if (!interaction.isChatInputCommand()) return;

      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        logError('Error executing Discord command', error instanceof Error ? error : new Error(String(error)));
        
        const errorMessage = '❌ There was an error executing this command.';
        
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: errorMessage,
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content: errorMessage,
            ephemeral: true,
          });
        }
      }
    });

    await client.login(DISCORD_TOKEN);
    discordClient = client;
    
    logInfo('Discord bot started successfully');
  } catch (error) {
    logError('Failed to start Discord bot', error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Get the Discord client instance
 */
export function getDiscordClient(): Client | null {
  return discordClient;
}
