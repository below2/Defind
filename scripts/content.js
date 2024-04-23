document.addEventListener("mouseup", function (event) {
  var selectedText = window.getSelection().toString().trim();
  if (selectedText !== "") {
    chrome.runtime.sendMessage({ type: "highlight", text: selectedText });
  }
});
