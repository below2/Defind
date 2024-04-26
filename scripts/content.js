const linkElement = document.createElement("link");
linkElement.rel = "stylesheet";
linkElement.type = "text/css";
linkElement.href = chrome.runtime.getURL("styles/styles.css");
document.head.appendChild(linkElement);

let menuContainer;
let tabsContainer;
let entriesContainer;
let selectedEntryContainer;
let range;

let definitions = [];
let synonyms = [];
let antonyms = [];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "fetchDefinitions") {
    range = window.getSelection().getRangeAt(0);
    const selectedText = window.getSelection().toString().trim();
    const apiUrl = "https://api.dictionaryapi.dev/api/v2/entries/en/" + encodeURIComponent(selectedText);

    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        initData(data);
        createMenuContainer();
        showDefinitions();
      })
      .catch((error) => {
        console.error("There was a problem with the fetch operation:", error);
      });
  }
});

function initData(data) {
  definitions = [];
  synonyms = [];
  antonyms = [];
  data.forEach((entry) => {
    // Extract definitions
    entry.meanings.forEach((meaning) => {
      meaning.definitions.forEach((definition) => {
        definitions.push({
          word: entry.word,
          partOfSpeech: meaning.partOfSpeech,
          definition: definition.definition,
        });
      });
    });

    // Extract synonyms
    meaningSynonyms = entry.meanings.flatMap((meaning) => meaning.synonyms);
    synonyms.push(
      ...meaningSynonyms.map((synonym) => ({
        word: entry.word,
        synonym: synonym,
      }))
    );

    // Extract antonyms
    meaningAntonyms = entry.meanings.flatMap((meaning) => meaning.antonyms);
    antonyms.push(
      ...meaningAntonyms.map((antonym) => ({
        word: entry.word,
        antonym: antonym,
      }))
    );
  });
}

function createMenuContainer() {
  menuContainer = document.createElement("div");
  menuContainer.classList.add("menuContainer");
  const selectionRect = range.getBoundingClientRect();
  menuContainer.style.top = selectionRect.bottom + window.scrollY + "px";
  menuContainer.style.left = selectionRect.left + "px";

  createTabs();
  createEntriesContainer();

  menuContainer.appendChild(tabsContainer);
  menuContainer.appendChild(entriesContainer);
  document.body.appendChild(menuContainer);
}

function createTabs() {
  tabsContainer = document.createElement("div");
  tabsContainer.classList.add("tabs");

  // Create Definitions tab
  const definitionsTab = document.createElement("button");
  definitionsTab.classList.add("tab", "active");
  definitionsTab.id = "definitionsTab";
  definitionsTab.textContent = "Definitions";
  definitionsTab.addEventListener("click", () => {
    definitionsTab.classList.add("active");
    synonymsTab.classList.remove("active");
    antonymsTab.classList.remove("active");
    entriesContainer.innerHTML = "";
    showDefinitions();
  });
  tabsContainer.appendChild(definitionsTab);

  // Create Synonyms tab
  const synonymsTab = document.createElement("button");
  synonymsTab.classList.add("tab");
  synonymsTab.id = "synonymsTab";
  synonymsTab.textContent = "Synonyms";
  synonymsTab.addEventListener("click", () => {
    definitionsTab.classList.remove("active");
    synonymsTab.classList.add("active");
    antonymsTab.classList.remove("active");
    entriesContainer.innerHTML = "";
    showSynonyms();
  });
  tabsContainer.appendChild(synonymsTab);

  // Create Antonyms tab
  const antonymsTab = document.createElement("button");
  antonymsTab.classList.add("tab");
  antonymsTab.id = "antonymsTab";
  antonymsTab.textContent = "Antonyms";
  antonymsTab.addEventListener("click", () => {
    definitionsTab.classList.remove("active");
    synonymsTab.classList.remove("active");
    antonymsTab.classList.add("active");
    entriesContainer.innerHTML = "";
    showAntonyms();
  });
  tabsContainer.appendChild(antonymsTab);
}

function showDefinitions() {
  definitions.forEach((definition) => {
    createEntry(definition, [], [], "definition");
  });
}

function showSynonyms() {
  synonyms.forEach((synonym) => {
    createEntry([], synonym, [], "synonym");
  });
}

function showAntonyms() {
  antonyms.forEach((antonym) => {
    createEntry([], [], antonym, "antonym");
  });
}

function createEntriesContainer() {
  entriesContainer = document.createElement("div");
  entriesContainer.classList.add("entryContainer");
}

function createEntry(definition, synonym, antonym, type) {
  const entry = document.createElement("p");
  if (type === "definition") {
    entry.textContent = "(" + definition.partOfSpeech + ") " + definition.definition;
    entry.classList.add("entry");
    entry.addEventListener("click", () => createSpan(entry.textContent));
  } else if (type === "synonym") {
    entry.textContent = synonym.synonym;
    entry.classList.add("entry", "synonym");
    entry.addEventListener("click", () => createSpan(synonym.synonym));
  } else if (type === "antonym") {
    entry.textContent = antonym.antonym;
    entry.classList.add("entry", "antonym");
    entry.addEventListener("click", () => createSpan(antonym.antonym));
  }
  entriesContainer.appendChild(entry);
}

function createSpan(entryText) {
  const span = document.createElement("span");
  span.classList.add("selectedWord");
  span.addEventListener("click", () => createSelectedEntryContainer(span, entryText));
  range.surroundContents(span);
  menuContainer.remove();
}

function createSelectedEntryContainer(span, entryText) {
  if (selectedEntryContainer) {
    selectedEntryContainer.remove();
    selectedEntryContainer = null;
  } else {
    const spanRect = span.getBoundingClientRect();
    selectedEntryContainer = document.createElement("div");
    selectedEntryContainer.classList.add("entryContainer");
    selectedEntryContainer.style.position = "absolute";
    selectedEntryContainer.style.top = spanRect.bottom + window.scrollY + "px";
    selectedEntryContainer.style.left = spanRect.left + "px";

    const selectedEntry = document.createElement("p");
    selectedEntry.textContent = entryText;
    selectedEntry.classList.add("entry");
    selectedEntry.addEventListener("click", () => {
      selectedEntryContainer.remove();
      selectedEntryContainer = null;
    });

    document.body.appendChild(selectedEntryContainer);
    selectedEntryContainer.appendChild(selectedEntry);
  }
}

document.addEventListener("selectionchange", function () {
  const selectionContainer = document.getSelection().focusNode;
  if (menuContainer && !menuContainer.contains(selectionContainer)) {
    menuContainer.remove();
  }
});