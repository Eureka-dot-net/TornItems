import { Client, Collection, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import { readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config();

// Restore __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Extend the Client type to include `commands`
declare module "discord.js" {
  interface Client {
    commands: Collection<string, any>;
  }
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.commands = new Collection();

// --- Dynamically load all command files (.js after build or .ts in dev) ---
const commandsPath = join(__dirname, "commands");
for (const file of readdirSync(commandsPath)) {
  if (!file.endsWith(".js") && !file.endsWith(".ts")) continue;

  // Dynamic import for ESM
  const { default: command } = await import(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

client.once("clientReady", () => {
  console.log(`🤖 Logged in as ${client.user?.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "❌ There was an error executing this command.",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "❌ There was an error executing this command.",
        ephemeral: true,
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
