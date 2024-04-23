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

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  const definitions = [];
  if (message.type === "highlight") {
    // TODO: Highlight the selected text
  } else if (message.type === "definitions") {
    const data = message.data;
    data.forEach(entry => {
      entry.meanings.forEach(meaning => {
        meaning.definitions.forEach(definition => {
          definitions.push(definition.definition);
        });
      });
    });
    console.log(definitions);
  }
});

