console.log('[Content] Content script loading at', new Date().toISOString());
console.log('[Content] Page URL:', window.location.href);
console.log('[Content] Is in iframe?', window.self !== window.top);
console.log('[Content] Document readyState:', document.readyState);

document.addEventListener('DOMContentLoaded', () => {
  console.log('[Content] DOMContentLoaded fired at', new Date().toISOString());
});

const notify = async (title, body) => {
  try {
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon: "https://www.torn.com/favicon.ico" });
      console.log('[Content] Notification created');
    } else if (Notification.permission !== "denied") {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        new Notification(title, { body, icon: "https://www.torn.com/favicon.ico" });
        console.log('[Content] Notification created after permission');
      } else {
        console.log('[Content] Notification permission denied, using alert');
        alert(`${title}\n\n${body}`);
      }
    } else {
      console.log('[Content] Notification permission denied, using alert');
      alert(`${title}\n\n${body}`);
    }
  } catch (e) {
    console.error('[Content] Notification error:', e);
    alert(`${title}\n\n${body}`);
  }
};

async function checkDollarItems(startIndex) {
  console.log('[Content] checkDollarItems started with startIndex:', startIndex, 'at', new Date().toISOString());
  
  let rows = [];
  const selectors = [
    'tr a[href*="bazaar.php?userId"]',
    'tbody tr.border-b a[href*="bazaar.php?userId"]',
    'table tr a[href*="bazaar.php?userId"]'
  ];
  
  for (let attempt = 1; attempt <= 5; attempt++) {
    console.log(`[Content] Attempt ${attempt}: Querying rows at`, new Date().toISOString());
    for (const selector of selectors) {
      rows = document.querySelectorAll(selector);
      console.log(`[Content] Selector ${selector}: Found ${rows.length} rows`);
      if (rows.length > 0) break;
    }
    if (rows.length > 0) break;
    console.log('[Content] No rows found, waiting 2s');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  const links = Array.from(rows).map(row => row.href).filter(Boolean);
  console.log('[Content] Found bazaar links:', links);

  if (links.length === 0) {
    console.log('[Content] No bazaar links found');
    alert('No bazaar links found on the page.');
    chrome.runtime.sendMessage({ action: 'updateStatus', status: 'No links found' });
    chrome.storage.local.set({ checking: false, currentIndex: 0 });
    return;
  }

  for (let index = startIndex; index < links.length; index++) {
    try {
      const { checking } = await new Promise(resolve => chrome.storage.local.get(['checking'], resolve));
      console.log('[Content] Checking status:', checking, 'at index:', index);
      if (!checking) {
        console.log('[Content] Stopped at index:', index);
        chrome.storage.local.set({ currentIndex: index });
        return;
      }

      chrome.runtime.sendMessage({ action: 'updateStatus', status: `Checking bazaar ${index + 1}/${links.length}...` });
      console.log('[Content] Checking bazaar:', links[index]);

      const tab = await new Promise(resolve => {
        chrome.runtime.sendMessage({ action: 'openTab', url: links[index] }, response => {
          console.log('[Content] Opened tab:', response?.tab);
          resolve(response?.tab);
        });
      });

      if (!tab) {
        console.log('[Content] Failed to open tab');
        chrome.runtime.sendMessage({ action: 'updateStatus', status: 'Failed to open bazaar tab' });
        chrome.storage.local.set({ checking: false, currentIndex: 0 });
        return;
      }

      const loadResult = await new Promise(resolve => {
        chrome.runtime.sendMessage({ action: 'waitForTab', tabId: tab.id }, response => {
          console.log('[Content] Tab load result:', response);
          resolve(response);
        });
      });

      if (!loadResult.loaded) {
        console.log('[Content] Tab failed to load:', loadResult.error);
        chrome.runtime.sendMessage({ action: 'updateStatus', status: `Tab load failed: ${loadResult.error}` });
        await new Promise(resolve => chrome.runtime.sendMessage({ action: 'closeTab', tabId: tab.id }, resolve));
        chrome.storage.local.set({ checking: false, currentIndex: 0 });
        return;
      }

      const result = await new Promise(resolve => {
        chrome.runtime.sendMessage({ action: 'checkBazaar', tabId: tab.id }, response => {
          console.log('[Content] Bazaar check result:', response);
          resolve(response);
        });
      });

      if (result.error) {
        console.log('[Content] Error in bazaar:', result.error);
        alert(result.error);
        chrome.runtime.sendMessage({ action: 'updateStatus', status: result.error });
        await new Promise(resolve => chrome.runtime.sendMessage({ action: 'closeTab', tabId: tab.id }, resolve));
        chrome.storage.local.set({ checking: false, currentIndex: 0 });
        return;
      }

      if (result.found) {
        console.log('[Content] Found unlocked item at index:', index, 'keeping tab open:', result.tabId);
        chrome.storage.local.set({ openBazaarTabId: result.tabId, currentIndex: index + 1 });
        await notify('Unlocked Item Found!', `Unlocked item found in bazaar: ${links[index]}`);
        chrome.runtime.sendMessage({ action: 'updateStatus', status: 'Found unlocked item!' }, () => {
          if (chrome.runtime.lastError) {
            console.error('[Content] Status update message failed:', chrome.runtime.lastError);
          }
        });
        chrome.storage.local.set({ checking: false });
        return;
      }

      await new Promise(resolve => {
        chrome.runtime.sendMessage({ action: 'closeTab', tabId: tab.id }, () => {
          console.log('[Content] Closed tab:', tab.id);
          resolve();
        });
      });

      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 1000));
    } catch (e) {
      console.error('[Content] Error in loop at index', index, ':', e);
      chrome.runtime.sendMessage({ action: 'updateStatus', status: `Error checking bazaar: ${e.message}` });
      chrome.storage.local.set({ checking: false, currentIndex: 0 });
      return;
    }
  }

  console.log('[Content] No unlocked items found, requesting refresh');
  chrome.runtime.sendMessage({ action: 'updateStatus', status: 'No unlocked items found, refreshing...' });
  chrome.runtime.sendMessage({ action: 'refreshAndRestart' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('[Content] Refresh message failed:', chrome.runtime.lastError);
      chrome.storage.local.set({ checking: false, currentIndex: 0 });
      return;
    }
    if (!response.success) {
      console.error('[Content] Refresh failed:', response.error);
      chrome.runtime.sendMessage({ action: 'updateStatus', status: `Refresh failed: ${response.error}` });
      chrome.storage.local.set({ checking: false, currentIndex: 0 });
    }
  });
}

try {
  console.log('[Content] Exposing checkDollarItems to window');
  window.checkDollarItems = checkDollarItems;
  console.log('[Content] checkDollarItems exposed successfully');
} catch (e) {
  console.error('[Content] Failed to expose checkDollarItems:', e);
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Content] Received message:', request);
  if (request.action === 'stopChecking') {
    console.log('[Content] Stopping check, saving current index');
    chrome.storage.local.get(['currentIndex'], (data) => {
      chrome.storage.local.set({ checking: false, status: 'Paused' });
    });
  }
  return true;
});