(async () => {
  const saved = localStorage.getItem("torn_flyshop_args");
  if (!saved) return;

  const { item1, item2, item3, amount } = JSON.parse(saved);
  const itemIds = [item1, item2, item3].filter(Boolean);
  const buyAmount = parseInt(amount || "19", 10); // ✅ default to 19
  if (!itemIds.length) return;

  console.log(`[TornAutoFlyBuy] Monitoring for ${itemIds.join(", ")} (amount=${buyAmount})`);

  // 🔔 Notification helper
  const notify = async (title, body) => {
    try {
      if (Notification.permission === "granted") {
        new Notification(title, { body, icon: "https://www.torn.com/favicon.ico" });
      } else if (Notification.permission !== "denied") {
        const perm = await Notification.requestPermission();
        if (perm === "granted") new Notification(title, { body, icon: "https://www.torn.com/favicon.ico" });
      }
    } catch (err) {
      console.warn("[TornAutoFlyBuy] Notification failed:", err);
    }
  };

  notify("✈️ Torn Flight Shop", "Monitoring started — ready to check incoming stock!");

  // --- Phase 1: Try item1 for up to 10s ---
  const searchForItem = async (id, durationMs = 10000) => {
    const start = Date.now();
    while (Date.now() - start < durationMs) {
      const item = document.querySelector(`img.torn-item[src*="/images/items/${id}/"]`);
      if (item) return item.closest(".item-info-wrap");
      await new Promise((r) => setTimeout(r, 250));
    }
    return null;
  };

  let foundItem = null;
  let foundId = null;

  if (itemIds[0]) {
    console.log(`[TornAutoFlyBuy] Searching for primary item ${itemIds[0]}...`);
    foundItem = await searchForItem(itemIds[0]);
    foundId = itemIds[0];
  }

  // --- Phase 2: Quick fallback scan if primary failed ---
  if (!foundItem && (itemIds[1] || itemIds[2])) {
    console.log("[TornAutoFlyBuy] Primary item not found — quick fallback scan...");
    for (const id of [itemIds[1], itemIds[2]].filter(Boolean)) {
      const el = document.querySelector(`img.torn-item[src*="/images/items/${id}/"]`);
      if (el) {
        foundItem = el.closest(".item-info-wrap");
        foundId = id;
        break;
      }
    }
  }

  // --- Handle result ---
  if (!foundItem) {
    console.warn("[TornAutoFlyBuy] No items found — leave now!");
    notify("⚠️ Torn Flight Shop", "No items available — leave immediately!");
    localStorage.removeItem("torn_flyshop_args");
    return;
  }

  // Highlight + prefill
  foundItem.scrollIntoView({ behavior: "smooth", block: "center" });
  foundItem.style.outline = "3px solid gold";
  setTimeout(() => (foundItem.style.outline = ""), 1500);

  const input = foundItem.querySelector(`input[id='item-${foundId}']`);
  if (input) {
    input.value = buyAmount;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    console.log(`[TornAutoFlyBuy] Found item ${foundId}, prefilled ${buyAmount}`);
    notify("🛒 Torn Flight Shop", `Item ${foundId} found — ${buyAmount} pre-filled!`);
  } else {
    console.warn(`[TornAutoFlyBuy] Found item ${foundId} but input not detected`);
  }

  localStorage.removeItem("torn_flyshop_args");
})();
