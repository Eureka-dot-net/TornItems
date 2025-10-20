chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Background] Received message:', request);

  if (request.action === 'openTab') {
    console.log('[Background] Opening tab for URL:', request.url);
    // Check cache before opening
    const userId = request.url.match(/userId=(\d+)/)?.[1];
    if (userId) {
      chrome.storage.local.get(['bazaarCache'], (data) => {
        const cache = data.bazaarCache || {};
        const now = Date.now() / 1000; // Current time in seconds
        if (cache[userId] && now - cache[userId] < 3600) {
          console.log(`[Background] Skipping cached bazaar userId=${userId}, checked ${Math.round(now - cache[userId])}s ago`);
          sendResponse({ tab: null, cached: true });
          return;
        }
        chrome.tabs.create({ url: request.url, active: false }, (tab) => {
          if (chrome.runtime.lastError) {
            console.error('[Background] Error opening tab:', chrome.runtime.lastError);
            sendResponse({ tab: null });
            return;
          }
          console.log('[Background] Tab created:', tab);
          // Update cache
          cache[userId] = now;
          // Clean old entries (>24 hours)
          Object.keys(cache).forEach((id) => {
            if (now - cache[id] > 24 * 3600) delete cache[id];
          });
          chrome.storage.local.set({ bazaarCache: cache }, () => {
            console.log(`[Background] Cached userId=${userId} at ${now}`);
          });
          sendResponse({ tab });
        });
      });
    } else {
      console.log('[Background] No userId in URL, opening tab');
      chrome.tabs.create({ url: request.url, active: false }, (tab) => {
        if (chrome.runtime.lastError) {
          console.error('[Background] Error opening tab:', chrome.runtime.lastError);
          sendResponse({ tab: null });
          return;
        }
        console.log('[Background] Tab created:', tab);
        sendResponse({ tab });
      });
    }
    return true;
  }

  if (request.action === 'waitForTab') {
    console.log('[Background] Waiting for tab to load:', request.tabId);
    const listener = (tabId, changeInfo) => {
      if (tabId === request.tabId && changeInfo.status === 'complete') {
        console.log('[Background] Tab loaded:', tabId);
        chrome.tabs.onUpdated.removeListener(listener);
        sendResponse({ loaded: true });
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
    setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      console.log('[Background] Tab load timeout for:', request.tabId);
      sendResponse({ loaded: false, error: 'Tab load timeout' });
    }, 10000);
    return true;
  }

  if (request.action === 'checkBazaar') {
    console.log('[Background] Checking bazaar in tab:', request.tabId);
    chrome.scripting.executeScript({
      target: { tabId: request.tabId },
      function: (tabId) => {
        console.log('[Bazaar] Checking bazaar page, tab:', tabId);
        try {
          if (document.querySelector('form#loginForm')) {
            console.log('[Bazaar] Not logged in to Torn');
            return { error: 'Not logged in to Torn' };
          }
          if (document.querySelector('.captcha')) {
            console.log('[Bazaar] CAPTCHA detected');
            return { error: 'CAPTCHA detected, please solve manually' };
          }

          const items = document.querySelectorAll('div.itemDescription___j4EfE');
          console.log('[Bazaar] Items found:', items.length);

          let unlockedCount = 0;
          for (let index = 0; index < items.length; index++) {
            const item = items[index];
            const name = item.querySelector('p.name___B0RW3')?.textContent || 'Unknown';
            const priceElement = item.querySelector('div.price___dJqda');
            const price = priceElement ? priceElement.textContent.trim().replace(/[^$0-9]/g, '') : null;
            const buyBtn = item.querySelector('button[aria-label^="Buy:"]') || item.querySelector('div.controlPanel___LDuvi button.controlPanelButton___MSBz0:not([aria-label^="Show info:"])');
            const lockCanvas = item.querySelector('canvas.isBlockedForBuying___dv7DR');
            const lockContainer = item.querySelector('div.lockContainer___iCLqC');

            console.log(`[Bazaar] Item ${index}: ${name}`);
            console.log(`  Price: ${price}`);
            console.log(`  Buy button: ${buyBtn ? (buyBtn.getAttribute('aria-label') || 'Found') : 'None'}`);
            console.log(`  Locked: ${!!lockCanvas || !!lockContainer}`);

            if (price === '$1' && buyBtn && !lockCanvas && !lockContainer) {
              console.log(`  **UNLOCKED $1 ITEM DETECTED**: ${name}`);
              console.log(`  HTML: ${item.outerHTML.substring(0, 200)}...`);
              item.style.border = '2px solid red';
              item.scrollIntoView({ behavior: 'smooth', block: 'center' });
              console.log('[Bazaar] Highlighted (border) & scrolled to item:', item);
              unlockedCount++;
            }
          }

          console.log(`[Bazaar] Check complete. Found ${unlockedCount} unlocked $1 item(s)`);
          return { found: unlockedCount > 0, tabId, unlockedCount };
        } catch (e) {
          console.error('[Bazaar] Error checking bazaar:', e);
          return { error: e.message };
        }
      },
      args: [request.tabId]
    }, (results) => {
      if (chrome.runtime.lastError) {
        console.error('[Background] Error checking bazaar:', chrome.runtime.lastError);
        sendResponse({ error: chrome.runtime.lastError.message });
        return;
      }
      const result = results[0]?.result || { found: false, unlockedCount: 0 };
      console.log('[Background] Bazaar check result:', result);
      if (result.found && result.tabId) {
        console.log('[Background] Focusing tab:', result.tabId);
        chrome.tabs.update(result.tabId, { active: true }, () => {
          if (chrome.runtime.lastError) {
            console.error('[Background] Error focusing tab:', chrome.runtime.lastError);
          } else {
            console.log('[Background] Tab focused:', result.tabId);
            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'icon.png',
              title: 'Unlocked $1 Item Found',
              message: `Found ${result.unlockedCount} unlocked $1 item(s) in tab ${result.tabId}`
            }, () => {
              if (chrome.runtime.lastError) {
                console.error('[Background] Error creating notification:', chrome.runtime.lastError);
              } else {
                console.log('[Background] Notification created');
              }
            });
          }
        });
      }
      sendResponse(result);
    });
    return true;
  }

  if (request.action === 'closeTab') {
    console.log('[Background] Closing tab:', request.tabId);
    chrome.tabs.remove(request.tabId, () => {
      if (chrome.runtime.lastError) {
        console.error('[Background] Error closing tab:', chrome.runtime.lastError);
        sendResponse({});
      } else {
        console.log('[Background] Tab closed:', request.tabId);
        sendResponse({});
      }
    });
    return true;
  }

  if (request.action === 'refreshAndRestart') {
    console.log('[Background] Refreshing dollar-items page');
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        console.error('[Background] Error querying tabs:', chrome.runtime.lastError);
        sendResponse({ success: false, error: 'Failed to query tabs' });
        return;
      }
      if (tabs[0]?.url?.startsWith('https://weav3r.dev/dollar-items')) {
        console.log('[Background] Refreshing tab:', tabs[0].id);
        chrome.tabs.update(tabs[0].id, { url: 'https://weav3r.dev/dollar-items' }, () => {
          if (chrome.runtime.lastError) {
            console.error('[Background] Error refreshing page:', chrome.runtime.lastError);
            sendResponse({ success: false, error: 'Failed to refresh page' });
            return;
          }
          console.log('[Background] Page refreshed, restarting check');
          chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: () => {
              setTimeout(() => {
                if (typeof window.checkDollarItems === 'function') {
                  console.log('[Content] Restarting checkDollarItems');
                  window.checkDollarItems(0);
                } else {
                  console.error('[Content] checkDollarItems not found');
                }
              }, 2000);
            }
          }, () => {
            if (chrome.runtime.lastError) {
              console.error('[Background] Error injecting restart script:', chrome.runtime.lastError);
              sendResponse({ success: false, error: 'Failed to restart check' });
              return;
            }
            sendResponse({ success: true });
          });
        });
      } else {
        console.log('[Background] Not on dollar-items page');
        sendResponse({ success: false, error: 'Not on dollar-items page' });
      }
    });
    return true;
  }
});