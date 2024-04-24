chrome.runtime.onInstalled.addListener(function() {
  chrome.contextMenus.create({
    id: "define",
    title: "Define",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId === "define") {
    chrome.tabs.sendMessage(tab.id, { type: "fetchDefinitions" });
  }
});

