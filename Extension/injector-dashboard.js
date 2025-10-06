// injector-dashboard.js
(async () => {
  console.log("[TornHelperTools] Dashboard injector active");

  const waitForMoneyEl = async () => {
    for (let i = 0; i < 50; i++) {
      const el = document.querySelector("#user-money");
      if (el) return el;
      await new Promise((r) => setTimeout(r, 200));
    }
    return null;
  };

  const attachHandler = (el) => {
    if (el.dataset.hooked) return; // prevent double hooking
    el.dataset.hooked = "true";
    el.style.cursor = "pointer";
    el.title = "Click to view your best stock pick 💰";

    el.addEventListener("click", async () => {
      console.log("[TornHelperTools] Money clicked — fetching stock recommendations");

      try {
        const response = await fetch("https://protective-donnamarie-hobbyprojectme-22661a0f.koyeb.app/api/stocks/recommendations", {
          method: "GET",
          headers: { "Accept": "application/json" }
        });

        if (!response.ok) throw new Error(`API request failed: ${response.status}`);

        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
          console.warn("[TornHelperTools] No recommendations returned");
          alert("No stock recommendations available right now.");
          return;
        }

        const bestStock = data[0];
        console.log(`[TornHelperTools] Redirecting to best stock: ${bestStock.name} (${bestStock.ticker})`);
        
        const stockUrl = `https://www.torn.com/page.php?sid=stocks&stockID=${bestStock.stock_id}&tab=owned`;
        window.location.href = stockUrl;
      } catch (err) {
        console.error("[TornHelperTools] Failed to fetch recommendations:", err);
        alert("Error fetching stock recommendations. Check console for details.");
      }
    });
  };

  const moneyEl = await waitForMoneyEl();
  if (moneyEl) {
    attachHandler(moneyEl);
  }

  // Handle re-rendering (React refresh)
  const observer = new MutationObserver(() => {
    const el = document.querySelector("#user-money");
    if (el && !el.dataset.hooked) attachHandler(el);
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
