chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "removePanel") {
    const panel = document.getElementById('tornChainPanel');
    if (panel) panel.remove();
  }
});
