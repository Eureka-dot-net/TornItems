// ==============================
// Torn Chain Call - popup.js (stable)
// ==============================

// ---- Core wiring (run immediately; popup.html loads this at end of <body>) ----
document.getElementById('addPlayer').addEventListener('click', addPlayer);
document.addEventListener('input', handleInput);
document.addEventListener('click', e => {
  if (e.target.classList.contains('remove')) {
    e.target.closest('tr').remove();
    calculateChain();
    updateCallText();
    saveData();
  }
  if (e.target.classList.contains('use-refill')) handleRefill(e);
  if (e.target.classList.contains('use-xanax')) handleXanax(e);
});

document.getElementById('copyCall').addEventListener('click', copyCall);
document.getElementById('nextHit').addEventListener('click', nextHit);
document.addEventListener('DOMContentLoaded', loadData);

// tick every minute
setInterval(tickMinute, 60000);

// If we’re inside the injected iframe, hide the “Attach to Torn” UI
document.addEventListener('DOMContentLoaded', () => {
  if (window.top !== window.self) {
    const attachSection = document.getElementById('attachSection');
    if (attachSection) attachSection.style.display = 'none';
  }
});

// ------------------------------
// Core behavior
// ------------------------------
function handleInput() {
  calculateChain();
  updateCallText();
  saveData();
  refreshUseButtons();
}

function addPlayer(player = null) {
  const table = document.querySelector('#playerTable tbody');
  const row = document.createElement('tr');
  row.innerHTML = `
    <td><input placeholder="Name" value="${player?.name || ''}"></td>
    <td><input type="number" placeholder="150" min="0" max="999" style="width:70px;" value="${player?.energy ?? ''}"></td>

    <td>
      <input type="checkbox" class="refill-check" ${player?.hasRefill ? 'checked' : ''}>
      <button class="use-refill" style="display:${player?.hasRefill ? 'inline-block' : 'none'}">Use</button>
    </td>

    <td>
      <input type="checkbox" class="xanax-check" ${player?.hasXanax ? 'checked' : ''}>
      <button class="use-xanax" style="display:${player?.hasXanax ? 'inline-block' : 'none'}">Use</button>
    </td>

    <td><input type="number" placeholder="60" min="0" value="${player?.duration ?? ''}"></td>
    <td><button class="remove">X</button></td>
  `;
  table.appendChild(row);

  // toggle "Use" buttons when availability changes
  const refillBox = row.querySelector('.refill-check');
  const xanaxBox = row.querySelector('.xanax-check');
  refillBox.addEventListener('change', () => {
    row.querySelector('.use-refill').style.display = refillBox.checked ? 'inline-block' : 'none';
    saveData();
  });
  xanaxBox.addEventListener('change', () => {
    row.querySelector('.use-xanax').style.display = xanaxBox.checked ? 'inline-block' : 'none';
    saveData();
  });

  calculateChain();
  updateCallText();
  saveData();
}

function handleRefill(e) {
  const row = e.target.closest('tr');
  const refillBox = row.querySelector('.refill-check');
  const inputE = row.children[1].querySelector('input');

  inputE.value = 150;         // set to 150
  refillBox.checked = false;  // consume it
  e.target.style.display = 'none';

  calculateChain();
  updateCallText();
  saveData();
}

function handleXanax(e) {
  const row = e.target.closest('tr');
  const xanaxBox = row.querySelector('.xanax-check');
  const inputE = row.children[1].querySelector('input');
  let energy = parseInt(inputE.value) || 0;

  inputE.value = energy + 250;   // add 250
  xanaxBox.checked = false;      // consume it
  e.target.style.display = 'none';

  calculateChain();
  updateCallText();
  saveData();
}

function refreshUseButtons() {
  document.querySelectorAll('#playerTable tbody tr').forEach(row => {
    const refillBox = row.querySelector('.refill-check');
    const xanaxBox = row.querySelector('.xanax-check');
    row.querySelector('.use-refill').style.display = refillBox.checked ? 'inline-block' : 'none';
    row.querySelector('.use-xanax').style.display = xanaxBox.checked ? 'inline-block' : 'none';
  });
}

