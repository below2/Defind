const linkElement = document.createElement("link");
linkElement.rel = "stylesheet";
linkElement.type = "text/css";
linkElement.href = chrome.runtime.getURL("styles/styles.css");
document.head.appendChild(linkElement);

let definitionsBox;
let selectedDefinitionsBox;
let range;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "fetchDefinitions") {
    range = window.getSelection().getRangeAt(0);
    const selectedText = window.getSelection().toString().trim();
    const apiUrl = "https://api.dictionaryapi.dev/api/v2/entries/en/" + encodeURIComponent(selectedText);

    fetch(apiUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then(data => {
        createDefinitionsBox();
        data.forEach(entry => {
          entry.meanings.forEach(meaning => {
            meaning.definitions.forEach(definition => {
              createDefinitionElement(definition.definition, meaning.partOfSpeech);
            });
          });
        });
      })
      .catch(error => {
        console.error("There was a problem with the fetch operation:", error);
      });
  }
});

function createDefinitionsBox() {
  const selectionRect = range.getBoundingClientRect();

  menuContainer = document.createElement("div");
  menuContainer.classList.add("menuContainer");
  menuContainer.style.top = selectionRect.bottom + window.scrollY + "px";
  menuContainer.style.left = selectionRect.left + "px";
  menuContainer.style.width = "500px";
  menuContainer.style.backgroundColor = "transparent";
  menuContainer.style.transform = "translateY(-21px)";

  definitionsBox = document.createElement("div");
  definitionsBox.classList.add("definitionsBox");
  definitionsBox.style.transform = "translateY(21px)";

  // Create tabs container
  const tabsContainer = document.createElement("div");
  tabsContainer.classList.add("tabs");

  // Create Definitions tab
  const definitionsTab = document.createElement("button");
  definitionsTab.classList.add("tab", "active");
  definitionsTab.id = "definitionsTab";
  definitionsTab.textContent = "Definitions";
  tabsContainer.appendChild(definitionsTab);

  // Create Synonyms tab
  const synonymsTab = document.createElement("button");
  synonymsTab.classList.add("tab");
  synonymsTab.id = "synonymsTab";
  synonymsTab.textContent = "Synonyms";
  tabsContainer.appendChild(synonymsTab);

  // Create Antonyms tab
  const antonymsTab = document.createElement("button");
  antonymsTab.classList.add("tab");
  antonymsTab.id = "antonymsTab";
  antonymsTab.textContent = "Antonyms";
  tabsContainer.appendChild(antonymsTab);

  // Append tabs container to definitions box
  menuContainer.appendChild(tabsContainer);
  menuContainer.appendChild(definitionsBox);

  document.body.appendChild(menuContainer);
  // document.body.appendChild(definitionsBox);
}

function createDefinitionElement(definitionText, partOfSpeech) {
  const definitionElement = document.createElement("p");
  definitionElement.textContent = "(" + partOfSpeech + ") " + definitionText;
  definitionElement.classList.add("definition");
  definitionElement.addEventListener("click", () => createSpan(definitionElement.textContent));
  definitionsBox.appendChild(definitionElement);
  return definitionElement;
}

function createSpan(definition) {
  const span = document.createElement("span");
  span.classList.add("definedWord");
  span.addEventListener("click", () => createSelectedDefinitionsBox(span, definition));
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

    const selectedDefinitionElement = document.createElement("p");
    selectedDefinitionElement.textContent = definition;
    selectedDefinitionElement.classList.add("definition");
    selectedDefinitionElement.addEventListener("click", () => {
      selectedDefinitionsBox.remove();
      selectedDefinitionsBox = null;
    });

    document.body.appendChild(selectedDefinitionsBox);
    selectedDefinitionsBox.appendChild(selectedDefinitionElement);
  }
}
