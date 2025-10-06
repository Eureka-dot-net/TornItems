(async () => {
  const url = new URL(window.location.href);
  const stockId = url.searchParams.get("stockID");
  const targetTabRaw = url.searchParams.get("tab") || "name";
  const targetTab = targetTabRaw.endsWith("Tab") ? targetTabRaw : `${targetTabRaw}Tab`;
  const sellAmount = url.searchParams.get("sellamount");
  if (!stockId) return;

  console.log(`[TornStockAutoTab] Preparing to open stock ${stockId} (${targetTab})`);

  // Wait until Torn has rendered at least one stock entry
  const waitForRender = () =>
    new Promise((resolve) => {
      const obs = new MutationObserver(() => {
        const el = document.querySelector('ul[role="tablist"] li[data-name]');
        if (el) {
          obs.disconnect();
          resolve();
        }
      });
      obs.observe(document.body, { childList: true, subtree: true });
    });

  await waitForRender();

  // Wait for browser idle
  await new Promise((resolve) => {
    if ("requestIdleCallback" in window) requestIdleCallback(resolve, { timeout: 2000 });
    else setTimeout(resolve, 1200);
  });

  console.log(`[TornStockAutoTab] Page settled; searching for stock ${stockId}`);

  const findStock = async () => {
    for (let i = 0; i < 80; i++) {
      const el = document.querySelector(`ul[id="${stockId}"][role="tablist"]`);
      if (el) return el;
      await new Promise((r) => setTimeout(r, 250));
    }
    return null;
  };

  const stockList = await findStock();
  if (!stockList) {
    console.warn(`[TornStockAutoTab] Could not locate stock ${stockId}`);
    return;
  }

  // Gentle scroll into view
  stockList.scrollIntoView({ behavior: "smooth", block: "center" });
  console.log(`[TornStockAutoTab] Scrolled to stock ${stockId}`);

  await new Promise((r) => setTimeout(r, 1000));

  // Click stock header to expand
  const header = stockList.querySelector('li[role="tab"]');
  if (header) {
    header.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    console.log(`[TornStockAutoTab] Expanded stock ${stockId}`);
  }

  // Wait for tabs to appear
  const waitForTabs = async () => {
    for (let i = 0; i < 30; i++) {
      const tab = stockList.querySelector(`[data-name="${targetTab}"]`);
      if (tab) return tab;
      await new Promise((r) => setTimeout(r, 200));
    }
    return null;
  };

  const tabEl = await waitForTabs();
  if (tabEl) {
    tabEl.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    console.log(`[TornStockAutoTab] Switched to "${targetTab}"`);
  } else {
    console.warn(`[TornStockAutoTab] Could not find tab "${targetTab}"`);
  }

  // If we’re on the Owned tab and have a sell amount, try to pre-fill
  if (targetTab === "ownedTab" && sellAmount) {
    console.log(`[TornStockAutoTab] Will pre-fill sell amount: ${sellAmount}`);

    // Wait for the sell block anywhere on the page (Torn mounts it globally)
    const waitForSellBlock = async () => {
      for (let i = 0; i < 80; i++) {
        const block = document.querySelector('.sellBlock___A_yTW');
        if (block) return block;
        await new Promise((r) => setTimeout(r, 200));
      }
      return null;
    };

    const sellBlock = await waitForSellBlock();
    if (!sellBlock) {
      console.warn(`[TornStockAutoTab] Could not find sell block (even globally)`);
      return;
    }

    // Find the visible editable input (ignore hidden ones)
    const inputs = Array.from(sellBlock.querySelectorAll('.input-money'));
    const input = inputs.find(inp => inp.type !== "hidden") || inputs[0];

    if (input) {
      // Ensure it's visible before editing (React sometimes hasn't bound it yet)
      await new Promise(r => setTimeout(r, 300));

      input.focus();
      input.value = sellAmount;
      input.setAttribute("value", sellAmount); // ensure both attributes updated
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));

      console.log(`[TornStockAutoTab] Pre-filled sell input with ${sellAmount}`);

      // Highlight visually
      input.style.outline = "2px solid gold";
      setTimeout(() => (input.style.outline = ""), 1200);
    } else {
      console.warn(`[TornStockAutoTab] Still no editable sell input found`);
    }
  }
})();
