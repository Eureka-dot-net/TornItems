document.addEventListener('DOMContentLoaded', () => {
  console.log('[Popup] Initialized at', new Date().toISOString());
  const checkButton = document.getElementById('checkItems');
  const stopButton = document.getElementById('stopCheck');
  const continueButton = document.getElementById('continueCheck');
  const testButton = document.getElementById('testBazaar');
  const statusElement = document.getElementById('status');

  console.log('[Popup] DOM elements:', { checkButton, stopButton, continueButton, testButton, statusElement });

  // Load initial state
  chrome.storage.local.get(['checking', 'currentIndex', 'status'], (data) => {
    console.log('[Popup] Loaded storage state:', data);
    if (data.checking) {
      checkButton.disabled = true;
      stopButton.disabled = false;
      continueButton.disabled = true;
      statusElement.textContent = data.status || 'Checking...';
    } else if (data.currentIndex > 0) {
      checkButton.disabled = false;
      stopButton.disabled = true;
      continueButton.disabled = false;
      statusElement.textContent = data.status || 'Paused';
    } else {
      checkButton.disabled = false;
      stopButton.disabled = true;
      continueButton.disabled = true;
      statusElement.textContent = data.status || 'Ready';
    }
  });

  // TEST BUTTON
  testButton.addEventListener('click', () => {
    console.log('[Popup] Test button clicked');
    statusElement.textContent = 'Testing...';
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) {
        console.log('[Popup] No active tab');
        statusElement.textContent = 'No active tab';
        return;
      }
      
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        function: () => {
          console.log('=== BAZAAR TEST START ===');
          console.log('URL:', window.location.href);
          
          const loginForm = document.querySelector('form#loginForm');
          const captcha = document.querySelector('.captcha');
          console.log('Login form:', !!loginForm);
          console.log('Captcha:', !!captcha);
          
          const items = document.querySelectorAll('div.itemDescription___j4EfE');
          console.log('Items (div.itemDescription___j4EfE):', items.length);
          
          let unlockedCount = 0;
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const name = item.querySelector('p.name___B0RW3')?.textContent || 'Unknown';
            const priceElement = item.querySelector('div.price___dJqda');
            const price = priceElement ? priceElement.textContent.trim().replace(/[^$0-9]/g, '') : null;
            const buyBtn = item.querySelector('button[aria-label^="Buy:"]') || item.querySelector('div.controlPanel___LDuvi button.controlPanelButton___MSBz0:not([aria-label^="Show info:"])');
            const lockCanvas = item.querySelector('canvas.isBlockedForBuying___dv7DR');
            const lockContainer = item.querySelector('div.lockContainer___iCLqC');
            
            console.log(`Item ${i}: ${name}`);
            console.log(`  Price: ${price}`);
            console.log(`  Buy button: ${buyBtn ? (buyBtn.getAttribute('aria-label') || 'Found') : 'None'}`);
            console.log(`  Locked: ${!!lockCanvas || !!lockContainer}`);
            
            if (price === '$1' && buyBtn && !lockCanvas && !lockContainer) {
              console.log(`  **UNLOCKED $1 ITEM DETECTED**: ${name}`);
              console.log(`  HTML: ${item.outerHTML.substring(0, 200)}...`);
              item.style.border = '2px solid red';
              unlockedCount++;
            }
          }
          
          console.log(`=== BAZAAR TEST END === Found ${unlockedCount} unlocked $1 item(s)`);
          return { items: items.length, unlockedCount };
        }
      }, (results) => {
        if (chrome.runtime.lastError) {
          console.error('[Popup] Test error:', chrome.runtime.lastError);
          statusElement.textContent = 'Test error - check console';
          return;
        }
        const result = results[0]?.result;
        console.log('[Popup] Test result:', result);
        statusElement.textContent = `Tested: ${result?.items || 0} items, ${result?.unlockedCount || 0} unlocked $1`;
      });
    });
  });

  // Check Items button
  checkButton.addEventListener('click', () => {
    console.log('[Popup] Check Items clicked at', new Date().toISOString());
    checkButton.disabled = true;
    stopButton.disabled = false;
    continueButton.disabled = true;
    statusElement.textContent = 'Checking...';
    chrome.storage.local.set({ checking: true, currentIndex: 0, status: 'Checking...' }, () => {
      console.log('[Popup] Storage set: checking=true, currentIndex=0');
    });
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      console.log('[Popup] Queried active tab:', tabs[0]?.url);
      if (!tabs[0]?.url || !tabs[0].url.startsWith('https://weav3r.dev/dollar-items')) {
        console.log('[Popup] Wrong page, expected https://weav3r.dev/dollar-items');
        statusElement.textContent = 'Open Weaver\'s Dollar Items page';
        chrome.storage.local.set({ checking: false, currentIndex: 0, status: 'Open Weaver\'s Dollar Items page' });
        checkButton.disabled = false;
        stopButton.disabled = true;
        continueButton.disabled = true;
        return;
      }
      console.log('[Popup] Injecting checkDollarItems on tab:', tabs[0].id);
      try {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: () => {
            console.log('[Content] Attempting to execute checkDollarItems from start at', new Date().toISOString());
            try {
              if (typeof window.checkDollarItems === 'function') {
                console.log('[Content] window.checkDollarItems found, calling with index 0');
                window.checkDollarItems(0);
              } else {
                console.error('[Content] window.checkDollarItems is not defined');
                alert('Content script not loaded. Please reload the extension and try again.');
                chrome.runtime.sendMessage({ action: 'updateStatus', status: 'Content script not loaded' });
              }
            } catch (e) {
              console.error('[Content] Error executing checkDollarItems:', e);
              alert('Error starting checker: ' + e.message);
              chrome.runtime.sendMessage({ action: 'updateStatus', status: 'Error: ' + e.message });
            }
          }
        }, (results) => {
          console.log('[Popup] checkDollarItems injection results:', results);
          if (chrome.runtime.lastError) {
            console.error('[Popup] Injection error:', chrome.runtime.lastError);
            statusElement.textContent = 'Injection error: ' + chrome.runtime.lastError.message;
            chrome.storage.local.set({ checking: false, currentIndex: 0, status: 'Injection error' });
            checkButton.disabled = false;
            stopButton.disabled = true;
            continueButton.disabled = true;
          }
        });
      } catch (e) {
        console.error('[Popup] Script injection failed:', e);
        statusElement.textContent = 'Injection failed: ' + e.message;
        chrome.storage.local.set({ checking: false, currentIndex: 0, status: 'Injection failed' });
        checkButton.disabled = false;
        stopButton.disabled = true;
        continueButton.disabled = true;
      }
    });
  });

  // Stop button
  stopButton.addEventListener('click', () => {
    console.log('[Popup] Stop button clicked at', new Date().toISOString());
    checkButton.disabled = false;
    stopButton.disabled = true;
    continueButton.disabled = false;
    statusElement.textContent = 'Paused';
    chrome.storage.local.set({ checking: false, status: 'Paused' });
    chrome.runtime.sendMessage({ action: 'stopChecking' }, () => {
      console.log('[Popup] stopChecking message sent');
    });
  });

  // Continue button
  continueButton.addEventListener('click', () => {
    console.log('[Popup] Continue button clicked at', new Date().toISOString());
    checkButton.disabled = true;
    stopButton.disabled = false;
    continueButton.disabled = true;
    statusElement.textContent = 'Checking...';
    chrome.storage.local.set({ checking: true, status: 'Checking...' });
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      console.log('[Popup] Queried active tab for continue:', tabs[0]?.url);
      if (!tabs[0]?.url || !tabs[0].url.startsWith('https://weav3r.dev/dollar-items')) {
        console.log('[Popup] Wrong page, expected https://weav3r.dev/dollar-items');
        statusElement.textContent = 'Open Weaver\'s Dollar Items page';
        chrome.storage.local.set({ checking: false, currentIndex: 0, status: 'Open Weaver\'s Dollar Items page' });
        checkButton.disabled = false;
        stopButton.disabled = true;
        continueButton.disabled = true;
        return;
      }
      console.log('[Popup] Injecting checkDollarItems for continue on tab:', tabs[0].id);
      try {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: () => {
            console.log('[Content] Attempting to execute checkDollarItems from continue at', new Date().toISOString());
            try {
              if (typeof window.checkDollarItems === 'function') {
                console.log('[Content] window.checkDollarItems found, fetching currentIndex');
                chrome.storage.local.get(['currentIndex'], (data) => {
                  console.log('[Content] Continuing with index:', data.currentIndex || 0);
                  window.checkDollarItems(data.currentIndex || 0);
                });
              } else {
                console.error('[Content] window.checkDollarItems is not defined');
                alert('Content script not loaded. Please reload the extension and try again.');
                chrome.runtime.sendMessage({ action: 'updateStatus', status: 'Content script not loaded' });
              }
            } catch (e) {
              console.error('[Content] Error executing checkDollarItems:', e);
              alert('Error continuing checker: ' + e.message);
              chrome.runtime.sendMessage({ action: 'updateStatus', status: 'Error: ' + e.message });
            }
          }
        }, (results) => {
          console.log('[Popup] checkDollarItems continue injection results:', results);
          if (chrome.runtime.lastError) {
            console.error('[Popup] Injection error:', chrome.runtime.lastError);
            statusElement.textContent = 'Injection error: ' + chrome.runtime.lastError.message;
            chrome.storage.local.set({ checking: false, currentIndex: 0, status: 'Injection error' });
            checkButton.disabled = false;
            stopButton.disabled = true;
            continueButton.disabled = true;
          }
        });
      } catch (e) {
        console.error('[Popup] Script injection failed:', e);
        statusElement.textContent = 'Injection failed: ' + e.message;
        chrome.storage.local.set({ checking: false, currentIndex: 0, status: 'Injection failed' });
        checkButton.disabled = false;
        stopButton.disabled = true;
        continueButton.disabled = true;
      }
    });
  });

  // Listen for status updates
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[Popup] Received message:', request);
    if (request.action === 'updateStatus') {
      console.log('[Popup] Updating status:', request.status);
      document.getElementById('status').textContent = request.status;
      chrome.storage.local.set({ status: request.status });
      if (request.status.includes('Found') || request.status.includes('No unlocked') || request.status.includes('Not logged in') || request.status.includes('CAPTCHA') || request.status.includes('Content script not loaded') || request.status.includes('Error')) {
        document.getElementById('checkItems').disabled = false;
        document.getElementById('stopCheck').disabled = true;
        document.getElementById('continueCheck').disabled = true;
        chrome.storage.local.set({ checking: false, currentIndex: 0 });
      }
    }
  });
});