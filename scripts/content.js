const linkElement = document.createElement('link');
linkElement.rel = 'stylesheet';
linkElement.type = 'text/css';
linkElement.href = chrome.runtime.getURL('styles/styles.css');
document.head.appendChild(linkElement);

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
              definitionsBox.appendChild(createDefinition(definition.definition, partOfSpeech));
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

  definitionsBox.classList.add("definitionsBox");
  definitionsBox.style.top = selectionRect.bottom + window.scrollY + "px";
  definitionsBox.style.left = selectionRect.left + "px";

  document.body.appendChild(definitionsBox);
}

function createDefinition(definitionText, partOfSpeech) {
  const definition = document.createElement("p");
  definition.textContent = partOfSpeech + definitionText;

  definition.classList.add("definition");

  definition.addEventListener("click", function () {
    createSpan(definition.textContent);
  });

  return definition;
}

function createSpan(definition) {
  const span = document.createElement("span");
  span.classList.add("definedWord");

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
    
    selectedDefinitionsBox.classList.add("definitionsBox");
    selectedDefinitionsBox.style.top = spanRect.bottom + window.scrollY + "px";
    selectedDefinitionsBox.style.left = spanRect.left + "px";

    const selectedDefinition = document.createElement("p");
    selectedDefinition.textContent = definition;
    selectedDefinition.classList.add("definition");

    selectedDefinition.addEventListener("click", function () {
      selectedDefinitionsBox.remove();
      selectedDefinitionsBox = null;
    });
    document.body.appendChild(selectedDefinitionsBox);
    selectedDefinitionsBox.appendChild(selectedDefinition);
  }
}

// Listen for the selectionchange event to detect when the user un-highlights their word
// document.addEventListener("selectionchange", function () {
//   if (definitionsBox) {
//     definitionsBox.remove(); // Remove the definitions box if it exists
//     definitionsBox = null; // Reset the reference to the definitions box
//   }
// });
