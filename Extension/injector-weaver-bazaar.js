// injector-weaver-bazaar.js — Weaver e-can enhancer for category + item pages
(() => {
    // ------------------------------------------------------------------------
    // Official Base Energy values
    // ------------------------------------------------------------------------
    const baseEnergy = {
        "Can of Goose Juice": 5,
        "Can of Damp Valley": 10,
        "Can of Crocozade": 15,
        "Can of Munster": 20,
        "Can of Santa Shooters": 20,
        "Can of Red Cow": 25,
        "Can of Rockstar Rudolph": 25,
        "Can of Taurine Elite": 30,
        "Can of X-MASS": 30
    };

    const cleanNum = (t) => Number(t.replace(/[^\d.]/g, "")) || 0;
    const fmt = (n) => n.toLocaleString("en-US");

    function calcInfo(name, price) {
        const base = baseEnergy[name];
        if (!base) return null;
        return {
            base,
            perEnergy: price / base
        };
    }

    // ------------------------------------------------------------------------
    // CATEGORY PAGE: /categories?cat=Energy+Drink...
    // ------------------------------------------------------------------------
    function enhanceCategoryPage() {
        const rows = document.querySelectorAll("table tr.border-b");
        if (!rows.length) return;

        rows.forEach((tr) => {
            if (tr.dataset.weaverEnhanced) return;
            tr.dataset.weaverEnhanced = "true";

            const nameEl = tr.querySelector("a span");
            const priceEl = tr.querySelector("td.font-semibold");
            if (!nameEl || !priceEl) return;

            const name = nameEl.textContent.trim();
            const price = cleanNum(priceEl.textContent);
            const info = calcInfo(name, price);
            if (!info) return; // Not an e-can

            const extra = document.createElement("div");
            extra.style.cssText = `
        font-size: 12px;
        margin-top: 2px;
        color: var(--text-secondary);
      `;
            extra.textContent =
                `⚡ ${info.base} energy — $${fmt(Math.round(info.perEnergy))}/energy`;

            priceEl.appendChild(extra);
        });
    }

    // ------------------------------------------------------------------------
    // ITEM PAGE: /item/<id>?tab=all
    // ------------------------------------------------------------------------
    function enhanceItemPage() {
        const nameEl = document.querySelector("h1.text-lg, h1.text-2xl");
        if (!nameEl) return;

        const itemName = nameEl.textContent.trim();

        // Only continue if it's an official e-can
        if (!baseEnergy.hasOwnProperty(itemName)) return;

        const rows = document.querySelectorAll("table tr.border-b");
        if (!rows.length) return;

        rows.forEach((tr) => {
            if (tr.dataset.weaverEnhanced) return;
            tr.dataset.weaverEnhanced = "true";

            // Price column for item page rows
            const priceEl = tr.querySelector("td div.text-sm.font-semibold");
            if (!priceEl) return;

            const price = cleanNum(priceEl.textContent);
            const info = calcInfo(itemName, price);
            if (!info) return;

            const extra = document.createElement("div");
            extra.style.cssText = `
        font-size: 12px;
        margin-top: 2px;
        color: var(--text-secondary);
      `;
            extra.textContent =
                `⚡ ${info.base} energy — $${fmt(Math.round(info.perEnergy))}/energy`;

            priceEl.appendChild(extra);
        });
    }

    // ------------------------------------------------------------------------
    // Determine page type and apply
    // ------------------------------------------------------------------------
    function apply() {
        const url = window.location.href;

        // Support both "Energy+Drink" and "Energy%20Drink"
        const isCategoryPage =
            url.includes("/categories?cat=Energy+Drink") ||
            url.includes("/categories?cat=Energy%20Drink");

        if (isCategoryPage) {
            enhanceCategoryPage();
        }

        if (url.includes("/item/")) {
            enhanceItemPage();
        }
    }

    // Observe for dynamic refreshes (React SPA)
    const obs = new MutationObserver(apply);
    obs.observe(document.body, { childList: true, subtree: true });

    apply();
})();
