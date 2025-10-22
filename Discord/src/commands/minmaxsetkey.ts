import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("minmaxsetkey")
  .setDescription("Privately store your Torn API key for bot features.")
  .addStringOption(option =>
    option
      .setName("key")
      .setDescription("Your Torn API key (will be kept private).")
      .setRequired(true)
  );

export async function execute(interaction: any) {
  const apiKey = interaction.options.getString("key");
  const discordId = interaction.user.id;

  await interaction.reply({ content: "🔑 Saving your Torn API key...", ephemeral: true });

  try {
    const response = await fetch(`${process.env.API_BASE_URL}/api/discord/setkey`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.BOT_SECRET}`,
      },
      body: JSON.stringify({ discordId, apiKey }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to save API key");
    }

    await interaction.editReply({
      content: `✅ Your Torn API key was saved successfully.\nLinked to **${data.data.name}** (ID: ${data.data.tornId})`,
    });
  } catch (err) {
    console.error("❌ Error in /minmaxsetkey:", err);
    await interaction.editReply({
      content: "❌ Failed to save your key. Please make sure it’s valid and try again.",
    });
  }
}

export default { data, execute };
