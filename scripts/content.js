let definitionsBox; // Declare a variable to hold the reference to the definitions box
let testBox;
let definition;
let selectionRect;

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.type === "fetchDefinitions") {
    var selectedText = window.getSelection().toString().trim();
    var apiUrl =
      "https://api.dictionaryapi.dev/api/v2/entries/en/" +
      encodeURIComponent(selectedText);
    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        // Get the bounding rectangle of the selected text
        selectionRect = window
          .getSelection()
          .getRangeAt(0)
          .getBoundingClientRect();
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
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        data.forEach((entry) => {
          entry.meanings.forEach((meaning) => {
            let partOfSpeechElement = "(" + meaning.partOfSpeech + ") ";
            meaning.definitions.forEach((definition) => {
              const definitionElement = document.createElement("p");
              definitionElement.textContent =
                partOfSpeechElement + definition.definition;
              // Add additional styling to each definition element
              definitionElement.style.color = "black";
              definitionElement.style.fontFamily = "Arial, sans-serif";
              definitionElement.style.fontSize = "14px";
              definitionElement.style.margin = "0";
              definitionElement.style.padding = "2px 2px 2px 5px";
              // Add hover effect
              definitionElement.addEventListener("mouseenter", function () {
                definitionElement.style.backgroundColor = "#f0f0f0"; // Change background color on hover
              });
              definitionElement.addEventListener("mouseleave", function () {
                definitionElement.style.backgroundColor = "transparent"; // Restore background color on mouse leave
              });
              // Add click event listener to underline the highlighted word
              definitionElement.addEventListener("click", function () {
                definition = definitionElement.textContent;
                const span = document.createElement("span");
                span.style.fontWeight = "bold";
                span.style.color = "royalblue";
                span.style.fontStyle = "italic";
                range.surroundContents(span);
                // Remove the definitions box after underlining the word
                definitionsBox.remove();
              });
              definitionsBox.appendChild(definitionElement);
            });
          });
        });
        // Append the definitions box to the body
        document.body.appendChild(definitionsBox);
      })
      .catch((error) => {
        console.error("There was a problem with the fetch operation:", error);
      });
  }
});

// Add event listener to the body for clicks on the highlighted word
document.body.addEventListener("click", function (event) {
  const target = event.target;
  if (
    target.tagName === "SPAN" &&
    target.style.fontWeight === "bold" &&
    target.style.color === "royalblue" &&
    target.style.fontStyle === "italic"
  ) {
    // Create a new DOM element to display the definitions
    testBox = document.createElement("div");
    testBox.id = "definitions-box";
    // Style the definitions box
    testBox.style.position = "absolute";
    testBox.style.backgroundColor = "white";
    testBox.style.border = "1px solid black";
    testBox.style.padding = "5px";
    testBox.style.top = selectionRect.bottom + window.scrollY + "px"; // Position below the selection
    testBox.style.left = selectionRect.left + "px"; // Align with the left of the selection
    testBox.style.zIndex = "9999"; // Ensure it's above other elements
    testBox.style.height = "150px";
    testBox.style.overflowY = "scroll";
    const definitionElement = document.createElement("p");
    definitionElement.textContent = definition;
    // Add additional styling to each definition element
    definitionElement.style.color = "black";
    definitionElement.style.fontFamily = "Arial, sans-serif";
    definitionElement.style.fontSize = "14px";
    definitionElement.style.margin = "0";
    definitionElement.style.padding = "2px 2px 2px 5px";
    // Add hover effect
    definitionElement.addEventListener("mouseenter", function () {
      definitionElement.style.backgroundColor = "#f0f0f0"; // Change background color on hover
    });
    definitionElement.addEventListener("mouseleave", function () {
      definitionElement.style.backgroundColor = "transparent"; // Restore background color on mouse leave
    });
    testBox.appendChild(definitionElement);
  }
});

// Listen for the selectionchange event to detect when the user un-highlights their word
// document.addEventListener("selectionchange", function () {
//   if (definitionsBox) {
//     definitionsBox.remove(); // Remove the definitions box if it exists
//     definitionsBox = null; // Reset the reference to the definitions box
//   }
// });
