const linkElement = document.createElement("link");
linkElement.rel = "stylesheet";
linkElement.type = "text/css";
linkElement.href = chrome.runtime.getURL("styles/styles.css");
const iconLinkElement = document.createElement("link");
iconLinkElement.rel = "stylesheet";
iconLinkElement.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css";
document.head.appendChild(linkElement);
document.head.appendChild(iconLinkElement);

let menuContainer;
let tabsContainer;
let entriesContainer;
let selectedEntryContainer;
let range;

let definitions = [];
let synonyms = [];
let antonyms = [];
let audio;
let pronunciation;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "fetchDefinitions") {
    range = window.getSelection().getRangeAt(0);
    const selectedText = window.getSelection().toString().trim();
    let apiUrl = "https://dictionaryapi.com/api/v3/references/collegiate/json/" + encodeURIComponent(selectedText) + "?key=1f8aba8b-8b44-4786-93fd-dfc4ff0e94cf";

    let apiPass = false;
    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok (dictionary)");
        }
        return response.json();
      })
      .then((data) => {
        apiPass = true
        initDictionary(data);
      })
      .catch((error) => {
        console.error("There was a problem with the fetch operation (dictionary):", error);
        console.error("Reverting to backup");
      });

    if (apiPass) {
      apiUrl = "https://dictionaryapi.com/api/v3/references/thesaurus/json/" + encodeURIComponent(selectedText) + "?key=c8637c2a-3400-4b00-983c-2a021f8ad004";
      fetch(apiUrl)
        .then((response) => {
          if (!response.ok) {
            apiPass = false;
            throw new Error("Network response was not ok (thesaurus)");
          }
          return response.json();
        })
        .then((data) => {
          initThesaurus(data);
          createMenuContainer();
          showDefinitions();
        })
        .catch((error) => {
          apiPass = false;
          console.error("There was a problem with the fetch operation (thesaurus):", error);
          console.error("Reverting to backup");
        });
    }

    if (!apiPass || definitions.length === 0) {
      apiUrl = "https://api.dictionaryapi.dev/api/v2/entries/en/" + encodeURIComponent(selectedText);
      fetch(apiUrl)
        .then((response) => {
          if (!response.ok) {
            apiPass = false;
            throw new Error("Network response was not ok (thesaurus)");
          }
          return response.json();
        })
        .then((data) => {
          initDataBackup(data);
          createMenuContainer();
          showDefinitions();
        })
        .catch((error) => {
          apiPass = false;
          console.error("There was a problem with the fetch operation (backup):", error);
        });
    }
  }
});

function initDictionary(data) {
  definitions = [];
  audio = null;
  pronunciation = null;

  if (data[0].hwi) {
    let subdirectory = "";
    if (data[0].hwi.prs[0].sound.audio.substring(0, 3) === "bix") {
      subdirectory = "bix";
    } else if (data[0].hwi.prs[0].sound.audio.substring(0, 2) === "gg") {
      subdirectory = "gg";
    } else if (/^[0-9\W]/.test(data[0].hwi.prs[0].sound.audio)) {
      subdirectory = "number";
    } else {
      subdirectory = data[0].hwi.prs[0].sound.audio.substring(0, 1);
    }
    audio = new Audio("https://media.merriam-webster.com/audio/prons/en/us/mp3/" + subdirectory + "/" + data[0].hwi.prs[0].sound.audio + ".mp3")

    pronunciation = data[0].hwi.prs[0].mw;
  }

  

  if (data[0].fl) {
    data.forEach((entry) => {
      let partOfSpeech = entry.fl;
      entry.shortdef.forEach((def) => {
        definitions.push({
          partOfSpeech: partOfSpeech,
          definition: def,
        });
      })
    });
  }
}

