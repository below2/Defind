let definitionsBox; // Declare a variable to hold the reference to the definitions box
let selectedDefinitionsBox;
let selectionRect;
let selection;
let range;

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
        createDefinitionsBox();
        selection = window.getSelection();
        range = selection.getRangeAt(0);
        data.forEach((entry) => {
          entry.meanings.forEach((meaning) => {
            let partOfSpeech = "(" + meaning.partOfSpeech + ") ";
            meaning.definitions.forEach((definition) => {
              definitionsBox.appendChild(createDefinitionElement(definition, partOfSpeech));
            });
          });
        });
      })
      .catch((error) => {
        console.error("There was a problem with the fetch operation:", error);
      });
  }
});

function createDefinitionsBox() {
  selectionRect = window.getSelection().getRangeAt(0).getBoundingClientRect();
  definitionsBox = document.createElement("div");
  definitionsBox.id = "definitions-box";

  definitionsBox.style.position = "absolute";
  definitionsBox.style.backgroundColor = "white";
  definitionsBox.style.border = "1px solid black";
  definitionsBox.style.padding = "5px";
  definitionsBox.style.top = selectionRect.bottom + window.scrollY + "px";
  definitionsBox.style.left = selectionRect.left + "px";
  definitionsBox.style.zIndex = "9999";
  definitionsBox.style.height = "150px";
  definitionsBox.style.overflowY = "auto";
  definitionsBox.style.borderRadius = "8px";

  document.body.appendChild(definitionsBox);
}

function createDefinitionElement(definition, partOfSpeech) {
  const definitionElement = document.createElement("p");
  definitionElement.textContent = partOfSpeech + definition.definition;

  definitionElement.style.color = "black";
  definitionElement.style.fontFamily = "Arial, sans-serif";
  definitionElement.style.fontSize = "14px";
  definitionElement.style.margin = "0";
  definitionElement.style.padding = "2px 2px 2px 5px";

  definitionElement.addEventListener("mouseenter", function () {
    definitionElement.style.backgroundColor = "#f0f0f0";
  });
  definitionElement.addEventListener("mouseleave", function () {
    definitionElement.style.backgroundColor = "transparent";
  });

  definitionElement.addEventListener("click", function () {
    createSpan(definitionElement.textContent);
  });

  return definitionElement;
}

function createSpan(definition) {
  const span = document.createElement("span");
  span.style.fontWeight = "bold";
  span.style.color = "royalblue";
  span.style.fontStyle = "italic";

  span.addEventListener("mouseover", function () {
    span.style.cursor = "pointer"; // Change cursor to pointer when hovering
  });
  span.addEventListener("mouseout", function () {
    span.style.cursor = "default"; // Revert cursor to default when not hovering
  });

  span.addEventListener("click", function () {
    createSelectedDefinitionsBox(span, definition);
  });

  range.surroundContents(span);
  definitionsBox.remove();
}

function createSelectedDefinitionsBox(span, definition) {
  if (selectedDefinitionsBox) {
    selectedDefinitionsBox.remove();
    selectedDefinitionsBox = null;
  } else {
    const spanRect = span.getBoundingClientRect();
    selectedDefinitionsBox = document.createElement("div");
    
    selectedDefinitionsBox.style.position = "absolute";
    selectedDefinitionsBox.style.backgroundColor = "white";
    selectedDefinitionsBox.style.border = "1px solid black";
    selectedDefinitionsBox.style.padding = "5px";
    selectedDefinitionsBox.style.top = spanRect.bottom + window.scrollY + "px";
    selectedDefinitionsBox.style.left = spanRect.left + "px";
    selectedDefinitionsBox.style.zIndex = "9999";
    selectedDefinitionsBox.style.overflowY = "auto";
    selectedDefinitionsBox.style.borderRadius = "8px";

    const selectedDefinitionElement = document.createElement("p");
    selectedDefinitionElement.textContent = definition;
    selectedDefinitionElement.style.color = "black";
    selectedDefinitionElement.style.fontFamily = "Arial, sans-serif";
    selectedDefinitionElement.style.fontSize = "14px";
    selectedDefinitionElement.style.margin = "0";
    selectedDefinitionElement.style.padding = "2px 2px 2px 5px";
    // Add hover effect
    selectedDefinitionElement.addEventListener("mouseenter", function () {
      selectedDefinitionElement.style.backgroundColor = "#f0f0f0";
    });
    selectedDefinitionElement.addEventListener("mouseleave", function () {
      selectedDefinitionElement.style.backgroundColor = "transparent";
    });
    selectedDefinitionElement.addEventListener("click", function () {
      selectedDefinitionsBox.remove();
      selectedDefinitionsBox = null;
    });
    document.body.appendChild(selectedDefinitionsBox);
    selectedDefinitionsBox.appendChild(selectedDefinitionElement);
  }
}

// Listen for the selectionchange event to detect when the user un-highlights their word
// document.addEventListener("selectionchange", function () {
//   if (definitionsBox) {
//     definitionsBox.remove(); // Remove the definitions box if it exists
//     definitionsBox = null; // Reset the reference to the definitions box
//   }
// });
