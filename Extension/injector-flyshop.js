// injector-flyshop.js
(async () => {
  const url = new URL(window.location.href);
  const amount = parseInt(url.searchParams.get("amount") || "1", 10);
  const itemIds = [url.searchParams.get("item1"), url.searchParams.get("item2"), url.searchParams.get("item3")].filter(Boolean);
  const arrival = parseInt(url.searchParams.get("arrival") || "0", 10);
  if (itemIds.length === 0) return;

  console.log(`[TornAutoFlyBuy] Watching for items: ${itemIds.join(", ")} (amount=${amount})`);
  console.log(`[TornAutoFlyBuy] Arrival timestamp: ${arrival}`);

  // --- Optional delay before monitoring ---
  if (arrival > 0) {
    const now = Math.floor(Date.now() / 1000);
    const monitorStart = arrival - 5; // start monitoring 5s before landing
    const delayMs = Math.max(0, (monitorStart - now) * 1000);
    if (delayMs > 0) {
      console.log(`[TornAutoFlyBuy] Waiting ${Math.round(delayMs / 1000)}s before monitoring...`);

      // Initial notification
      try {
        if (Notification.permission === "granted") {
          new Notification("✈️ Torn Flight Prep", {
            body: `Monitoring will begin in ${Math.round(delayMs / 1000)}s.`,
            icon: "https://www.torn.com/favicon.ico",
          });
        } else if (Notification.permission !== "denied") {
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            new Notification("✈️ Torn Flight Prep", {
              body: `Monitoring will begin in ${Math.round(delayMs / 1000)}s.`,
              icon: "https://www.torn.com/favicon.ico",
            });
          }
        }
      } catch (err) {
        console.warn("[TornAutoFlyBuy] Prep notification failed:", err);
      }

      await new Promise((r) => setTimeout(r, delayMs));
      console.log("[TornAutoFlyBuy] Starting monitoring now!");
    }
  }

  const findItem = () => {
    for (const id of itemIds) {
      const item = document.querySelector(`img.torn-item[src*="/images/items/${id}/"]`);
      if (item) return { id, el: item.closest(".item-info-wrap") };
    }
    return null;
  };

  let found = findItem();
  if (!found) {
    console.warn("[TornAutoFlyBuy] No items found, refreshing...");
    setTimeout(() => window.location.reload(), Math.random() * 400);
    return;
  }

  const { id, el } = found;
  console.log(`[TornAutoFlyBuy] Found item ${id}`);

  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.style.outline = "3px solid gold";
  setTimeout(() => (el.style.outline = ""), 1500);

  const input = el.querySelector(`input[id="item-${id}"]`);
  if (input) {
    input.value = amount;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    console.log(`[TornAutoFlyBuy] Pre-filled item ${id} with amount ${amount}`);
  } else {
    console.warn("[TornAutoFlyBuy] Could not find input for item", id);
  }

  try {
    if (Notification.permission === "granted") {
      new Notification("✈️ Torn Flight Shop", {
        body: `Item ${id} is available — ${amount} ready to buy!`,
        icon: "https://www.torn.com/favicon.ico",
      });
    } else if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        new Notification("✈️ Torn Flight Shop", {
          body: `Item ${id} is available — ${amount} ready to buy!`,
          icon: "https://www.torn.com/favicon.ico",
        });
      }
    }
  } catch (err) {
    console.warn("[TornAutoFlyBuy] Notification failed:", err);
  }
})();
