// Load environment variables FIRST
import dotenv from 'dotenv';
dotenv.config();

import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v10';
import { readdirSync } from 'fs';
import { join } from 'path';

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

if (!TOKEN || !CLIENT_ID) {
  throw new Error('Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in .env');
}

const rest = new REST({ version: '10' }).setToken(TOKEN);

async function registerCommands() {
  const commands: any[] = [];
  
  // Load all command files
  const commandsPath = join(__dirname, 'discord/commands');
  const files = readdirSync(commandsPath);
  
  for (const file of files) {
    if (!file.endsWith('.js') && !file.endsWith('.ts')) continue;
    
    try {
      const commandModule = require(`./discord/commands/${file.replace(/\.ts$/, '')}`);
      const command = commandModule.default || commandModule;
      
      if (command.data) {
        commands.push(command.data.toJSON());
        console.log(`✅ Loaded command: ${command.data.name}`);
      }
    } catch (error) {
      console.error(`❌ Failed to load command ${file}:`, error);
    }
  }

  try {
    console.log(`📡 Registering ${commands.length} slash commands...`);

    if (GUILD_ID && CLIENT_ID) {
      // Guild commands (instant update for testing)
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
        body: commands,
      });
      console.log(`✅ Registered guild commands for ${GUILD_ID}`);
    } else if (CLIENT_ID) {
      // Global commands (takes up to 1 hour to show)
      await rest.put(Routes.applicationCommands(CLIENT_ID), {
        body: commands,
      });
      console.log('✅ Registered global commands');
    }
  } catch (err) {
    console.error('❌ Failed to register commands:', err);
  }
}

registerCommands();