function initThesaurus(data) {
  synonyms = [];
  antonyms = [];

  if (data[0].meta.syns) {
    data[0].meta.syns.forEach((synList) => {
      synList.forEach((syn) => {
        synonyms.push({ synonym: syn });
      })
    })
  }

  if (data[0].meta.ants) {
    data[0].meta.ants.forEach((antList) => {
      antList.forEach((ant) => {
        antonyms.push({ antonym: ant });
      })
    })
  }
}

function initDataBackup(data) {
  definitions = [];
  synonyms = [];
  antonyms = [];
  audio = null;
  pronunciation = null;

  if (data[0].phonetics[1] && data[0].phonetic) {
    audio = new Audio(data[0].phonetics[1].audio);
    pronunciation = data[0].phonetic;
  }

  data.forEach((entry) => {
    entry.meanings.forEach((meaning) => {
      meaning.definitions.forEach((definition) => {
        definitions.push({
          partOfSpeech: meaning.partOfSpeech,
          definition: definition.definition,
        });
      });
    });

    meaningSynonyms = entry.meanings.flatMap((meaning) => meaning.synonyms);
    synonyms.push(
      ...meaningSynonyms.map((synonym) => ({
        synonym: synonym,
      }))
    );

    meaningAntonyms = entry.meanings.flatMap((meaning) => meaning.antonyms);
    antonyms.push(
      ...meaningAntonyms.map((antonym) => ({
        antonym: antonym,
      }))
    );
  });
}

function createMenuContainer() {
  menuContainer = document.createElement("div");
  menuContainer.classList.add("menuContainer");

  const selectionRect = range.getBoundingClientRect();
  const screenWidth = window.innerWidth;
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  const isLeftScreen = selectionRect.left < screenWidth / 2;
  if (isLeftScreen) {
    menuContainer.style.left = selectionRect.left + "px";
  } else {
    menuContainer.style.right = (screenWidth - selectionRect.right - scrollbarWidth) + "px";
  }

  menuContainer.style.top = selectionRect.bottom + window.scrollY + "px";

  createTabs(isLeftScreen);
  createEntriesContainer(isLeftScreen);

  menuContainer.appendChild(tabsContainer);
  menuContainer.appendChild(entriesContainer);
  document.body.appendChild(menuContainer);
}

function createTabs(isLeftScreen) {
  tabsContainer = document.createElement("div");
  tabsContainer.classList.add("tabs");
  if (!isLeftScreen) {
    tabsContainer.style.justifyContent = "left";
  }

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
  if (definitions.length !== 0) {
    createSearchWordEntry();
    definitions.forEach((definition) => {
      createEntry(definition, [], [], "definition");
    });
  } else {
    createEmptyEntry("definition");
  }
}

function showSynonyms() {
  if (synonyms.length !== 0) {
    createSearchWordEntry();
    synonyms.forEach((synonym) => {
      createEntry([], synonym, [], "synonym");
    });
  } else {
    createEmptyEntry("synonym");
  }
}

function showAntonyms() {
  if (antonyms.length !== 0) {
    createSearchWordEntry();
    antonyms.forEach((antonym) => {
      createEntry([], [], antonym, "antonym");
    });
  } else {
    createEmptyEntry("antonym");
  }
}

function createSearchWordEntry() {
  //TODO: make these into class(es)
  const searchWordContainer = document.createElement("div");
  searchWordContainer.style.display = "flex";
  searchWordContainer.style.justifyContent = "space-between";
  const phoneticsContainer = document.createElement("div");
  phoneticsContainer.style.display = "flex";
  const searchWordEntry = document.createElement("p");
  searchWordEntry.classList.add("searchWordEntry");
  const phonetics = document.createElement("p");
  phonetics.classList.add("phonetics");
  phonetics.textContent = pronunciation;
  const selectedText = window.getSelection().toString().trim();
  searchWordEntry.textContent = selectedText.charAt(0).toUpperCase() + selectedText.slice(1);

  const speakerIcon = document.createElement("i");
  speakerIcon.classList.add("fas", "fa-volume-up");
  speakerIcon.style.alignContent = "center";
  speakerIcon.style.paddingRight = "5px";
  speakerIcon.addEventListener("click", () => {
    audio.play();
  });

  phoneticsContainer.appendChild(searchWordEntry);
  phoneticsContainer.appendChild(phonetics);
  searchWordContainer.appendChild(phoneticsContainer);
  searchWordContainer.appendChild(speakerIcon);
  entriesContainer.appendChild(searchWordContainer);
}

