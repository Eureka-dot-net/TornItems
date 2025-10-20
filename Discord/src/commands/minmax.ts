import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("minmax")
  .setDescription("Check daily task completion status (market items, xanax, energy refill).")
  .addIntegerOption(option =>
    option
      .setName("userid")
      .setDescription("Torn user ID to check (optional, defaults to yourself).")
      .setRequired(false)
  );

export async function execute(interaction: any) {
  const userId = interaction.options.getInteger("userid");
  const discordId = interaction.user.id;

  await interaction.reply({ content: "📊 Fetching daily task status...", ephemeral: true });

  try {
    const response = await fetch(`${process.env.API_BASE_URL}/api/discord/minmax`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.BOT_SECRET}`,
      },
      body: JSON.stringify({ discordId, userId }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to fetch minmax stats");
    }

    // Format the response
    const { cityItemsBought, xanaxTaken, energyRefill } = data.data;
    
    const itemsIcon = cityItemsBought.completed ? "✅" : "❌";
    const xanIcon = xanaxTaken.completed ? "✅" : "❌";
    const refillIcon = energyRefill.completed ? "✅" : "❌";

    const message = [
      `**Daily Task Completion${userId ? ` for User ID ${userId}` : ""}:**`,
      "",
      `${itemsIcon} **City Items Bought:** ${cityItemsBought.current}/${cityItemsBought.target}`,
      `${xanIcon} **Xanax Taken:** ${xanaxTaken.current}/${xanaxTaken.target}`,
      `${refillIcon} **Energy Refill:** ${energyRefill.current}/${energyRefill.target}`,
    ].join("\n");

    await interaction.editReply({
      content: message,
    });
  } catch (err: any) {
    console.error("❌ Error in /minmax:", err);
    
    let errorMessage = "❌ Failed to fetch daily task status.";
    if (err.message && err.message.includes("set your API key")) {
      errorMessage = "❌ You need to set your API key first.\nUse `/setkey` to store your Torn API key.";
    }
    
    await interaction.editReply({
      content: errorMessage,
    });
  }
}

export default { data, execute };
