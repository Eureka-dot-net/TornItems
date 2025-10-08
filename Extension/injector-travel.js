// injector-travel.js
(async () => {
  const url = new URL(window.location.href);
  const params = {
    item1: url.searchParams.get("item1"),
    item2: url.searchParams.get("item2"),
    item3: url.searchParams.get("item3"),
    amount: url.searchParams.get("amount"),
    arrival: url.searchParams.get("arrival"),
  };
  if (!params.item1 || !params.arrival) return;

  localStorage.setItem("torn_flyshop_args", JSON.stringify(params));
  console.log("[TornAutoFlyBuy] Stored flight shop params", params);

  const arrival = parseInt(params.arrival, 10);
  const now = Math.floor(Date.now() / 1000);
  const waitMs = Math.max(0, (arrival - 5 - now) * 1000);

  const notify = (msg) => {
    try {
      if (Notification.permission === "granted") new Notification("✈️ Torn Flight", { body: msg, icon: "https://www.torn.com/favicon.ico" });
      else if (Notification.permission !== "denied") Notification.requestPermission().then((p) => {
        if (p === "granted") new Notification("✈️ Torn Flight", { body: msg, icon: "https://www.torn.com/favicon.ico" });
      });
    } catch {}
  };

  notify(`Landing in ${Math.round(waitMs / 1000)}s — auto-buy armed.`);
  await new Promise((r) => setTimeout(r, waitMs));
  notify("Arriving soon — shop automation will start on landing.");
})();
