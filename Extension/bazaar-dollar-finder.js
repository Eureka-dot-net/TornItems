(function () {
  'use strict';

  const MY_USER_ID = "3926388";
  const URL = new URL(window.location.href);

  const IS_BAZAAR = URL.pathname === "/bazaar.php";
  const IS_MY_BAZAAR = URL.searchParams.get("userId") === MY_USER_ID;

  if (!IS_BAZAAR) return;
  if (IS_MY_BAZAAR) {
    console.log("[Bazaar $1 Finder] Skipped — own bazaar detected");
    return;
  }

  console.log("[Bazaar $1 Finder] Activated");

  const SCROLL_STEP = 900;
  const SCROLL_DELAY = 500;
  const HIGHLIGHT_COLOR = "2px solid lime";

  let found = 0;
  let stopAfterFirst = true;
  let paused = false;
  let scrolling = false;

  async function autoScrollAndScan() {
    if (scrolling) return;
    scrolling = true;

    let lastHeight = document.body.scrollHeight;

    while (!paused) {
      window.scrollBy(0, SCROLL_STEP);
      await sleep(SCROLL_DELAY);

      scanItems();

      const currentHeight = document.body.scrollHeight;
      if (currentHeight === lastHeight) break;
      lastHeight = currentHeight;
    }

    scrolling = false;
    console.log(`[Bazaar $1 Finder] ✅ DONE — Found ${found} unlocked $1 item(s)`);
  }

  function scanItems() {
    const items = document.querySelectorAll("div.itemDescription___j4EfE");

    for (const item of items) {
      if (item.dataset.checked === "1") continue;
      item.dataset.checked = "1";

      const priceEl = item.querySelector("div.price___dJqda");
      const name = item.querySelector('p.name___B0RW3')?.textContent || "Unknown";
      if (!priceEl) continue;

      const price = priceEl.textContent.trim();

      const lockCanvas = item.querySelector("canvas.isBlockedForBuying___dv7DR");
      const lockContainer = item.querySelector("div.lockContainer___iCLqC");

      const buyButton =
        item.querySelector('button[aria-label^="Buy:"]') ||
        item.querySelector('button.controlPanelButton___MSBz0:not([aria-label^="Show info"])');

      const unlocked = !lockCanvas && !lockContainer && buyButton;

      if (price === "$1" && unlocked) {
        found++;
        highlight(item, name);

        if (stopAfterFirst) {
          paused = true;
          showContinueButton();
          console.log("[Bazaar $1 Finder] Paused — waiting for user");
          break;
        }
      }
    }
  }

  function highlight(item, name) {
    item.style.border = HIGHLIGHT_COLOR;
    item.style.boxShadow = "0 0 15px lime";
    console.log(`💰 UNLOCKED $1 ITEM: ${name}`);
    item.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function showContinueButton() {
    if (document.getElementById("bazaar-scan-continue")) return;

    const btn = document.createElement("button");
    btn.id = "bazaar-scan-continue";
    btn.textContent = "▶ Find Next $1";
    btn.style = `
      position: fixed;
      top: 12px;
      right: 12px;
      z-index: 9999;
      padding: 8px 12px;
      background: #0a0;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    `;

    btn.onclick = () => {
      paused = false;
      btn.remove();
      autoScrollAndScan();
    };

    document.body.appendChild(btn);
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  setTimeout(autoScrollAndScan, 3000);
})();
