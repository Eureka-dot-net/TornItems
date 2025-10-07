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

    // 🪙 Main money element — click to view best stock to BUY
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
          alert("No stock recommendations available right now.");
          return;
        }

        const bestStock = data[0];
        const stockUrl = `https://www.torn.com/page.php?sid=stocks&stockID=${bestStock.stock_id}&tab=owned`;
        console.log(`[TornHelperTools] Redirecting to best stock to BUY: ${bestStock.name}`);
        window.location.href = stockUrl;
      } catch (err) {
        console.error("[TornHelperTools] Failed to fetch recommendations:", err);
        alert("Error fetching stock recommendations. Check console for details.");
      }
    });

    // 🆕 Add [sell] link next to the money element
    if (!document.querySelector("#torn-sell-link")) {
      const sellLink = document.createElement("a");
      sellLink.id = "torn-sell-link";
      sellLink.textContent = " [sell]";
      sellLink.href = "#";
      sellLink.style.color = "#6cf";
      sellLink.style.cursor = "pointer";
      sellLink.style.textDecoration = "none";
      sellLink.title = "Click to view best stock to SELL 💸";

      // Hover style
      sellLink.addEventListener("mouseenter", () => (sellLink.style.textDecoration = "underline"));
      sellLink.addEventListener("mouseleave", () => (sellLink.style.textDecoration = "none"));

      // 🧭 Click handler — fetch your 'best to sell' API
      sellLink.addEventListener("click", async (e) => {
        e.preventDefault();
        console.log("[TornHelperTools] [sell] link clicked — fetching stock to sell");

        try {
          const res = await fetch("https://protective-donnamarie-hobbyprojectme-22661a0f.koyeb.app/api/stocks/recommendations/top-sell", {
            method: "GET",
            headers: { "Accept": "application/json" }
          });

          if (!res.ok) throw new Error(`Sell API request failed: ${res.status}`);

          const data = await res.json();
          if (!data || !data.stock_id) {
            alert("No suitable stock to sell found right now.");
            return;
          }

          const sellUrl = `https://www.torn.com/page.php?sid=stocks&stockID=${data.stock_id}&tab=owned&sellamount=${data.max_shares_to_sell}`;
          console.log(`[TornHelperTools] Redirecting to best stock to SELL: ${data.name}`);
          window.location.href = sellUrl;
        } catch (err) {
          console.error("[TornHelperTools] Failed to fetch stock to sell:", err);
          alert("Error fetching stock to sell. Check console for details.");
        }
      });

      // Add it next to the money
      el.insertAdjacentElement("afterend", sellLink);
      console.log("[TornHelperTools] Added [sell] link next to money");
    }
  };

  const moneyEl = await waitForMoneyEl();
  if (moneyEl) attachHandler(moneyEl);

  // Handle React re-renders
  const observer = new MutationObserver(() => {
    const el = document.querySelector("#user-money");
    if (el && !el.dataset.hooked) attachHandler(el);
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
