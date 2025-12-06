// ==UserScript==
// @name         Torn Market Watch (Safe Version – Highlight Only)
// @namespace    narike.marketwatch
// @match        https://www.torn.com/page.php?sid=ItemMarket*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const CHECK_INTERVAL = 200; // Slow down as a courtesy
    const BAZAAR_COOLDOWN = 10 * 60 * 1000; // 10 minutes for memory

    let bazaarOpenedCount = 0;

    // --- URL Params ---
    const url = new URL(window.location.href);
    const alertParam = url.searchParams.get("alert");
    let watchEnabled = url.searchParams.get("watch") === "1";
    const itemId = url.searchParams.get("itemID");

    // --- Threshold Input ---
    const input = document.createElement("input");
    input.type = "number";
    input.placeholder = "Alert price…";
    Object.assign(input.style, {
        position: "fixed",
        top: "80px",
        right: "20px",
        zIndex: 99999,
        padding: "6px",
        width: "160px",
        background: "#222",
        color: "#fff",
        border: "1px solid #666",
        borderRadius: "4px"
    });
    if (alertParam) input.value = alertParam;
    document.body.appendChild(input);

    input.addEventListener("input", () => {
        const v = input.value.trim();
        if (v) url.searchParams.set("alert", v);
        else url.searchParams.delete("alert");
        history.replaceState({}, "", url.toString());
    });

    // --- START / STOP BUTTON ---
    const startBtn = document.createElement("button");
    Object.assign(startBtn.style, {
        position: "fixed",
        top: "120px",
        right: "20px",
        padding: "8px 12px",
        zIndex: 99999,
        border: "none",
        borderRadius: "4px",
        color: "#fff",
        cursor: "pointer",
        background: watchEnabled ? "#dc3545" : "#007bff",
        fontWeight: "bold"
    });
    startBtn.textContent = watchEnabled ? "Stop Watching" : "Start Watching";
    document.body.appendChild(startBtn);

    startBtn.onclick = () => {
        watchEnabled = !watchEnabled;
        url.searchParams.set("watch", watchEnabled ? "1" : "0");
        history.replaceState({}, "", url.toString());
        startBtn.textContent = watchEnabled ? "Stop Watching" : "Start Watching";
        startBtn.style.background = watchEnabled ? "#dc3545" : "#007bff";

        if (watchEnabled) {
            scrollToFirstItem();
        }
    };

    // --- Helper: Highlight function ---
    function highlightElement(el, color) {
        el.style.outline = `3px solid ${color}`;
        el.style.borderRadius = "4px";
        el.style.padding = "2px";
    }

    // --- Helper: Scroll to first item (harmless, no interaction) ---
    function scrollToFirstItem() {
        const row = document.querySelector(".sellerRow___AI0m6");
        if (!row) return;
        row.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    // --- Bazaar memory (just to avoid spamming highlight) ---
    function hasSeenBazaar(userId) {
        const key = `bazaar_seen_${itemId}_${userId}`;
        const t = Number(localStorage.getItem(key) || 0);
        return Date.now() - t < BAZAAR_COOLDOWN;
    }
    function markBazaarSeen(userId) {
        const key = `bazaar_seen_${itemId}_${userId}`;
        localStorage.setItem(key, Date.now().toString());
    }

    // --- MAIN CHECK LOOP ---
    function checkMarket() {
        if (!watchEnabled) return;

        const threshold = Number(input.value);
        if (!threshold) return;

        /** ---------------------------
         * 1. MARKET CHECK (highlight)
         * --------------------------- */
        const rows = document.querySelectorAll(".sellerRow___AI0m6");
        if (rows.length > 0) {
            const firstRow = rows[0];
            const priceText = firstRow.querySelector(".price___Uwiv2")?.textContent || "";
            const price = Number(priceText.replace(/[^0-9]/g, ""));

            if (price && price <= threshold) {
                highlightElement(firstRow, "#00ff00");
                return;
            } else {
                firstRow.style.outline = "none";
            }
        }

        /** ------------------------------------
         * 2. BAZAAR CHECK (highlight only)
         * ------------------------------------ */
        const bazaarCards = document.querySelectorAll(".bazaar-listing-card");
        if (bazaarCards.length > 0) {
            const card = bazaarCards[0];
            const priceText = card.querySelector("strong + span")?.textContent || "";
            const price = Number(priceText.replace(/[^0-9]/g, ""));
            const link = card.querySelector("a");

            if (link && price && price <= threshold) {
                const m = link.href.match(/userId=(\d+)/);
                const userId = m ? m[1] : null;

                if (userId && !hasSeenBazaar(userId)) {
                    highlightElement(card, "#00ccff");
                    markBazaarSeen(userId);
                    return;
                }
            }

            // reset outline if above threshold
            card.style.outline = "none";
        }
    }

    setInterval(checkMarket, CHECK_INTERVAL);
})();