function createEntriesContainer(isLeftScreen) {
  entriesContainer = document.createElement("div");
  entriesContainer.classList.add("entryContainer");
  if (!isLeftScreen) {
    entriesContainer.style.borderTopLeftRadius = "0px";
  }
}

function createEmptyEntry(type) {
  const emptyEntry = document.createElement("p");
  emptyEntry.textContent = "No " + type + "s found";
  emptyEntry.classList.add("entry");

  emptyEntry.addEventListener("click", () => {
    menuContainer.remove();
  });

  entriesContainer.appendChild(emptyEntry);
}

function createEntry(definition, synonym, antonym, type) {
  const entry = document.createElement("p");
  if (type === "definition") {
    entry.textContent = "(" + definition.partOfSpeech + ") " + definition.definition;
    entry.classList.add("entry");
    entry.addEventListener("click", () => createSpan(entry.textContent, type));
  } else if (type === "synonym") {
    entry.textContent = synonym.synonym;
    entry.classList.add("entry", "synonym");
    entry.addEventListener("click", () => createSpan(synonym.synonym, type));
  } else if (type === "antonym") {
    entry.textContent = antonym.antonym;
    entry.classList.add("entry", "antonym");
    entry.addEventListener("click", () => createSpan(antonym.antonym, type));
  }
  entriesContainer.appendChild(entry);
}

function createSpan(entryText, type) {
  const span = document.createElement("span");
  span.classList.add("selectedWord");
  if (type === "definition") {
    span.addEventListener("click", (event) => {
      event.stopPropagation();
      createSelectedEntryContainer(span, entryText);
    });
  } else if (type === "synonym") {
    span.addEventListener("click", (event) => {
      event.stopPropagation();
      createSelectedEntryContainer(span, "(synonym) " + entryText);
    });
  } else if (type === "antonym") {
    span.addEventListener("click", (event) => {
      event.stopPropagation();
      createSelectedEntryContainer(span, "(antonym) " + entryText);
    });
  }
  range.surroundContents(span);
  menuContainer.remove();
}

function createSelectedEntryContainer(span, entryText) {
  if (selectedEntryContainer) {
    selectedEntryContainer.remove();
    selectedEntryContainer = null;
  } else {
    const spanRect = span.getBoundingClientRect();
    //TODO: make own class
    selectedEntryContainer = document.createElement("div");
    selectedEntryContainer.classList.add("entryContainer");
    selectedEntryContainer.style.position = "absolute";
    selectedEntryContainer.style.borderTopRightRadius = "10px";
    selectedEntryContainer.style.borderBottomRightRadius = "10px";

    const screenWidth = window.innerWidth;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const isLeftScreen = spanRect.left < screenWidth / 2;
    if (isLeftScreen) {
      selectedEntryContainer.style.left = spanRect.left + "px";
    } else {
      selectedEntryContainer.style.right = (screenWidth - spanRect.right - scrollbarWidth) + "px";
    }

    selectedEntryContainer.style.top = spanRect.bottom + window.scrollY + "px";

    const selectedEntry = document.createElement("p");
    selectedEntry.textContent = entryText;
    selectedEntry.classList.add("entry");
    selectedEntry.style.borderBottom = "none";
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

document.addEventListener("click", () => {
  if (selectedEntryContainer) {
    selectedEntryContainer.remove();
    selectedEntryContainer = null;
  }
});