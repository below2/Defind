chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.type === "fetchDefinitions") {
    var selectedText = window.getSelection().toString().trim();
    var apiUrl = "https://api.dictionaryapi.dev/api/v2/entries/en/" + encodeURIComponent(selectedText);
    fetch(apiUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        chrome.runtime.sendMessage({ type: "definitions", data: data });
      })
      .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
      });
  }
});