function calculateChain() {
  const rows = document.querySelectorAll('#playerTable tbody tr');
  let totalEnergy = 0;

  rows.forEach(row => {
    const e = parseInt(row.children[1].querySelector('input').value) || 0;
    const duration = parseInt(row.children[4].querySelector('input').value) || 0;
    const regen = Math.floor(duration / 10) * 5;
    totalEnergy += (e + regen);
  });

  const hitsPossible = Math.floor(totalEnergy / 25);
  const minutesBetweenHits = (parseInt(document.getElementById('callAt').value) || 2) + 3;
  const totalMinutes = hitsPossible * minutesBetweenHits;

  document.getElementById('chainDuration').textContent = rows.length === 0
    ? ''
    : `🧮 Estimated chain: ${hitsPossible} hits ≈ ${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
}

function updateCallText() {
  const rows = document.querySelectorAll('#playerTable tbody tr');
  const callAt = parseInt(document.getElementById('callAt').value) || 2;
  const names = Array.from(rows)
    .map(r => r.children[0].querySelector('input').value.trim())
    .filter(Boolean);
  const display = document.getElementById('callDisplay');

  display.textContent = names.length === 0
    ? "No players yet"
    : `Hit at ${callAt}: ${names.join(', ')}`;
}

function copyCall() {
  const text = document.getElementById('callDisplay').textContent;
  navigator.clipboard.writeText(text);
}

function nextHit() {
  const table = document.querySelector('#playerTable tbody');
  const rows = Array.from(table.querySelectorAll('tr'));
  if (rows.length === 0) return;

  const first = rows[0];
  const eInput = first.children[1].querySelector('input');
  let energy = parseInt(eInput.value) || 0;
  energy = Math.max(0, energy - 25);
  eInput.value = energy;

  // move hitter to back
  table.appendChild(first);

  calculateChain();
  updateCallText();
  saveData();

  const text = document.getElementById('callDisplay').textContent;
  navigator.clipboard.writeText(text);
}

// ------------------------------
// Persistence
// ------------------------------
function saveData() {
  const callAt = parseInt(document.getElementById('callAt').value) || 2;
  const rows = document.querySelectorAll('#playerTable tbody tr');
  const players = Array.from(rows).map(row => ({
    name: row.children[0].querySelector('input').value.trim(),
    energy: parseInt(row.children[1].querySelector('input').value) || 0,
    hasRefill: row.querySelector('.refill-check').checked,
    hasXanax: row.querySelector('.xanax-check').checked,
    duration: parseInt(row.children[4].querySelector('input').value) || 0
  }));

  chrome.storage.local.set({ players, callAt, lastTick: Date.now() });
}

function loadData() {
  chrome.storage.local.get(['players', 'callAt', 'lastTick'], data => {
    if (data.callAt) document.getElementById('callAt').value = data.callAt;
    if (Array.isArray(data.players)) data.players.forEach(p => addPlayer(p));

    calculateChain();
    updateCallText();
    refreshUseButtons();

    if (data.lastTick) {
      const diffMins = Math.floor((Date.now() - data.lastTick) / 60000);
      if (diffMins > 0) applyElapsedTime(diffMins);
    }
  });
}

// ------------------------------
// Timers
// ------------------------------
function applyElapsedTime(minutesPassed) {
  const rows = document.querySelectorAll('#playerTable tbody tr');
  rows.forEach(row => {
    const eInput = row.children[1].querySelector('input');
    const durInput = row.children[4].querySelector('input');
    let e = parseInt(eInput.value) || 0;
    let d = parseInt(durInput.value) || 0;

    d = Math.max(0, d - minutesPassed);
    const regenTicks = Math.floor(minutesPassed / 10);
    e += regenTicks * 5;

    eInput.value = e;
    durInput.value = d;
  });
  saveData();
  calculateChain();
  updateCallText();
}

function tickMinute() {
  const rows = document.querySelectorAll('#playerTable tbody tr');
  if (rows.length === 0) return;

  const currentTime = new Date();
  const minute = currentTime.getMinutes();

  rows.forEach(row => {
    const eInput = row.children[1].querySelector('input');
    const durInput = row.children[4].querySelector('input');

    let e = parseInt(eInput.value) || 0;
    let d = parseInt(durInput.value) || 0;

    if (d > 0) d -= 1;
    if (minute % 10 === 0) e += 5;

    eInput.value = e;
    durInput.value = Math.max(0, d);
  });

  saveData();
  calculateChain();
  updateCallText();
}

// ------------------------------
// Attach to Torn (data-URL iframe)
// ------------------------------
document.getElementById('attachTorn')?.addEventListener('click', attachToTorn);

async function attachToTorn() {
  const side = document.getElementById('injectPosition').value;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab || !tab.url || !tab.url.startsWith("https://www.torn.com/")) {
    alert("Please open Torn first (https://www.torn.com) before attaching.");
    return;
  }

  try {
    // Load our files inside the extension context
    const [htmlRes, cssRes, jsRes] = await Promise.all([
      fetch(chrome.runtime.getURL('popup.html')),
      fetch(chrome.runtime.getURL('popup.css')),
      fetch(chrome.runtime.getURL('popup.js')),
    ]);
    const [html, css, js] = await Promise.all([htmlRes.text(), cssRes.text(), jsRes.text()]);

    // Take only the <body> markup
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyHtml = bodyMatch ? bodyMatch[1] : html;

    // storage fallback for injected iframe (uses localStorage if chrome.storage is not available)
    const storagePolyfill = `
      (function(){
        if (typeof chrome === 'undefined') window.chrome = {};
        if (!chrome.storage) chrome.storage = {};
        chrome.storage.local = {
          get: (keys, cb) => {
            try {
              const data = JSON.parse(localStorage.getItem('tcc') || '{}');
              cb(data);
            } catch { cb({}); }
          },
          set: (obj) => {
            try {
              const data = JSON.parse(localStorage.getItem('tcc') || '{}');
              localStorage.setItem('tcc', JSON.stringify(Object.assign(data, obj)));
            } catch {}
          }
        };
        // Hide attach section inside the iframe
        document.addEventListener('DOMContentLoaded', function(){
          const el = document.getElementById('attachSection');
          if (el) el.style.display = 'none';
        });
      })();
    `;

    // Build a full HTML document and encode into a data URL
    const encoded = btoa(unescape(encodeURIComponent(`
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<style>${css}</style>
</head>
<body>
${bodyHtml}
<script>${storagePolyfill}</script>
<script>${js}</script>
</body>
</html>`)));

    const dataUrl = "data:text/html;base64," + encoded;

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (url, side) => {
        const existing = document.getElementById('tornChainPanel_iframe');
        if (existing) existing.remove();

        const iframe = document.createElement('iframe');
        iframe.id = 'tornChainPanel_iframe';
        iframe.src = url;
        Object.assign(iframe.style, {
          position: 'fixed',
          top: '10px',
          [side]: '10px',
          width: '430px',
          height: '90%',
          zIndex: '99999',
          border: '2px solid #555',
          borderRadius: '8px',
          background: '#1c1c1c',
          boxShadow: '0 0 8px rgba(0,0,0,0.6)',
        });

        const close = document.createElement('button');
        close.textContent = '✖';
        Object.assign(close.style, {
          position: 'fixed',
          top: '14px',
          [side]: '16px',
          transform: side === 'right' ? 'translateX(-100%)' : 'translateX(100%)',
          fontSize: '12px',
          border: 'none',
          background: 'transparent',
          color: '#aaa',
          cursor: 'pointer',
          zIndex: '100000',
        });
        close.onclick = () => {
          iframe.remove();
          close.remove();
        };

        document.body.appendChild(iframe);
        document.body.appendChild(close);
      },
      args: [dataUrl, side]
    });

    window.close();
  } catch (err) {
    console.error('Injection failed:', err);
    alert('Failed to inject. Reload the extension and try again.');
  }
}
