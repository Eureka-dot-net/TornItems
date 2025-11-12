// injector-travel.js — MODE C only (countdown + semi-auto pre-flight checklist + toggle button)
// Safe: no notifications, no reloads, no input simulation, no arming/localStorage (except sessionStorage for manual toggles)
(() => {
  // ────────────────────────────────────────────────────────────────────────────
  // DOM helpers
  // ────────────────────────────────────────────────────────────────────────────
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const qsContainsClass = (frag) => `[class*="${frag}"]`;
  const textOf = (el) => (el ? (el.textContent || "").trim() : "");

  function findBarValueByLabel(label) {
    const nameNodes = $$(`${qsContainsClass("bar-name")}`);
    const node = nameNodes.find((n) => textOf(n).toLowerCase().startsWith(label.toLowerCase()));
    if (!node) return null;
    const container = node.closest(qsContainsClass("bar___")) || node.parentElement;
    const valueNode = container ? $(qsContainsClass("bar-value"), container) : null;
    return valueNode ? textOf(valueNode) : null;
  }

  function parseCurMax(str) {
    if (!str || !str.includes("/")) return null;
    const [a, b] = str.split("/").map((x) => parseInt(x.replace(/\D+/g, ""), 10));
    if (!Number.isFinite(a) || !Number.isFinite(b) || b <= 0) return null;
    return { cur: a, max: b, ratio: a / b };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // MODE C — dynamic pre-flight (map pick)
  // ────────────────────────────────────────────────────────────────────────────
  function waitForTravelRoot() {
    return new Promise((resolve) => {
      const check = () => {
        const root = $("#travel-root");
        if (root) return resolve(root);
        requestAnimationFrame(check);
      };
      check();
    });
  }

  function computeBoardingFromMap() {
    const panel = $(qsContainsClass("destinationPanel"));
    const openPin = $(`${qsContainsClass("pin")}[data-is-tooltip-opened="true"]`);
    if (!panel || !openPin) return null;

    const country = textOf($(qsContainsClass("country"), panel));
    const timeNode =
      $(`.flightDetailsGrid___uAttX span[aria-hidden='true'], ${qsContainsClass("flightDetailsGrid")} span[aria-hidden='true']`, panel) ||
      $(`${qsContainsClass("flightDetails")} span[aria-hidden='true']`, panel);
    const timeText = textOf(timeNode);
    if (!country || !timeText || !timeText.includes(":")) return null;

    const parts = timeText.split(":").map(Number);
    let flightMinutes = 0;
    if (parts.length === 2) {
      const [m, s] = parts;
      flightMinutes = m + (s > 0 ? 1 : 0);
    } else if (parts.length === 3) {
      const [h, m] = parts;
      flightMinutes = h * 60 + m;
    } else return null;

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

    return { country, boardingEpoch: Math.floor(boarding.getTime() / 1000), flightMinutes };
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Overlay UI
  // ────────────────────────────────────────────────────────────────────────────
  function makeOverlay() {
    const box = document.createElement("div");
    box.id = "torn-travel-overlay";
    box.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 320px;
      max-height: 70vh;
      overflow: auto;
      padding: 10px 12px;
      background: rgba(0,0,0,0.85);
      color: #eee;
      border-radius: 10px;
      font-family: monospace;
      font-size: 13px;
      line-height: 1.35;
      z-index: 999999;
      box-shadow: 0 6px 16px rgba(0,0,0,0.5);
      backdrop-filter: blur(2px);
      transition: opacity 0.3s ease, transform 0.3s ease;
    `;

    const header = document.createElement("div");
    header.id = "torn-travel-countdown";
    header.style.cssText = `
      font-weight: 700;
      font-size: 14px;
      padding: 8px;
      margin: -4px -4px 8px -4px;
      border-radius: 8px;
      text-align: right;
      background: rgba(0,0,0,0.3);
      color: #ffd700;
    `;

    const list = document.createElement("div");
    list.id = "torn-travel-checklist";
    list.style.cssText = `display: grid; gap: 6px;`;

    const hr = document.createElement("div");
    hr.style.cssText = `height:1px;background:rgba(255,255,255,0.12);margin:6px 0;`;

    box.appendChild(header);
    box.appendChild(hr);
    box.appendChild(list);
    document.body.appendChild(box);
    return { box, header, list };
  }

  // ⚙️ Toggle Button
  function makeToggleButton(overlayBox) {
    const btn = document.createElement("button");
    btn.textContent = "⚙️";
    btn.title = "Show/Hide Pre-flight Checklist";
    btn.style.cssText = `
      position: fixed;
      top: 10px;
      right: 10px;
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 50%;
      background: rgba(0,0,0,0.6);
      color: #ffd700;
      font-size: 18px;
      cursor: pointer;
      z-index: 1000000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      transition: background 0.2s;
    `;
    btn.addEventListener("mouseenter", () => (btn.style.background = "rgba(255,215,0,0.3)"));
    btn.addEventListener("mouseleave", () => (btn.style.background = "rgba(0,0,0,0.6)"));
    btn.addEventListener("click", () => {
      const hidden = overlayBox.style.opacity === "0";
      if (hidden) {
        overlayBox.style.opacity = "1";
        overlayBox.style.transform = "translateY(0)";
        overlayBox.style.pointerEvents = "auto";
      } else {
        overlayBox.style.opacity = "0";
        overlayBox.style.transform = "translateY(-10px)";
        overlayBox.style.pointerEvents = "none";
      }
    });
    document.body.appendChild(btn);
  }

  function setHeaderUrgency(el, secs) {
    if (secs <= 0) {
      el.style.background = "rgba(22, 163, 74, 0.85)";
      el.style.color = "#fff";
    } else if (secs <= 30) {
      el.style.background = "rgba(249, 115, 22, 0.85)";
      el.style.color = "#fff";
    } else {
      el.style.background = "rgba(0,0,0,0.3)";
      el.style.color = "#ffd700";
    }
  }

  function formatSecs(s) {
    s = Math.max(0, Math.floor(s));
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  function addRow(listEl, label, status = "neutral", detail = "") {
    const row = document.createElement("div");
    row.style.cssText = `display:flex;justify-content:space-between;align-items:center;padding:6px 8px;border-radius:8px;`;
    const left = document.createElement("div");
    left.textContent = label;
    const right = document.createElement("div");
    right.textContent = detail;
    const colors = {
      good: { bg: "rgba(22,163,74,0.20)", fg: "#c6f6d5" },
      warn: { bg: "rgba(249,115,22,0.20)", fg: "#ffd7b5" },
      bad: { bg: "rgba(239,68,68,0.20)", fg: "#fecaca" },
      neutral: { bg: "rgba(255,255,255,0.05)", fg: "#ddd" },
    };
    const c = colors[status] || colors.neutral;
    row.style.background = c.bg;
    row.style.color = c.fg;
    row.appendChild(left);
    if (detail) {
      right.style.opacity = "0.9";
      row.appendChild(right);
    }
    listEl.appendChild(row);
    return row;
  }

  function addManualToggle(listEl, key, label) {
    const storageKey = `torn_travel_toggle_${key}`;
    const initial = sessionStorage.getItem(storageKey) === "1";
    const row = document.createElement("div");
    row.style.cssText = `
      display:flex;justify-content:space-between;align-items:center;
      padding:6px 8px;border-radius:8px;
      background: rgba(255,255,255,0.05); color:#ddd; cursor:pointer;
    `;
    const left = document.createElement("div");
    const box = document.createElement("span");
    box.textContent = initial ? "☑" : "☐";
    box.style.marginRight = "8px";
    const text = document.createElement("span");
    text.textContent = label;
    left.appendChild(box);
    left.appendChild(text);
    const right = document.createElement("div");
    right.style.opacity = "0.8";
    right.textContent = initial ? "✅ Done" : "—";
    row.addEventListener("click", () => {
      const newVal = !(sessionStorage.getItem(storageKey) === "1");
      sessionStorage.setItem(storageKey, newVal ? "1" : "0");
      box.textContent = newVal ? "☑" : "☐";
      right.textContent = newVal ? "✅ Done" : "—";
    });
    row.appendChild(left);
    row.appendChild(right);
    listEl.appendChild(row);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Auto-detection
  // ────────────────────────────────────────────────────────────────────────────
  function detectFlags() {
    const getIcon = (needle) => $(`ul${qsContainsClass("status-icons")} li a[aria-label*="${needle}"]`);
    const bazaarEl = getIcon("Bazaar");
    const educationEl = getIcon("Education");
    const boosterEl = getIcon("Booster Cooldown");
    const drugEl = getIcon("Drug Cooldown");
    const ocCountdown = textOf($("#oc2Timer .countdown"));
    const energyStr = findBarValueByLabel("Energy:");
    const nerveStr = findBarValueByLabel("Nerve:");
    const lifeStr = findBarValueByLabel("Life:");
    const energy = parseCurMax(energyStr);
    const nerve = parseCurMax(nerveStr);
    const life = parseCurMax(lifeStr);
    return {
      bazaarOpen: !!bazaarEl,
      educationActive: !!educationEl,
      boosterCooldown: !!boosterEl,
      drugCooldown: !!drugEl,
      ocJoined: ocCountdown && !/No crime joined/i.test(ocCountdown),
      ocText: ocCountdown || "",
      energy,
      nerve,
      life,
    };
  }

  function renderChecklist(listEl, flags) {
    addRow(listEl, "Bazaar open", flags.bazaarOpen ? "good" : "warn", flags.bazaarOpen ? "Yes" : "Check");
    addRow(listEl, "Education active", flags.educationActive ? "good" : "warn", flags.educationActive ? "Yes" : "No");

    // ✅ modified: when cooldowns are active it's GOOD
    addRow(listEl, "Booster cooldown", flags.boosterCooldown ? "good" : "warn", flags.boosterCooldown ? "Active" : "None");
    addRow(listEl, "Drug cooldown", flags.drugCooldown ? "good" : "warn", flags.drugCooldown ? "Active" : "None");

    addRow(listEl, "OC joined", flags.ocJoined ? "good" : "warn", flags.ocJoined ? flags.ocText : "No crime");

    if (flags.life) {
      const pct = Math.round(flags.life.ratio * 100);
      addRow(listEl, "Life low enough (<33%)", flags.life.ratio < 1 / 3 ? "good" : "bad", `${flags.life.cur}/${flags.life.max} (${pct}%)`);
    } else addRow(listEl, "Life low enough (<33%)", "warn", "Unknown");

    if (flags.energy) {
      const pct = Math.round(flags.energy.ratio * 100);
      addRow(listEl, "Energy low enough (≤50%)", flags.energy.ratio <= 0.5 ? "good" : "warn", `${flags.energy.cur}/${flags.energy.max} (${pct}%)`);
    } else addRow(listEl, "Energy low enough (≤50%)", "warn", "Unknown");

    if (flags.nerve) {
      const pct = Math.round(flags.nerve.ratio * 100);
      addRow(listEl, "Nerve low enough (≤50%)", flags.nerve.ratio <= 0.5 ? "good" : "warn", `${flags.nerve.cur}/${flags.nerve.max} (${pct}%)`);
    } else addRow(listEl, "Nerve low enough (≤50%)", "warn", "Unknown");

    addManualToggle(listEl, "bank_edu", "Checked bank / education end times");
    addManualToggle(listEl, "oc_overlap", "Checked OC timing overlap");
  }

  function runCountdown(headerEl, boardingEpoch, label) {
    const tick = () => {
      const now = Math.floor(Date.now() / 1000);
      const remain = Math.max(0, boardingEpoch - now);
      setHeaderUrgency(headerEl, remain);
      headerEl.textContent =
        remain <= 0 ? `🛫 Ready to board${label ? ` — ${label}` : ""}!` : `🕒 Boarding in ${formatSecs(remain)}${label ? ` — ${label}` : ""}`;
    };
    tick();
    const align = 1000 - (Date.now() % 1000);
    setTimeout(() => {
      tick();
      setInterval(tick, 1000);
    }, align);
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Boot
  // ────────────────────────────────────────────────────────────────────────────
  (async () => {
    // ✅ modified: skip overlay when actually flying
    const travelingTitle = $$("h4").find((h) => textOf(h) === "Traveling");
    if (travelingTitle) {
      console.log("[TornTravel] Detected in-flight screen — skipping overlay.");
     // return;
    }

    const travelRoot = await waitForTravelRoot();
    const overlay = makeOverlay();
    makeToggleButton(overlay.box);
    const result = computeBoardingFromMap();
    if (result) runCountdown(overlay.header, result.boardingEpoch, result.country);
    else {
      overlay.header.textContent = "Select a destination on the map…";
      setHeaderUrgency(overlay.header, 999);
    }
    const flags = detectFlags();
    renderChecklist(overlay.list, flags);
    const observer = new MutationObserver(() => {
      const r = computeBoardingFromMap();
      if (!r) return;
      runCountdown(overlay.header, r.boardingEpoch, r.country);
    });
    observer.observe(travelRoot, { childList: true, subtree: true });
  })();
})();
