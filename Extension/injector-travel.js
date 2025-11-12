// injector-travel.js — MODE C (robust) — countdown + checklist + OC timing + energy/nerve prediction
(() => {
  // ─────────────────────────────────────────
  // Tiny DOM helpers
  // ─────────────────────────────────────────
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const cc = (frag) => `[class*="${frag}"]`;            // "class contains" selector
  const txt = (el) => (el ? (el.textContent || "").trim() : "");

  // ─────────────────────────────────────────
  // Stat + sidebar helpers
  // ─────────────────────────────────────────
  function findBarValueByLabel(label) {
    const nameNodes = $$(cc("bar-name"));
    const node = nameNodes.find(n => txt(n).toLowerCase().startsWith(label.toLowerCase()));
    if (!node) return null;
    const container = node.closest(cc("bar___")) || node.parentElement;
    const valueNode = container ? $(cc("bar-value"), container) : null;
    return valueNode ? txt(valueNode) : null;
  }
  function parseCurMax(str) {
    if (!str || !str.includes("/")) return null;
    const [a, b] = str.split("/").map(x => parseInt(x.replace(/\D+/g, ""), 10));
    if (!Number.isFinite(a) || !Number.isFinite(b) || b <= 0) return null;
    return { cur: a, max: b, ratio: a / b };
  }
  function detectFlags() {
    const icon = (needle) => $(`ul${cc("status-icons")} li a[aria-label*="${needle}"]`);
    const bazaarEl   = icon("Bazaar");
    const education  = icon("Education");
    const boosterCd  = icon("Booster Cooldown");
    const drugCd     = icon("Drug Cooldown");
    const ocCountdown = txt($("#oc2Timer .countdown"));
    const energy = parseCurMax(findBarValueByLabel("Energy:"));
    const nerve  = parseCurMax(findBarValueByLabel("Nerve:"));
    const life   = parseCurMax(findBarValueByLabel("Life:"));
    return {
      bazaarOpen: !!bazaarEl,
      educationActive: !!education,
      boosterCooldown: !!boosterCd,
      drugCooldown: !!drugCd,
      ocJoined: ocCountdown && !/No crime joined/i.test(ocCountdown),
      ocText: ocCountdown || "",
      energy, nerve, life
    };
  }

  // ─────────────────────────────────────────
  // Flight time + countdown
  // ─────────────────────────────────────────
  // Parses "00:18" or "01:20:00" into minutes (round up if seconds > 0)
  function parseFlightMinutesFromText(timeText) {
    if (!timeText || !timeText.includes(":")) return 0;
    const parts = timeText.split(":").map(Number);
    if (parts.length === 2) {
      const [m, s] = parts;
      return m + (s > 0 ? 1 : 0);
    }
    if (parts.length === 3) {
      const [h, m, s] = parts;
      return h * 60 + m + (s > 0 ? 1 : 0);
    }
    return 0;
  }

  // Find the visible "Flight Time - <span aria-hidden='true'>00:18</span>" after a pin click
  function getFlightMinutesFromDOM() {
    // Look for a segment that includes the plane icon + the time span
    const segments = $$(cc("segment"));
    for (const seg of segments) {
      if (!$(cc("planeIcon"), seg)) continue;
      // Prefer aria-hidden time
      const t = $("span[aria-hidden='true']", seg) || null;
      const val = txt(t);
      const mins = parseFlightMinutesFromText(val);
      if (mins > 0) return mins;
    }
    return 0;
  }

  // Compute aligned boarding for “land on 15-min mark”, then subtract flight time
  function computeBoarding(flightMinutes) {
    if (!flightMinutes) return null;
    const now = new Date();
    const estLanding = new Date(now.getTime() + flightMinutes * 60_000);
    const aligned = new Date(estLanding);
    const mins = aligned.getMinutes();
    const roundedMins = Math.ceil(mins / 15) * 15;
    aligned.setMinutes(roundedMins % 60, 0, 0);
    if (roundedMins >= 60) aligned.setHours(aligned.getHours() + 1);

    let boarding = new Date(aligned.getTime() - flightMinutes * 60_000);
    if (boarding <= now) {
      const nextAligned = new Date(aligned.getTime() + 15 * 60_000);
      boarding = new Date(nextAligned.getTime() - flightMinutes * 60_000);
    }
    return Math.floor(boarding.getTime() / 1000);
  }

  // ─────────────────────────────────────────
  // Overlay UI
  // ─────────────────────────────────────────
  function makeOverlay() {
    const box = document.createElement("div");
    box.id = "torn-travel-overlay";
    box.style.cssText = `
      position:fixed;top:10px;right:10px;width:320px;max-height:70vh;overflow:auto;
      padding:10px 12px;background:rgba(0,0,0,.85);color:#eee;border-radius:10px;
      font-family:monospace;font-size:13px;line-height:1.35;z-index:999999;
      box-shadow:0 6px 16px rgba(0,0,0,.5);backdrop-filter:blur(2px);
      transition:opacity .3s, transform .3s;
    `;
    const header = document.createElement("div");
    header.id = "torn-travel-countdown";
    header.style.cssText = `
      font-weight:700;font-size:14px;padding:8px;margin:-4px -4px 8px -4px;
      border-radius:8px;text-align:right;background:rgba(0,0,0,.3);color:#ffd700;
    `;
    const list = document.createElement("div");
    list.id = "torn-travel-checklist";
    list.style.cssText = `display:grid;gap:6px;`;
    const hr = document.createElement("div");
    hr.style.cssText = `height:1px;background:rgba(255,255,255,.12);margin:6px 0;`;
    box.appendChild(header); box.appendChild(hr); box.appendChild(list);
    document.body.appendChild(box);
    return { box, header, list };
  }
  function makeToggleButton(overlayBox) {
    const btn = document.createElement("button");
    btn.textContent = "⚙️";
    btn.title = "Show/Hide Pre-flight Checklist";
    btn.style.cssText = `
      position:fixed;top:10px;right:10px;width:36px;height:36px;border:none;
      border-radius:50%;background:rgba(0,0,0,.6);color:#ffd700;font-size:18px;
      cursor:pointer;z-index:1000000;box-shadow:0 4px 12px rgba(0,0,0,.4);
    `;
    btn.addEventListener("click", () => {
      const hidden = overlayBox.style.opacity === "0";
      overlayBox.style.opacity = hidden ? "1" : "0";
      overlayBox.style.transform = hidden ? "translateY(0)" : "translateY(-10px)";
      overlayBox.style.pointerEvents = hidden ? "auto" : "none";
    });
    document.body.appendChild(btn);
  }
  function addRow(listEl, label, status = "neutral", detail = "") {
    const row = document.createElement("div");
    row.style.cssText = `display:flex;justify-content:space-between;align-items:center;padding:6px 8px;border-radius:8px;`;
    const left = document.createElement("div"); left.textContent = label;
    const right = document.createElement("div"); right.textContent = detail;
    const colors = {
      good:{ bg:"rgba(22,163,74,.20)", fg:"#c6f6d5" },
      warn:{ bg:"rgba(249,115,22,.20)", fg:"#ffd7b5" },
      bad: { bg:"rgba(239,68,68,.20)",  fg:"#fecaca" },
      neutral:{ bg:"rgba(255,255,255,.05)", fg:"#ddd" },
    };
    const c = colors[status] || colors.neutral;
    row.style.background = c.bg; row.style.color = c.fg;
    row.appendChild(left); if (detail) { right.style.opacity = ".9"; row.appendChild(right); }
    listEl.appendChild(row);
  }

  // Countdown (with guard to avoid multiple intervals)
  let countdownTimer = null;
  function clearCountdown() { if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; } }
  function fmtSecs(s) { s = Math.max(0, Math.floor(s)); const m = Math.floor(s/60), sec = s%60; return `${m}:${String(sec).padStart(2,"0")}`; }
  function setHeaderUrgency(el, secs) {
    if (secs <= 0)       el.style.background = "rgba(22,163,74,.85)";
    else if (secs <= 30) el.style.background = "rgba(249,115,22,.85)";
    else                 el.style.background = "rgba(0,0,0,.3)";
  }
  function runCountdown(el, boardingEpoch, label="") {
    clearCountdown();
    const tick = () => {
      const now = Math.floor(Date.now()/1000);
      const remain = Math.max(0, boardingEpoch - now);
      setHeaderUrgency(el, remain);
      el.textContent = remain <= 0
        ? `🛫 Ready to board${label ? ` — ${label}` : ""}!`
        : `🕒 Boarding in ${fmtSecs(remain)}${label ? ` — ${label}` : ""}`;
    };
    tick();
    countdownTimer = setInterval(tick, 1000);
  }

  // ─────────────────────────────────────────
  // Prediction helpers (Energy/Nerve)
  // ─────────────────────────────────────────
  function predictRegen(stat, flightMinutes, ratePerMin) {
    if (!stat) return { status: "warn", text: "Unknown" };
    const roundTripMins = flightMinutes * 2 + 15;         // out + back + 15m align
    const regen = roundTripMins * ratePerMin;
    const predicted = stat.cur + regen;
    if (predicted < stat.max) {
      return { status: "good", text: `Safe (+${Math.round(regen)} → ${Math.round(predicted)}/${stat.max})` };
    }
    const lost = predicted - stat.max;
    const sev = lost < 10 ? "warn" : "bad";
    return { status: sev, text: `Will cap (+${Math.round(lost)} wasted)` };
  }

  // ─────────────────────────────────────────
  // OC API
  // ─────────────────────────────────────────
  async function fetchOrganizedCrime(apiKey) {
    try {
      const res = await fetch(`https://api.torn.com/v2/user/organizedcrime?key=${apiKey}`);
      const data = await res.json();
      if (!data || !data.organizedCrime) return null;
      const oc = data.organizedCrime;
      const endsAt = oc.ready_at || oc.executed_at || oc.expired_at || null; // unix seconds
      return { status: oc.status, endsAt };
    } catch { return null; }
  }

  // ─────────────────────────────────────────
  // Boot
  // ─────────────────────────────────────────
  (async () => {
    // Skip when actually in-flight
    const travelingTitle = $$("h4").find(h => txt(h) === "Traveling");
    if (travelingTitle) return;

    // Wait for travel UI container to exist
    function waitForTravelRoot() {
      return new Promise(resolve => {
        const check = () => { const root = $("#travel-root"); if (root) return resolve(root); requestAnimationFrame(check); };
        check();
      });
    }
    const travelRoot = await waitForTravelRoot();

    const overlay = makeOverlay();
    makeToggleButton(overlay.box);

    // First pass: before clicking a destination, no flight time is present
    overlay.header.textContent = "Select a destination on the map…";

    // Render checklist once, then we’ll re-render when flight time appears
    function renderAll(flightMinutes) {
      const flags = detectFlags();
      overlay.list.innerHTML = "";

      // Top block: basics
      addRow(overlay.list, "Bazaar open",       flags.bazaarOpen      ? "good" : "warn", flags.bazaarOpen ? "Yes" : "Check");
      addRow(overlay.list, "Education active",  flags.educationActive ? "good" : "warn", flags.educationActive ? "Yes" : "No");
      addRow(overlay.list, "Booster cooldown",  flags.boosterCooldown ? "good" : "warn", flags.boosterCooldown ? "Active" : "None");
      addRow(overlay.list, "Drug cooldown",     flags.drugCooldown    ? "good" : "warn", flags.drugCooldown ? "Active" : "None");

      // Predictions (only if we have a flight selected)
      if (flightMinutes && flightMinutes > 0) {
        const e = predictRegen(flags.energy, flightMinutes, 0.5);
        const n = predictRegen(flags.nerve,  flightMinutes, 0.2);
        addRow(overlay.list, "Energy on return", e.status, e.text);
        addRow(overlay.list, "Nerve on return",  n.status, n.text);
      }

      // Life reminder (kept simple)
      if (flags.life) {
        const pct = Math.round(flags.life.ratio * 100);
        addRow(overlay.list, "Life low enough (<33%)", flags.life.ratio < 1/3 ? "good" : "bad", `${flags.life.cur}/${flags.life.max} (${pct}%)`);
      }

      // OC timing (uses current flightMinutes if present)
      (async () => {
        const apiKey = "YOUR_API_KEY_HERE"; // <-- insert your key
        const oc = await fetchOrganizedCrime(apiKey);
        if (oc && flightMinutes && flightMinutes > 0) {
          const now = Math.floor(Date.now()/1000);
          const returnEpoch = now + (flightMinutes * 2 + 15) * 60;
          if (oc.endsAt) {
            const diffMins = Math.round((oc.endsAt - returnEpoch) / 60);
            if (diffMins > 0) addRow(overlay.list, "OC timing safe", "good", `Return ${diffMins} min before OC`);
            else              addRow(overlay.list, "OC may start before return!", "bad", `${Math.abs(diffMins)} min overlap`);
          } else {
            addRow(overlay.list, "OC timing unknown", "warn", oc.status || "No data");
          }
        } else {
          addRow(overlay.list, "OC timing check", "warn", (oc ? "No flight selected" : "Not in OC / no API key"));
        }
      })();
    }

    // Initial render (no flight yet)
    renderAll(0);

    // Observe DOM for when the user clicks a destination and the flight time span appears/changes
    let lastFlightMinutes = 0;
    const recompute = () => {
      const flightMinutes = getFlightMinutesFromDOM();
      if (!flightMinutes || flightMinutes === lastFlightMinutes) return;
      lastFlightMinutes = flightMinutes;

      const boardingEpoch = computeBoarding(flightMinutes);
      if (boardingEpoch) runCountdown(overlay.header, boardingEpoch, "Selected destination");

      renderAll(flightMinutes);
    };

    // Run once and then watch for changes
    recompute();
    const obs = new MutationObserver(() => { try { recompute(); } catch {} });
    obs.observe(travelRoot, { childList: true, subtree: true });
    // Also poll lightly in case parts update without mutations (rare)
    setInterval(recompute, 1000);
  })();
})();
