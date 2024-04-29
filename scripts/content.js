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
let selectedText;

let definitions = [];
let synonyms = [];
let antonyms = [];
let audio;
let pronunciation;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "fetchDefinitions") {
    range = window.getSelection().getRangeAt(0);
    selectedText = window.getSelection().toString().trim();
    let apiUrl = "https://dictionaryapi.com/api/v3/references/collegiate/json/" + encodeURIComponent(selectedText) + "?key=1f8aba8b-8b44-4786-93fd-dfc4ff0e94cf";

    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok (dictionary)");
        }
        return response.json();
      })
      .then((data) => {
        initDictionary(data);

        apiUrl = "https://dictionaryapi.com/api/v3/references/thesaurus/json/" + encodeURIComponent(selectedText) + "?key=c8637c2a-3400-4b00-983c-2a021f8ad004";
        fetch(apiUrl)
          .then((response) => {
            if (!response.ok) {
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
            console.error("There was a problem with the fetch operation (thesaurus):", error);
            console.error("Reverting to backup");

            apiUrl = "https://api.dictionaryapi.dev/api/v2/entries/en/" + encodeURIComponent(selectedText);
            fetch(apiUrl)
              .then((response) => {
                if (!response.ok) {
                  throw new Error("Network response was not ok (backup)");
                }
                return response.json();
              })
              .then((data) => {
                initDataBackup(data);
                createMenuContainer();
                showDefinitions();
              })
              .catch((error) => {
                console.error("There was a problem with the fetch operation (backup):", error);
              });
          });
      })
      .catch((error) => {
        console.error("There was a problem with the fetch operation (dictionary):", error);
        console.error("Reverting to backup");

        apiUrl = "https://api.dictionaryapi.dev/api/v2/entries/en/" + encodeURIComponent(selectedText);
        fetch(apiUrl)
          .then((response) => {
            if (!response.ok) {
              throw new Error("Network response was not ok (backup)");
            }
            return response.json();
          })
          .then((data) => {
            initDataBackup(data);
            createMenuContainer();
            showDefinitions();
          })
          .catch((error) => {
            console.error("There was a problem with the fetch operation (backup):", error);
          });
      });
  }
});

function initDictionary(data) {
  definitions = [];
  audio = null;
  pronunciation = null;

  const audioPrefix = data?.[0]?.hwi?.prs?.[0]?.sound?.audio;
  if (audioPrefix) {
    let subdirectory = "";
    if (audioPrefix.startsWith("bix")) {
      subdirectory = "bix";
    } else if (audioPrefix.startsWith("gg")) {
      subdirectory = "gg";
    } else if (/^[0-9\W]/.test(audioPrefix)) {
      subdirectory = "number";
    } else {
      subdirectory = audioPrefix.substring(0, 1);
    }
    const audioURL = `https://media.merriam-webster.com/audio/prons/en/us/mp3/${subdirectory}/${audioPrefix}.mp3`;
    audio = new Audio(audioURL);
    pronunciation = data?.[0]?.hwi?.prs?.[0]?.mw;
  }

  const partOfSpeech = data?.[0]?.fl;
  if (partOfSpeech) {
    data.forEach((entry) => {
      const shortDefinitions = entry.shortdef ?? [];
      shortDefinitions.forEach((def) => {
        definitions.push({
          partOfSpeech: partOfSpeech,
          definition: def,
        });
      });
    });
  }
}


function initThesaurus(data) {
  synonyms = [];
  antonyms = [];

  const synonymsData = data?.[0]?.meta?.syns ?? [];
  const antonymsData = data?.[0]?.meta?.ants ?? [];

  synonymsData.forEach((synList) => {
    synList.forEach((syn) => {
      synonyms.push({ synonym: syn });
    });
  });

  antonymsData.forEach((antList) => {
    antList.forEach((ant) => {
      antonyms.push({ antonym: ant });
    });
  });
}


function initDataBackup(data) {
  definitions = [];
  synonyms = [];
  antonyms = [];
  audio = null;
  pronunciation = null;

  if (data?.[0]?.phonetics?.[1]?.audio && data?.[0]?.phonetic) {
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
    menuContainer.style.right = screenWidth - selectionRect.right - scrollbarWidth + "px";
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
  const searchWordContainer = document.createElement("div");
  searchWordContainer.classList.add("searchWordContainer");
  const phoneticsContainer = document.createElement("div");
  phoneticsContainer.classList.add("phoneticsContainer");

  const searchWordEntry = document.createElement("p");
  searchWordEntry.classList.add("searchWordEntry");
  searchWordEntry.textContent = selectedText.charAt(0).toUpperCase() + selectedText.slice(1);
  const phonetics = document.createElement("p");
  phonetics.classList.add("phonetics");
  phonetics.textContent = pronunciation;

  const speakerIcon = document.createElement("i");
  if (audio) {
    speakerIcon.classList.add("fas", "fa-volume-up");
    speakerIcon.classList.add("speakerIcon");
    speakerIcon.addEventListener("click", () => {
      audio.play();
    });
  } else {
    speakerIcon.classList.add("fas", "fa-volume-up");
    speakerIcon.classList.add("speakerIcon");
    speakerIcon.style.color = "lightgray";
  }

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
    selectedEntryContainer = document.createElement("div");
    selectedEntryContainer.classList.add("selectedEntryContainer");

    const screenWidth = window.innerWidth;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const isLeftScreen = spanRect.left < screenWidth / 2;
    if (isLeftScreen) {
      selectedEntryContainer.style.left = spanRect.left + "px";
    } else {
      selectedEntryContainer.style.right = screenWidth - spanRect.right - scrollbarWidth + "px";
    }

    selectedEntryContainer.style.top = spanRect.bottom + window.scrollY + "px";

    const selectedEntry = document.createElement("p");
    selectedEntry.classList.add("selectedEntry");
    selectedEntry.textContent = entryText;
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
