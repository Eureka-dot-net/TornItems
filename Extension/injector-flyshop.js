// injector-flyshop.js
(async () => {
  const saved = localStorage.getItem("torn_flyshop_args");
  if (!saved) return;

  const { item1, item2, item3, amount, arrival } = JSON.parse(saved);
  const itemIds = [item1, item2, item3].filter(Boolean);
  const buyAmount = parseInt(amount || "1", 10);
  if (!itemIds.length) return;

  // Prevent it from running too early
  const now = Math.floor(Date.now() / 1000);
  if (arrival && now < arrival - 10) return;

  console.log(`[TornAutoFlyBuy] Starting monitoring for ${itemIds.join(", ")} (amount=${buyAmount})`);

  const findItem = () => {
    for (const id of itemIds) {
      const item = document.querySelector(`img.torn-item[src*="/images/items/${id}/"]`);
      if (item) return { id, el: item.closest(".item-info-wrap") };
    }
    return null;
  };

  const found = findItem();
  if (!found) {
    console.warn("[TornAutoFlyBuy] No items found, refreshing...");
    setTimeout(() => window.location.reload(), Math.random() * 400);
    return;
  }

  const { id, el } = found;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  el.style.outline = "3px solid gold";
  setTimeout(() => (el.style.outline = ""), 1500);

  const input = el.querySelector(`input[id='item-${id}']`);
  if (input) {
    input.value = buyAmount;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    console.log(`[TornAutoFlyBuy] Pre-filled item ${id} with amount ${buyAmount}`);
  }

  try {
    if (Notification.permission === "granted") {
      new Notification("✈️ Torn Flight Shop", {
        body: `Item ${id} ready — ${buyAmount} prefilled!`,
        icon: "https://www.torn.com/favicon.ico",
      });
    }
  } catch {}

  // Clean up after running
  localStorage.removeItem("torn_flyshop_args");
})();
