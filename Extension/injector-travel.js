// injector-travel.js — unified, robust travel helper (with dynamic map countdown restored)
(async () => {
  const url = new URL(window.location.href);
  const params = {
    item1: url.searchParams.get("item1"),
    item2: url.searchParams.get("item2"),
    item3: url.searchParams.get("item3"),
    amount: url.searchParams.get("amount"),
    arrival: url.searchParams.get("arrival"),
    destination: url.searchParams.get("destination"),
    boardingtime: url.searchParams.get("boardingtime"),
  };

  const nowSec = () => Math.floor(Date.now() / 1000);

  // ───────────────────────────────
  // Notifications (desktop + Kiwi fallback)
  // ───────────────────────────────
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isKiwi = navigator.userAgent.includes("Kiwi");
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
        if (perm === "granted") new Notification(title, { body, icon: "https://www.torn.com/favicon.ico" });
      }
    } catch { }
  };

  console.log("[TornTravel] injector-travel loaded.");

  // ───────────────────────────────
  // MODE A — incoming flight (with item params)
  // ───────────────────────────────
  if (params.item1 && params.arrival) {
    console.log("[TornTravel] MODE A (incoming flight with shop params).");
    localStorage.setItem("torn_flyshop_args", JSON.stringify(params));
    const arrival = parseInt(params.arrival, 10);
    const waitMs = Math.max(0, (arrival - 5 - nowSec()) * 1000);
    const secs = Math.round(waitMs / 1000);
    console.log(`[TornAutoFlyBuy] Landing in ${secs}s — waiting...`);
    await notify("✈️ Torn Flight", `Landing in ${secs}s — auto-buy armed.`);
    await new Promise(r => setTimeout(r, waitMs));
    await notify("✈️ Torn Flight", "Arriving soon — shop automation will start on landing.");
    return;
  }

  // ───────────────────────────────
  // Countdown UI helper
  // ───────────────────────────────
  const runCountdown = (boardingEpoch, labelText) => {
    document.querySelectorAll("#tornCountdownBox").forEach(el => el.remove());
    const box = document.createElement("div");
    box.id = "tornCountdownBox";
    Object.assign(box.style, {
      position: "fixed",
      top: "10px",
      right: "10px",
      padding: "8px 12px",
      background: "rgba(0,0,0,0.7)",
      color: "#ffd700",
      borderRadius: "8px",
      fontFamily: "monospace",
      zIndex: "9999",
      transition: "background 0.3s",
    });
    document.body.appendChild(box);

    const fmt = (s) => (s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`);
    const tick = () => {
      const remain = Math.max(0, boardingEpoch - nowSec());
      if (remain <= 0) {
        box.textContent = `🛫 Ready to board${labelText ? ` (${labelText})` : ""}!`;
        box.style.background = "rgba(0,150,0,0.8)";
        clearInterval(timer);
      } else {
        box.textContent = `🕒 Boarding in ${fmt(remain)}${labelText ? ` (${labelText})` : ""}`;
        if (remain === 20) {
          box.style.background = "rgba(255,0,0,0.8)";
          notify("⏰ Boarding soon", `Boarding for ${labelText || "flight"} in 20 seconds!`);
        }
      }
    };
    const timer = setInterval(tick, 1000);
    tick();
  };

  // ───────────────────────────────
  // MODE B — waiting / pre-flight (explicit params)
  // ───────────────────────────────
  if (params.destination && params.boardingtime) {
    console.log("[TornTravel] MODE B (explicit destination + boardingtime).");
    const boarding = parseInt(params.boardingtime, 10);
    runCountdown(boarding, params.destination);
    return;
  }

  // ───────────────────────────────
  // MODE C — dynamic pre-flight (map pick): compute boarding so that
  // landing = first 15-min mark ≥ (now + flight time). Show countdown.
  // ───────────────────────────────
  console.log("[TornTravel] MODE C (dynamic map detection) — waiting for travel map/root...");

  const waitForTravelRoot = () =>
    new Promise((resolve) => {
      const check = () => {
        const root = document.querySelector("#travel-root");
        if (root) return resolve(root);
        requestAnimationFrame(check);
      };
      check();
    });

  const travelRoot = await waitForTravelRoot();
  console.log("[TornTravel] Travel map root detected.");

  const computeBoardingForPanel = () => {
    const panel = document.querySelector(".destinationPanel___LsJ4v");
    const openPin = document.querySelector('.pin___FilUD[data-is-tooltip-opened="true"]');
    if (!panel || !openPin) return null;

    const country = panel.querySelector(".country___wBPip")?.textContent?.trim();
    const timeText = panel.querySelector(".flightDetailsGrid___uAttX span[aria-hidden='true']")?.textContent?.trim();
    if (!country || !timeText || !timeText.includes(":")) return null;

    // parse "hh:mm" or "mm:ss" (Torn shows "00:18" etc.)

    // 🟢 Compute boarding so that *landing* hits the next 15-minute mark
    const parts = timeText.split(":").map(Number); // "mm:ss" or "hh:mm:ss"
    let flightMinutes = 0;
    if (parts.length === 2) flightMinutes = parts[0];                 // mm:ss → minutes
    else if (parts.length === 3) flightMinutes = parts[0] * 60 + parts[1]; // hh:mm:ss → minutes

    const nowDate = new Date();

    // Land if we left *now*
    const estLanding = new Date(nowDate.getTime() + flightMinutes * 60000);

    // Round *landing* up to next :00/:15/:30/:45
    const roundedLanding = new Date(estLanding);
    const mins = roundedLanding.getMinutes();
    const roundedMins = Math.ceil(mins / 15) * 15;
    roundedLanding.setMinutes(roundedMins, 0, 0);

    // Boarding = roundedLanding − flight duration
    const boarding = new Date(roundedLanding.getTime() - flightMinutes * 60000);
    const boardingEpoch = Math.floor(boarding.getTime() / 1000);


    console.log(`[TornTravel] Flight → ${country}, ~${flightMinutes} min`);
    console.log(`[TornTravel] Boarding: ${boarding.toLocaleTimeString()} | Landing: ${roundedLanding.toLocaleTimeString()}`);

    return { country, boardingEpoch };
  };

  const applyCountdownIfAvailable = () => {
    const result = computeBoardingForPanel();
    if (!result) return false;
    runCountdown(result.boardingEpoch, result.country);
    return true;
  };

  // Try immediately, then watch for changes
  const initialApplied = applyCountdownIfAvailable();
  const observer = new MutationObserver(() => applyCountdownIfAvailable());
  observer.observe(travelRoot, { childList: true, subtree: true });

  if (!initialApplied) {
    console.log("[TornTravel] Waiting for a destination pick to show flight details…");
  }

  // ───────────────────────────────
  // MODE D — in-flight auto-arming for Mexico (no params)
  // ───────────────────────────────
  const ARMED_KEY = "torn_flyshop_autoarmed";
  const MEXICO_ITEM_SET = { item1: "1429", item2: "258", item3: "259", amount: "19" };

  const parseRemaining = (container) => {
    const t = container.querySelector("time")?.textContent?.trim();
    let secs = 0;
    if (t && t.includes(":")) {
      const parts = t.split(":").map(Number); // hh:mm:ss or mm:ss
      if (parts.length === 3) secs = parts[0] * 3600 + parts[1] * 60 + parts[2];
      else if (parts.length === 2) secs = parts[0] * 60 + parts[1];
    }
    if (!secs) {
      const attr = container.querySelector("time")?.getAttribute("datetime") || "";
      const h = /(\d+)\s*h/.exec(attr)?.[1];
      const m = /(\d+)\s*m/.exec(attr)?.[1];
      const s = /(\d+)\s*s/.exec(attr)?.[1];
      secs = (h ? +h * 3600 : 0) + (m ? +m * 60 : 0) + (s ? +s : 0);
    }
    return secs || 0;
  };

  const armMexicoIfNeeded = () => {
    if (localStorage.getItem(ARMED_KEY)) return;

    const section = document.querySelector(".flightProgressSection___fhrD5");
    if (!section) return;

    const txt = (section.textContent || "").toLowerCase();
    if (!/ciudad juarez|mexico/.test(txt)) return;

    const remaining = parseRemaining(section);
    if (!remaining) return;

    const arrival = nowSec() + remaining - 1;
    const args = { ...MEXICO_ITEM_SET, arrival: String(arrival) };

    localStorage.setItem("torn_flyshop_args", JSON.stringify(args));
    localStorage.setItem(ARMED_KEY, String(arrival));

    console.log(`[TornTravel] Mexico flight detected. Remaining ${remaining}s → arrival ${arrival}`);
    notify("✈️ Torn Flight", "Auto-buy armed for Mexico. Shop will open on landing.");
  };

  armMexicoIfNeeded();
  const obs = new MutationObserver(() => { try { armMexicoIfNeeded(); } catch { } });
  obs.observe(document.body, { childList: true, subtree: true });

  const armedArrival = parseInt(localStorage.getItem(ARMED_KEY) || "0", 10);
  if (armedArrival) {
    const ms = Math.max(0, (armedArrival + 180 - nowSec()) * 1000);
    setTimeout(() => localStorage.removeItem(ARMED_KEY), ms);
  }
})();
