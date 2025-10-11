// injector-travel.js — fully restored (Modes A–D intact) + stronger observer patch
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
  // Countdown UI helper  (patched for background-tab accuracy)
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

    let notified60 = false;
    let notified20 = false;

    const fmt = (s) => (s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`);

    const loop = () => {
      const remain = Math.max(0, boardingEpoch - nowSec());
      if (remain <= 0) {
        box.textContent = `🛫 Ready to board${labelText ? ` (${labelText})` : ""}!`;
        box.style.background = "rgba(0,150,0,0.8)";
        return; // stop
      }

      box.textContent = `🕒 Boarding in ${fmt(remain)}${labelText ? ` (${labelText})` : ""}`;

      if (remain <= 60 && !notified60) {
        notified60 = true;
        box.style.background = "rgba(255,0,0,0.8)";
        notify("⏰ Boarding in one minute", `Boarding for ${labelText || "flight"} in 60 seconds!`);
      }
      if (remain <= 20 && !notified20) {
        notified20 = true;
        box.style.background = "rgba(255,0,0,0.8)";
        notify("⏰ Boarding soon", `Boarding for ${labelText || "flight"} in 20 seconds!`);
      }

      // next loop aligned to wall clock
      const nextDelay = 1000 - (Date.now() % 1000);
      setTimeout(loop, nextDelay);
    };

    loop();
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
  // MODE C — dynamic pre-flight (map pick)
  // Landing = first 15-min mark ≥ (now + flight time)
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

    const parts = timeText.split(":").map(Number);
    let flightMinutes = 0;

    // Torn normally uses mm:ss or hh:mm
    if (parts.length === 2) {
      const [a, b] = parts;
      flightMinutes = a * 60 + b;
    } else if (parts.length === 3) {
      const [h, m, s] = parts;
      flightMinutes = h * 60 + m;
    } else return null;

    // ✅ Compute so that we LAND on the next 15-minute mark
    const nowDate = new Date();
    const estLanding = new Date(nowDate.getTime() + flightMinutes * 60000);
    let roundedLanding = new Date(estLanding);
    let mins = roundedLanding.getMinutes();
    let roundedMins = Math.ceil(mins / 15) * 15;
    roundedLanding.setMinutes(roundedMins, 0, 0);

    // Boarding = roundedLanding − flight duration
    let boarding = new Date(roundedLanding.getTime() - flightMinutes * 60000);

    // ⚠️ If boarding time is in the past, push landing to the *next* 15-min mark
    if (boarding <= nowDate) {
      roundedLanding = new Date(roundedLanding.getTime() + 15 * 60000);
      boarding = new Date(roundedLanding.getTime() - flightMinutes * 60000);
    }

    const boardingEpoch = Math.floor(boarding.getTime() / 1000);

    console.log(`[TornTravel] Flight → ${country}, ~${flightMinutes} min`);
    console.log(`[TornTravel] ✅ Landing aligned to ${roundedLanding.toLocaleTimeString()} (15-minute mark)`);
    console.log(`[TornTravel] Boarding at ${boarding.toLocaleTimeString()}`);

    return { country, boardingEpoch };
  };

  const applyCountdownIfAvailable = () => {
    const result = computeBoardingForPanel();
    if (!result) return false;
    runCountdown(result.boardingEpoch, result.country);
    return true;
  };

  const initialApplied = applyCountdownIfAvailable();
  const observerC = new MutationObserver(() => applyCountdownIfAvailable());
  observerC.observe(travelRoot, { childList: true, subtree: true });

  if (!initialApplied) {
    console.log("[TornTravel] Waiting for a destination pick to show flight details…");
  }

  // ───────────────────────────────
  // MODE D — in-flight auto-arming for Mexico (no params)
  // ───────────────────────────────
  const ARMED_KEY = "torn_flyshop_autoarmed";
  const DESTINATIONS = {
    "mexico": { item1: "1429", item2: "258", item3: "259", amount: "19" },
    "ciudad juarez": { item1: "1429", item2: "258", item3: "259", amount: "19" },
    "uk": { item1: "268", item2: "266", item3: "267", amount: "18" },
    "london": { item1: "268", item2: "266", item3: "267", amount: "19" },
    "toronto": { item1: "1361", item2: "261", item3: "263", amount: "19" },
  };

  const parseRemaining = (container) => {
    const t = container.querySelector("time")?.textContent?.trim();
    let secs = 0;
    if (t && t.includes(":")) {
      const parts = t.split(":").map(Number);
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

    // ✅ Only match if destination comes AFTER "to" (not flying back to Torn)
    const toMatch = txt.match(/to\s+([^.]+)/);
    if (!toMatch) return;
    const destination = toMatch[1].trim();

    const matchedKey = Object.keys(DESTINATIONS).find(k => destination.includes(k));
    if (!matchedKey) return;

    const ITEM_SET = DESTINATIONS[matchedKey];

    const remaining = parseRemaining(section);
    if (!remaining) return;

    const arrival = nowSec() + remaining - 1;
    const args = { ...ITEM_SET, arrival: String(arrival) };
    localStorage.setItem("torn_flyshop_args", JSON.stringify(args));
    localStorage.setItem(ARMED_KEY, String(arrival));

    console.log(`[TornTravel] ${matchedKey} flight detected. Remaining ${remaining}s → arrival ${arrival}`);
    notify("✈️ Torn Flight", `Auto-buy armed for ${matchedKey}. Shop will open on landing.`);
  };

  // 🩵 Strengthened observer patch (robust detection)
  armMexicoIfNeeded();
  const watchTargets = [document.body, document.querySelector("#travel-root")].filter(Boolean);
  for (const target of watchTargets) {
    const observer = new MutationObserver(() => {
      try { armMexicoIfNeeded(); } catch { }
    });
    observer.observe(target, { childList: true, subtree: true });
  }
  setInterval(() => {
    try { armMexicoIfNeeded(); } catch { }
  }, 2000);

  const armedArrival = parseInt(localStorage.getItem(ARMED_KEY) || "0", 10);
  if (armedArrival) {
    const ms = Math.max(0, (armedArrival + 180 - nowSec()) * 1000);
    setTimeout(() => localStorage.removeItem(ARMED_KEY), ms);
  }
})();
