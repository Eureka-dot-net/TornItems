import { REST, Routes } from "discord.js";
import { config } from "dotenv";
import { data as minMaxSetKeyCommand } from "./commands/minmaxsetkey.ts";
import { data as minMaxCommand } from "./commands/minmax.ts";

// Load your environment variables
config();

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.DISCORD_CLIENT_ID; // from Discord Developer Portal
const GUILD_ID = process.env.DISCORD_GUILD_ID; // optional (for faster testing)

if (!TOKEN || !CLIENT_ID || !GUILD_ID) {
  throw new Error("Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in .env");
}

const rest = new REST({ version: "10" }).setToken(TOKEN);

async function registerCommands() {
  const commands = [minMaxSetKeyCommand.toJSON(), minMaxCommand.toJSON()];

  try {
    console.log("📡 Registering slash commands...");

    // --- Option 1: Guild commands (instant update for testing) ---
    if (GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID!, GUILD_ID), {
        body: commands,
      });
      console.log(`✅ Registered guild commands for ${GUILD_ID}`);
    } else {
      // --- Option 2: Global commands (takes up to 1 hour to show) ---
      await rest.put(Routes.applicationCommands(CLIENT_ID!), {
        body: commands,
      });
      console.log("✅ Registered global commands");
    }
  } catch (err) {
    console.error("❌ Failed to register commands:", err);
  }
}

registerCommands();
