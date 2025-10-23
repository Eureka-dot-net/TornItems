import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("minmaxsub")
  .setDescription("Subscribe to daily minmax reminder notifications before server reset.")
  .addIntegerOption(option =>
    option
      .setName("hours-before-reset")
      .setDescription("Hours before UTC midnight (server reset) to notify you")
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(23)
  )
  .addBooleanOption(option =>
    option
      .setName("notifyeducation")
      .setDescription("Notify if not enrolled in education (default: true)")
      .setRequired(false)
  )
  .addBooleanOption(option =>
    option
      .setName("notifyinvestment")
      .setDescription("Notify if not invested in city bank (default: true)")
      .setRequired(false)
  )
  .addBooleanOption(option =>
    option
      .setName("notifyvirus")
      .setDescription("Notify if not coding a virus (default: true)")
      .setRequired(false)
  );

export async function execute(interaction: any) {
  const hoursBeforeReset = interaction.options.getInteger("hours-before-reset");
  const notifyEducation = interaction.options.getBoolean("notifyeducation");
  const notifyInvestment = interaction.options.getBoolean("notifyinvestment");
  const notifyVirus = interaction.options.getBoolean("notifyvirus");
  const discordId = interaction.user.id;
  const channelId = interaction.channelId;

  await interaction.reply({ content: "⏳ Setting up your minmax subscription...", ephemeral: true });

  try {
    const response = await fetch(`${process.env.API_BASE_URL}/api/discord/minmaxsub`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.BOT_SECRET}`,
      },
      body: JSON.stringify({ 
        discordId, 
        channelId,
        hoursBeforeReset,
        notifyEducation: notifyEducation !== null ? notifyEducation : true,
        notifyInvestment: notifyInvestment !== null ? notifyInvestment : true,
        notifyVirus: notifyVirus !== null ? notifyVirus : true
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || "Failed to set minmax subscription");
    }

    // Calculate notification time
    const notificationHour = (24 - hoursBeforeReset) % 24;
    const notificationTimeStr = `${notificationHour.toString().padStart(2, '0')}:00 UTC`;

    // Build notification settings message
    const notificationSettings = [];
    if (data.data.notifyEducation) notificationSettings.push("Education");
    if (data.data.notifyInvestment) notificationSettings.push("Investment");
    if (data.data.notifyVirus) notificationSettings.push("Virus Coding");

    const message = [
      `✅ **Minmax Subscription Active**`,
      "",
      `📅 **Notification Time:** ${notificationTimeStr} (${hoursBeforeReset} hours before reset)`,
      `📍 **Channel:** <#${channelId}>`,
      "",
      `**What we'll check:**`,
      `• ✅ City items bought (100/day)`,
      `• ✅ Energy refills (1/day)`,
      notificationSettings.length > 0 ? `• ✅ Activities: ${notificationSettings.join(", ")}` : "",
      "",
      `You'll receive ONE notification per day if you haven't completed these tasks.`,
      ``,
      `To unsubscribe, use \`/minmaxunsub\``
    ].filter(line => line !== "").join("\n");

    await interaction.editReply({
      content: message,
    });
  } catch (err: any) {
    console.error("❌ Error in /minmaxsub:", err);
    
    let errorMessage = "❌ Failed to set up minmax subscription.";
    if (err.message && err.message.includes("set your API key")) {
      errorMessage = "❌ You need to set your API key first.\nUse `/minmaxsetkey` to store your Torn API key.\n\n**Note:** Please use a limited API key for security purposes.";
    }
    
    await interaction.editReply({
      content: errorMessage,
    });
  }
}

export default { data, execute };
