(async () => {
  const url = new URL(window.location.href);
  const stockId = url.searchParams.get("stockID");
  const targetTabRaw = url.searchParams.get("tab") || "name";
  const targetTab = targetTabRaw.endsWith("Tab") ? targetTabRaw : `${targetTabRaw}Tab`;
  const sellAmount = url.searchParams.get("sellamount");
  if (!stockId) return;

  console.log(`[TornStockHighlight] Preparing to locate stock ${stockId}`);

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

  // Let page stabilize
  await new Promise((resolve) => {
    if ("requestIdleCallback" in window) requestIdleCallback(resolve, { timeout: 2000 });
    else setTimeout(resolve, 1200);
  });

  console.log(`[TornStockHighlight] Page settled; searching for stock ${stockId}`);

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
    console.warn(`[TornStockHighlight] Could not locate stock ${stockId}`);
    return;
  }

  // 🔽 Gentle scroll into view (kept)
  stockList.scrollIntoView({ behavior: "smooth", block: "center" });
  console.log(`[TornStockHighlight] Scrolled to stock ${stockId}`);

  // Small delay to let scroll finish
  await new Promise((r) => setTimeout(r, 1000));

  // 🟡 NEW: Highlight instead of selecting — PERMANENT
  stockList.style.outline = "2px solid gold";
  stockList.style.boxShadow = "0 0 12px rgba(255, 215, 0, 0.8)";
  console.log(`[TornStockHighlight] Highlighted stock ${stockId}`);

  // ❌ REMOVED: automatic header click
  // ❌ REMOVED: automatic tab click
  // ❌ REMOVED: automatic value typing
  // (We keep everything else intact)

})();
