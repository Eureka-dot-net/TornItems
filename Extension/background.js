chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Background] Received message:', request);
  
  if (request.action === 'openTab') {
    console.log('[Background] Opening tab for URL:', request.url);
    chrome.tabs.create({ url: request.url, active: false }, (tab) => {
      if (chrome.runtime.lastError) {
        console.error('[Background] Error opening tab:', chrome.runtime.lastError);
        sendResponse({ tab: null });
        return;
      }
      console.log('[Background] Tab created:', tab);
      sendResponse({ tab });
    });
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
          console.log('[Bazaar] Found items:', items.length);
          for (const item of items) {
            const price = item.querySelector('div.price___dJqda')?.textContent;
            const isLocked = item.querySelector('canvas.isBlockedForBuying___dv7DR, div.lockContainer___iCLqC');
            console.log('[Bazaar] Item price:', price, 'Is locked:', !!isLocked);
            if (price <= 100 && !isLocked) {
              console.log('[Bazaar] Found unlocked item');
              item.style.border = '2px solid red';
              item.scrollIntoView({ behavior: 'smooth', block: 'center' });
              console.log('[Bazaar] Highlighted (border) & scrolled to item:', item);
              return { found: true, tabId };
            }
          }
          console.log('[Bazaar] No unlocked items found');
          return { found: false };
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
      const result = results[0]?.result || { found: false };
      console.log('[Background] Bazaar check result:', result);
      if (result.found && result.tabId) {
        console.log('[Background] Focusing tab:', result.tabId);
        chrome.tabs.update(result.tabId, { active: true }, () => {
          if (chrome.runtime.lastError) {
            console.error('[Background] Error focusing tab:', chrome.runtime.lastError);
          } else {
            console.log('[Background] Tab focused:', result.tabId);
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
      } else {
        console.log('[Background] Tab closed:', request.tabId);
      }
      sendResponse({});
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