// injector-flyshop.js (aggressive restock-aware with safety timer)
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

  // 🕐 Safety Timer Overlay
  const createSafetyTimer = () => {
    const startTime = Date.now();
    const timerDiv = document.createElement("div");
    timerDiv.id = "torn-safety-timer";
    timerDiv.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 20px;
      font-weight: bold;
      z-index: 999999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    `;
    document.body.appendChild(timerDiv);

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      timerDiv.textContent = `${elapsed}s`;
      
      if (elapsed <= 10) {
        timerDiv.style.background = "rgba(34, 197, 94, 0.9)"; // green
      } else if (elapsed <= 15) {
        timerDiv.style.background = "rgba(249, 115, 22, 0.9)"; // orange
      } else {
        timerDiv.style.background = "rgba(239, 68, 68, 0.9)"; // red
      }
    };

    updateTimer();
    setInterval(updateTimer, 1000);
  };
  createSafetyTimer();

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

  // --- Timing calculations ---
  const AGGRESSIVE_WINDOW_MS = 10000; // 10 seconds of aggressive refreshing
  const PRE_RESTOCK_WINDOW_S = 30; // Wait if within 30s before restock

  const nowDate = new Date();
  const totalSecs = nowDate.getMinutes() * 60 + nowDate.getSeconds();
  const blockPos = totalSecs % 900; // seconds into current 15min block
  const secsToMark = 900 - blockPos;

  const nextMark = new Date(nowDate.getTime() + secsToMark * 1000);
  const nextMarkStr = nextMark.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  console.log(`[TornAutoFlyBuy] blockPos=${blockPos}s, secsToMark=${secsToMark}s, nextMark=${nextMarkStr}`);

  // --- Strategy decision ---
  const justAfterRestock = blockPos <= 10; // 0-10s after a restock mark
  const nearRestock = secsToMark <= PRE_RESTOCK_WINDOW_S; // within 30s before next restock
  const tooFarAway = blockPos > 10 && secsToMark > PRE_RESTOCK_WINDOW_S; // more than 30s from any restock

  // CASE 1: Just after restock - aggressive refresh mode
  if (justAfterRestock) {
    console.log(`[TornAutoFlyBuy] Just after restock (${blockPos}s) - entering aggressive mode`);
    
    let endTime = parseInt(localStorage.getItem("torn_flyshop_endtime") || "0", 10);
    const now = Date.now();

    if (!endTime || !Number.isFinite(endTime)) {
      endTime = now + AGGRESSIVE_WINDOW_MS;
      localStorage.setItem("torn_flyshop_endtime", String(endTime));
      await notify("⚡ Torn Flight Shop", `Aggressive refresh started! Looking for item ${itemIds[0]}`);
    }

    // Check for primary item
    const primaryId = itemIds[0];
    const foundPrimary = document.querySelector(`img.torn-item[src*="/images/items/${primaryId}/"]`);
    if (foundPrimary) {
      const el = foundPrimary.closest(".item-info-wrap");
      const input = el?.querySelector(`input[id='item-${primaryId}']`);
      if (input) {
        simulateTypingInput(input, buyAmount);
        console.log(`[TornAutoFlyBuy] ✅ Primary item ${primaryId} found!`);
        await notify("🎯 Torn Flight Shop", `Primary item ${primaryId} found — ${buyAmount} pre-filled! GET OUT NOW!`);
        localStorage.removeItem("torn_flyshop_endtime");
        localStorage.removeItem("torn_flyshop_args");
        return;
      }
    }

    // Still within aggressive window - keep refreshing
    const remaining = endTime - Date.now();
    if (remaining > 0) {
      const nextDelay = 200 + Math.random() * 200; // 200-400ms
      console.log(`[TornAutoFlyBuy] Primary not found - refreshing (${(remaining / 1000).toFixed(1)}s left)`);
      setTimeout(() => window.location.reload(), nextDelay);
      return;
    }

    // Aggressive window expired - check backups once
    console.log("[TornAutoFlyBuy] Aggressive window expired - checking backups");
    for (const id of [itemIds[1], itemIds[2]].filter(Boolean)) {
      const el = document.querySelector(`img.torn-item[src*="/images/items/${id}/"]`);
      if (el) {
        const foundItem = el.closest(".item-info-wrap");
        const input = foundItem?.querySelector(`input[id='item-${id}']`);
        if (input) {
          simulateTypingInput(input, buyAmount);
          console.log(`[TornAutoFlyBuy] ✅ Backup item ${id} found!`);
          await notify("🛒 Torn Flight Shop", `Backup item ${id} found — ${buyAmount} pre-filled! Leave now!`);
          localStorage.removeItem("torn_flyshop_endtime");
          localStorage.removeItem("torn_flyshop_args");
          return;
        }
      }
    }

    console.warn("[TornAutoFlyBuy] Nothing found - LEAVE NOW!");
    await notify("⚠️ Torn Flight Shop", "Nothing available — LEAVE IMMEDIATELY!");
    localStorage.removeItem("torn_flyshop_endtime");
    localStorage.removeItem("torn_flyshop_args");
    return;
  }

  // CASE 3: Outside restock window - single scan only
  if (tooFarAway) {
    console.log(`[TornAutoFlyBuy] Too far from restock (${blockPos}s in, ${secsToMark}s away) - single scan only`);
    await notify("🔍 Torn Flight Shop", `Checking for items (single scan)... Next restock at ${nextMarkStr}`);

    for (const id of itemIds) {
      const el = document.querySelector(`img.torn-item[src*="/images/items/${id}/"]`);
      if (el) {
        const foundItem = el.closest(".item-info-wrap");
        const input = foundItem?.querySelector(`input[id='item-${id}']`);
        if (input) {
          simulateTypingInput(input, buyAmount);
          console.log(`[TornAutoFlyBuy] ✅ Found item ${id} in single scan!`);
          await notify("🛒 Torn Flight Shop", `Item ${id} found — ${buyAmount} pre-filled! Buy and leave!`);
          localStorage.removeItem("torn_flyshop_endtime");
          localStorage.removeItem("torn_flyshop_args");
          return;
        }
      }
    }

    console.warn(`[TornAutoFlyBuy] No items in stock - leave! Next restock at ${nextMarkStr}`);
    await notify("❌ Torn Flight Shop", `Nothing in stock. Next restock at ${nextMarkStr}`);
    localStorage.removeItem("torn_flyshop_endtime");
    localStorage.removeItem("torn_flyshop_args");
    return;
  }

  // CASE 2: Within 30s before restock - wait for it
  if (nearRestock) {
    const msToWait = secsToMark * 1000;
    console.log(`[TornAutoFlyBuy] Waiting ${secsToMark}s for restock at ${nextMarkStr}`);
    await notify("⏳ Torn Flight Shop", `Waiting ${secsToMark}s for restock at ${nextMarkStr} — stay ready!`);
    
    setTimeout(() => {
      console.log("[TornAutoFlyBuy] Restock time reached - reloading!");
      window.location.reload();
    }, msToWait);
    return;
  }

  // CASE 4: 11-30s after restock - single scan (stock likely picked over)
  console.log(`[TornAutoFlyBuy] ${blockPos}s after restock - single scan only`);
  await notify("🔍 Torn Flight Shop", "Checking for items (single scan)...");

  for (const id of itemIds) {
    const el = document.querySelector(`img.torn-item[src*="/images/items/${id}/"]`);
    if (el) {
      const foundItem = el.closest(".item-info-wrap");
      const input = foundItem?.querySelector(`input[id='item-${id}']`);
      if (input) {
        simulateTypingInput(input, buyAmount);
        console.log(`[TornAutoFlyBuy] ✅ Found item ${id} in single scan!`);
        await notify("🛒 Torn Flight Shop", `Item ${id} found — ${buyAmount} pre-filled! Buy and leave!`);
        localStorage.removeItem("torn_flyshop_endtime");
        localStorage.removeItem("torn_flyshop_args");
        return;
      }
    }
  }

  console.warn("[TornAutoFlyBuy] No items in stock - leave!");
  await notify("❌ Torn Flight Shop", `Nothing in stock. Next restock at ${nextMarkStr}`);
  localStorage.removeItem("torn_flyshop_endtime");
  localStorage.removeItem("torn_flyshop_args");
})();