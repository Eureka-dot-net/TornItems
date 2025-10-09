// injector-flyshop.js (refill-aware with explicit timing notifications)
(async () => {
  const saved = localStorage.getItem("torn_flyshop_args");
  if (!saved) return;

  const { item1, item2, item3, amount } = JSON.parse(saved);
  const itemIds = [item1, item2, item3].filter(Boolean);
  const buyAmount = parseInt(amount || "19", 10);
  if (!itemIds.length) return;

  console.log(`[TornAutoFlyBuy] Monitoring ${itemIds.join(", ")} (amount=${buyAmount})`);

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isKiwi = navigator.userAgent.includes("Kiwi");

  // 🔔 Notification helper
  const notify = async (title, body) => {
    try {
      if (isMobile && isKiwi) {
        alert(`${title}\n\n${body}`);
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        return;
      }
      if (Notification.permission === "granted") {
        new Notification(title, { body, icon: "https://www.torn.com/favicon.ico" });
      } else if (Notification.permission !== "denied") {
        const perm = await Notification.requestPermission();
        if (perm === "granted")
          new Notification(title, { body, icon: "https://www.torn.com/favicon.ico" });
        else alert(`${title}\n\n${body}`);
      }
    } catch (err) {
      console.warn("[TornAutoFlyBuy] Notification failed:", err);
    }
  };

  // ✅ Helper to simulate proper Torn input typing
  const simulateTypingInput = (input, value) => {
    input.focus();
    input.value = "";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    const str = String(value);
    for (const char of str) {
      input.dispatchEvent(new KeyboardEvent("keydown", { key: char, bubbles: true }));
      input.value += char;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new KeyboardEvent("keyup", { key: char, bubbles: true }));
    }
    input.dispatchEvent(new Event("change", { bubbles: true }));
    console.log(`[TornAutoFlyBuy] Simulated typing ${value} into input`);
  };

  // --- Quarter mark detection ---
  const SEARCH_DURATION_MS = 13000;
  const SEARCH_DURATION_S = SEARCH_DURATION_MS / 1000;

  const nowDate = new Date();
  const totalSecs = nowDate.getMinutes() * 60 + nowDate.getSeconds();
  const blockPos = totalSecs % 900; // seconds into current 15min block
  const secsToMark = 900 - blockPos;
  const nearRefill = blockPos <= 30; // 0–30 s *after* mark only

  const nextMark = new Date(nowDate.getTime() + secsToMark * 1000);
  const nextMarkStr = nextMark.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  console.log(`[TornAutoFlyBuy] blockPos=${blockPos}s, secsToMark=${secsToMark}s → nearRefill=${nearRefill}`);

  // --- Wait quietly until next mark ---
  if (!nearRefill && blockPos >= 900 - SEARCH_DURATION_S) {
    const msToNextMark = secsToMark * 1000;
    console.log(`[TornAutoFlyBuy] Waiting ${(msToNextMark / 1000).toFixed(1)}s for next refill mark (${nextMarkStr})`);
    await notify("⏳ Torn Flight Shop", `Waiting ${(msToNextMark / 1000).toFixed(1)}s — next refill at ${nextMarkStr}`);
    await new Promise((r) => setTimeout(r, msToNextMark));
  }

  // --- Fallback phase ---
  const fallbackPhase = async () => {
    console.log("[TornAutoFlyBuy] Primary window expired — scanning backups once...");
    let foundItem = null, foundId = null;
    for (const id of [itemIds[1], itemIds[2]].filter(Boolean)) {
      const el = document.querySelector(`img.torn-item[src*="/images/items/${id}/"]`);
      if (el) {
        foundItem = el.closest(".item-info-wrap");
        foundId = id;
        break;
      }
    }

    if (foundItem) {
      const input = foundItem.querySelector(`input[id='item-${foundId}']`);
      if (input) {
        simulateTypingInput(input, buyAmount);
        console.log(`[TornAutoFlyBuy] Found fallback item ${foundId}, prefilled ${buyAmount}`);
        await notify("🛒 Torn Flight Shop", `Fallback item ${foundId} found — ${buyAmount} pre-filled!`);
      }
    } else {
      console.warn("[TornAutoFlyBuy] Nothing found — leave now!");
      await notify("⚠️ Torn Flight Shop", "No items available — leave immediately!");
    }

    localStorage.removeItem("torn_flyshop_endtime");
    localStorage.removeItem("torn_flyshop_args");
  };

  // --- Refresh logic ---
  const now = Date.now();
  let endTime = parseInt(localStorage.getItem("torn_flyshop_endtime") || "0", 10);

  if (!endTime || !Number.isFinite(endTime)) {
    endTime = now + SEARCH_DURATION_MS;
    localStorage.setItem("torn_flyshop_endtime", String(endTime));
    const startTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    await notify("⚡ Torn Flight Shop", `Starting refresh at ${startTime} — focusing on primary item!`);
  }

  // --- Primary item search ---
  const primaryId = itemIds[0];
  const foundPrimary = document.querySelector(`img.torn-item[src*="/images/items/${primaryId}/"]`);
  if (foundPrimary) {
    const el = foundPrimary.closest(".item-info-wrap");
    const input = el?.querySelector(`input[id='item-${primaryId}']`);
    if (input) {
      simulateTypingInput(input, buyAmount);
      console.log(`[TornAutoFlyBuy] Found primary item ${primaryId}, prefilled ${buyAmount}`);
      await notify("🛒 Torn Flight Shop", `Primary item ${primaryId} found — ${buyAmount} pre-filled!`);
    }
    localStorage.removeItem("torn_flyshop_endtime");
    localStorage.removeItem("torn_flyshop_args");
    return;
  }

  // --- Refresh within window ---
  const remaining = endTime - Date.now();
  if (remaining > 0 && nearRefill) {
    const nextDelay = Math.min(remaining, 200 + Math.random() * 200);
    console.log(`[TornAutoFlyBuy] Primary not found — reloading (${(remaining / 1000).toFixed(2)}s left)`);
    setTimeout(() => window.location.reload(), nextDelay);
    return;
  }

  // --- Outside window: one-time scan ---
  if (!nearRefill) {
    console.log("[TornAutoFlyBuy] Outside refill window — single scan only.");
    await fallbackPhase();
    return;
  }

  // --- Time’s up ---
  await fallbackPhase();
})();
