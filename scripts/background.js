chrome.runtime.onInstalled.addListener(function () {
  chrome.contextMenus.create({
    id: "define",
    title: "Define",
    contexts: ["selection"],
  });
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.type === "highlight") {
    var apiUrl =
      "https://api.dictionaryapi.dev/api/v2/entries/en/" +
      encodeURIComponent(message.text);
    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        console.log(data);
      })
      .catch((error) => {
        console.error("There was a problem with the fetch operation:", error);
      });
  }
});
