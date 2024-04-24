let definitionsBox; // Declare a variable to hold the reference to the definitions box

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
        // Get the bounding rectangle of the selected text
        const selectionRect = window.getSelection().getRangeAt(0).getBoundingClientRect();
        // Create a new DOM element to display the definitions
        definitionsBox = document.createElement("div");
        definitionsBox.id = "definitions-box";
        // Style the definitions box
        definitionsBox.style.position = "absolute";
        definitionsBox.style.backgroundColor = "white";
        definitionsBox.style.border = "1px solid black";
        definitionsBox.style.padding = "5px";
        definitionsBox.style.top = selectionRect.bottom + window.scrollY + "px"; // Position below the selection
        definitionsBox.style.left = selectionRect.left + "px"; // Align with the left of the selection
        definitionsBox.style.zIndex = "9999"; // Ensure it's above other elements
        definitionsBox.style.height = "150px";
        definitionsBox.style.overflowY = "scroll";
        // Add each definition to the definitions box
        console.log(data);
        data.forEach(entry => {
          entry.meanings.forEach(meaning => {
            let partOfSpeechElement = "(" + meaning.partOfSpeech + ") ";
            meaning.definitions.forEach(definition => {
              const definitionElement = document.createElement("p");
              definitionElement.textContent = partOfSpeechElement + definition.definition;
              // Add additional styling to each definition element
              definitionElement.style.color = "black";
              definitionElement.style.fontFamily = "Arial, sans-serif";
              definitionElement.style.fontSize = "14px";
              definitionElement.style.margin = "0";
              definitionElement.style.padding = "2px 2px 2px 5px";
              // Add hover effect
              definitionElement.addEventListener("mouseenter", function() {
                definitionElement.style.backgroundColor = "#f0f0f0"; // Change background color on hover
              });
              definitionElement.addEventListener("mouseleave", function() {
                definitionElement.style.backgroundColor = "transparent"; // Restore background color on mouse leave
              });
              definitionsBox.appendChild(definitionElement);
            });
          });
        });
        // Append the definitions box to the body
        document.body.appendChild(definitionsBox);
      })
      .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
      });
  }
});

// Listen for the selectionchange event to detect when the user un-highlights their word
document.addEventListener("selectionchange", function() {
  if (definitionsBox) {
    definitionsBox.remove(); // Remove the definitions box if it exists
    definitionsBox = null; // Reset the reference to the definitions box
  }
});
