// injector-shops.js
(async () => {
  const url = new URL(window.location.href);
  const itemId = url.searchParams.get("itemid");
  const buyAmount = url.searchParams.get("buyAmount") || url.searchParams.get("buyamount") || "1";
  if (!itemId) return;

  console.log(`[TornShopAutoBuy] Preparing to open item ${itemId}`);

  // ✅ Detect platform
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isKiwi = navigator.userAgent.includes("Kiwi");

  // 🔔 Notification helper (desktop + mobile fallback)
  const notify = async (title, body) => {
    try {
      if (isMobile && isKiwi) {
        // On mobile, ensure we don't miss it
        alert(`${title}\n\n${body}`);
        if (navigator.vibrate) navigator.vibrate([150, 100, 150]); // optional vibration
        return;
      }

      if (Notification.permission === "granted") {
        new Notification(title, { body, icon: "https://www.torn.com/favicon.ico" });
      } else if (Notification.permission !== "denied") {
        const perm = await Notification.requestPermission();
        if (perm === "granted") {
          new Notification(title, { body, icon: "https://www.torn.com/favicon.ico" });
        } else {
          alert(`${title}\n\n${body}`);
        }
      }
    } catch (err) {
      console.warn("[TornShopAutoBuy] Notification failed:", err);
      alert(`${title}\n\n${body}`);
    }
  };

  // Wait until the shop list has rendered at least one item
  const waitForShopRender = () =>
    new Promise((resolve) => {
      const obs = new MutationObserver(() => {
        const el = document.querySelector(".item[itemid]");
        if (el) {
          obs.disconnect();
          resolve();
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });
    });

  await waitForShopRender();

  // Wait for idle to avoid React conflicts
  await new Promise((r) =>
    "requestIdleCallback" in window ? requestIdleCallback(r, { timeout: 2000 }) : setTimeout(r, 1200)
  );

  console.log(`[TornShopAutoBuy] Page settled; searching for item ${itemId}`);

  // Try to find the item in the DOM
  const findItem = async () => {
    for (let i = 0; i < 5; i++) {
      const el = document.querySelector(`.item[itemid="${itemId}"]`);
      if (el) return el;
      await new Promise((r) => setTimeout(r, 300));
    }
    return null;
  };

  const item = await findItem();

  if (!item) {
    console.warn(`[TornShopAutoBuy] Item ${itemId} not found — refreshing soon...`);
    const delay = Math.random() * 500;
    console.log(`[TornShopAutoBuy] Will reload in ${(delay / 1000).toFixed(1)}s`);
    setTimeout(() => {
      const currentUrl = new URL(window.location.href);
      window.location.href = currentUrl.toString(); // reload same URL
    }, delay);
    return;
  }

  // Scroll to the item for visibility
  item.scrollIntoView({ behavior: "smooth", block: "center" });
  console.log(`[TornShopAutoBuy] Scrolled to item ${itemId}`);

  // Click the trolley (buy-info) to open the buy box
  const trolleyBtn = item.querySelector(".buy-info");
  if (trolleyBtn) {
    trolleyBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    console.log(`[TornShopAutoBuy] Clicked trolley for item ${itemId}`);
  } else {
    console.warn(`[TornShopAutoBuy] Could not find buy-info button`);
    return;
  }

  // Wait for the buy input to appear
  const waitForInput = async () => {
    for (let i = 0; i < 40; i++) {
      const input = document.querySelector(`input[id='${itemId}']`);
      if (input && input.offsetParent !== null) return input;
      await new Promise((r) => setTimeout(r, 200));
    }
    return null;
  };

  const input = await waitForInput();
  if (input) {
    input.focus();
    input.value = buyAmount;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    console.log(`[TornShopAutoBuy] Pre-filled item ${itemId} with amount ${buyAmount}`);

    input.style.outline = "2px solid gold";
    setTimeout(() => (input.style.outline = ""), 1500);

    await notify("🛒 Torn Shop Alert", `Item ${itemId} is now available! (${buyAmount} prefilled)`);
  } else {
    console.warn(`[TornShopAutoBuy] Could not find visible buy input`);
  }
})();
