import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("minmaxunsub")
  .setDescription("Unsubscribe from daily minmax reminder notifications.");

export async function execute(interaction: any) {
  const discordId = interaction.user.id;

  await interaction.reply({ content: "⏳ Removing your minmax subscription...", ephemeral: true });

  try {
    const response = await fetch(`${process.env.API_BASE_URL}/api/discord/minmaxunsub`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.BOT_SECRET}`,
      },
      body: JSON.stringify({ discordId }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        await interaction.editReply({
          content: "❌ You don't have an active minmax subscription.\n\nUse `/minmaxsub` to create one.",
        });
        return;
      }
      throw new Error(data.error || "Failed to remove minmax subscription");
    }

    await interaction.editReply({
      content: "✅ **Minmax subscription removed successfully.**\n\nYou will no longer receive daily minmax reminders.\n\nTo subscribe again, use `/minmaxsub`",
    });
  } catch (err: any) {
    console.error("❌ Error in /minmaxunsub:", err);
    
    await interaction.editReply({
      content: "❌ Failed to remove minmax subscription. Please try again later.",
    });
  }
}

export default { data, execute };
