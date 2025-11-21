// ==UserScript==
// @name         Torn Market Watch (Start/Stop, URL State, Scroll)
// @namespace    narike.marketwatch
// @match        https://www.torn.com/page.php?sid=ItemMarket*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const CHECK_INTERVAL = 100;
    const REFRESH_INTERVAL = 60000;
    const COOLDOWN = 10000;
    const BAZAAR_COOLDOWN = 10 * 60 * 1000; // 10 minutes

    let lastRefresh = Date.now();
    let lastAlert = 0;
    let bazaarOpenedCount = 0;

    // --- Parse URL Params ---
    const url = new URL(window.location.href);
    const alertParam = url.searchParams.get("alert");
    const itemId = url.searchParams.get("itemID");
    let watchEnabled = url.searchParams.get("watch") === "1";

    // --- INPUT BOX ---
    const input = document.createElement("input");
    input.type = "number";
    input.placeholder = "Alert under price…";
    Object.assign(input.style, {
        position: "fixed",
        top: "80px",
        right: "20px",
        zIndex: 99999,
        padding: "6px",
        width: "160px",
        background: "#222",
        color: "#fff",
        border: "1px solid #666"
    });
    if (alertParam) input.value = alertParam;
    document.body.appendChild(input);

    input.addEventListener("input", () => {
        const val = input.value.trim();
        if (val) {
            url.searchParams.set("alert", val);
        } else {
            url.searchParams.delete("alert");
        }
        history.replaceState({}, "", url.toString());
    });

    // --- START / STOP BUTTON ---
    const startBtn = document.createElement("button");
    function updateStartButton() {
        startBtn.textContent = watchEnabled ? "Stop Watching" : "Start Watching";
        startBtn.style.background = watchEnabled ? "#dc3545" : "#007bff";
    }

    Object.assign(startBtn.style, {
        position: "fixed",
        top: "120px",
        right: "20px",
        zIndex: 99999,
        padding: "8px 12px",
        background: "#007bff",
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        fontWeight: "bold",
        cursor: "pointer"
    });
    updateStartButton();
    document.body.appendChild(startBtn);

    startBtn.onclick = () => {
        watchEnabled = !watchEnabled;

        if (watchEnabled) {
            url.searchParams.set("watch", "1");
            bazaarOpenedCount = 0;
            scrollToFirstItem();
        } else {
            url.searchParams.set("watch", "0");
        }

        updateStartButton();
        history.replaceState({}, "", url.toString());
    };

    if (Notification.permission !== "granted") {
        Notification.requestPermission();
    }

    function setWatchEnabled(state) {
        watchEnabled = state;
        if (watchEnabled) {
            url.searchParams.set("watch", "1");
        } else {
            url.searchParams.set("watch", "0");
        }
        updateStartButton();
        history.replaceState({}, "", url.toString());
    }

    function triggerAlert(msg) {
        const now = Date.now();
        if (now - lastAlert < COOLDOWN) return;

        lastAlert = now;

        try {
            new Notification("Market Alert", { body: msg });
        } catch (e) {}

        window.focus();

        // auto-stop until you press Start again
        setWatchEnabled(false);
    }

    function hasSeenBazaar(userId) {
        if (!itemId || !userId) return false;
        const key = `bazaar_seen_${itemId}_${userId}`;
        const ts = Number(localStorage.getItem(key) || 0);
        return Date.now() - ts < BAZAAR_COOLDOWN;
    }

    function markBazaarSeen(userId) {
        if (!itemId || !userId) return;
        const key = `bazaar_seen_${itemId}_${userId}`;
        localStorage.setItem(key, Date.now().toString());
    }

    function scrollToFirstItem() {
        const first = document.querySelector(".sellerRow___AI0m6");
        if (!first) return;

        const rect = first.getBoundingClientRect();
        const fullyVisible =
            rect.top >= 0 &&
            rect.bottom <= window.innerHeight;

        // Only scroll if it's not fully visible (above or below viewport)
        if (!fullyVisible) {
            const absoluteTop = window.scrollY + rect.top;
            const targetTop = absoluteTop - window.innerHeight / 3;
            window.scrollTo({
                top: targetTop >= 0 ? targetTop : 0,
                behavior: "instant" in window ? "instant" : "auto"
            });
        }
    }

    function checkMarket() {
        if (!watchEnabled) return;

        const threshold = Number(input.value);
        if (!threshold) return;

        // keep the first item centred-ish while watching
        scrollToFirstItem();

        // ITEM MARKET
        const rows = document.querySelectorAll(".sellerRow___AI0m6");
        if (rows.length > 0) {
            const priceText = rows[0].querySelector(".price___Uwiv2")?.textContent || "";
            const price = Number(priceText.replace(/[^0-9]/g, ""));

            if (price && price <= threshold) {
                const maxBtn = rows[0].querySelector(".input-money-symbol input[aria-label]");
                if (maxBtn) maxBtn.click();
                triggerAlert(`Item Market: ${price.toLocaleString()}`);
                return;
            }
        }

        // BAZAAR LIMIT = FIRST 2 ONLY
        const bazaarCards = document.querySelectorAll(".bazaar-listing-card");
        if (bazaarCards.length > 0 && bazaarOpenedCount < 2) {
            const card = bazaarCards[0];
            const priceText = card.querySelector("strong + span")?.textContent || "";
            const price = Number(priceText.replace(/[^0-9]/g, ""));
            const link = card.querySelector("a");

            if (link && price && price <= threshold) {
                const match = link.href.match(/userId=(\d+)/);
                const userId = match ? match[1] : null;

                if (userId && !hasSeenBazaar(userId)) {
                    bazaarOpenedCount++;
                    markBazaarSeen(userId);
                    window.open(link.href, "_blank");
                    triggerAlert(`Bazaar: ${price.toLocaleString()}`);
                    return;
                }
            }
        }

        // REFRESH EVERY 60s
        if (Date.now() - lastRefresh > REFRESH_INTERVAL) {
            location.reload();
        }
    }

    setInterval(checkMarket, CHECK_INTERVAL);
})();
