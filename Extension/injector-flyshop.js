// injector-flyshop.js — minimal safe overlay with elapsed + restock countdown (only on Travel Home)
(() => {
  // ✅ Only run if Travel Home element exists
  const travelHomeEl = document.querySelector("#travel-home");
  if (!travelHomeEl) {
    console.log("[TornFlyShop] Not on Travel Home — overlay skipped.");
    return;
  }

  const startTime = Date.now();

  // 🕐 Create overlay
  const timerDiv = document.createElement("div");
  timerDiv.id = "torn-flyshop-overlay";
  timerDiv.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-family: monospace;
    font-size: 18px;
    font-weight: bold;
    z-index: 999999;
    line-height: 1.4em;
    text-align: right;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  `;
  document.body.appendChild(timerDiv);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const updateTimers = () => {
    // elapsed since page load
    const elapsedSecs = Math.floor((Date.now() - startTime) / 1000);

    // time until next restock
    const now = new Date();
    const totalSecs = now.getMinutes() * 60 + now.getSeconds();
    const blockPos = totalSecs % 900; // seconds into current 15-min block
    const secsToRestock = 900 - blockPos;

    // color hint near restock
    if (secsToRestock <= 10) {
      timerDiv.style.background = "rgba(34, 197, 94, 0.9)"; // green
    } else if (secsToRestock <= 30) {
      timerDiv.style.background = "rgba(249, 115, 22, 0.9)"; // orange
    } else {
      timerDiv.style.background = "rgba(0, 0, 0, 0.8)"; // default
    }

    timerDiv.innerHTML = `
      ⏱️ On page: ${formatTime(elapsedSecs)}<br>
      🛒 Next restock in: ${formatTime(secsToRestock)}
    `;
  };

  updateTimers();
  setInterval(updateTimers, 1000);
})();