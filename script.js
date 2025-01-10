// Components
const cardContainer = document.getElementById('card-container');
const cardPopup = document.getElementById('card-popup');
const popupContent = document.getElementById('popup-content');
const scrollTopButton = document.getElementById('scroll-top');
const loadingBar = document.getElementById('loading-bar');
const loadingContext = document.getElementById('loading-context');

// Filters
const rarityFilter = document.getElementById('rarity-filter');
const setFilter = document.getElementById('set-filter');
const artistFilter = document.getElementById('artist-filter');
const typeFilter = document.getElementById('type-filter');
const holoFilter = document.getElementById('holo-filter');
const countFilter = document.getElementById('count-filter');
const searchQuery = document.getElementById('searchQuery');

// URLs
const apiUrl = 'https://api.pokemontcg.io/v2/';

// Arrays and Variables
let cardsData = [];
let csvData = [];
let filteredCards = [];
let displayCardsData = [];
let cachedCardsData = [];
let sortOrder = 1;
let header;
const setNameToIdMap = {};

// Year in Footer
const currentYear = new Date().getFullYear();
document.getElementById("year").innerHTML = currentYear;
document.getElementById("year2").innerHTML = currentYear;

// Dark Mode Initialization
if (localStorage.getItem("darkMode") === "true") {
    document.body.classList.add("dark-mode");
}

// Toggle Dark Mode
function darkmode() {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
}

// Clear Button
const clearButton = document.getElementById("clearButton");

function toggleClearButton() {
    const searchQueryValue = document.getElementById("searchQuery").value.trim();
    clearButton.style.display = searchQueryValue ? "block" : "none";
}

function clearSearchQuery() {
    document.getElementById("searchQuery").value = "";
    toggleClearButton();
    if(pokemonNames.length > 0) applyFilters();
}

// Random Search
const random = document.getElementById('randomButton');
function performRandomSearch(){
    const randomIndex = Math.floor(Math.random() * pokemonNames.length);
    searchQuery.value = pokemonNames[randomIndex];
    toggleClearButton();
    applyFilters();
}

random.addEventListener('click', () => {
    if(pokemonNames.length > 0) performRandomSearch();
});

document.addEventListener("keydown", (event) => {
    if (!event.altKey && event.key.toLowerCase() === '`') {
        event.preventDefault();
        if(pokemonNames.length > 0) performRandomSearch();
    }
});

// Clear searchQuery
searchQuery.addEventListener('input',()=>{
    if(pokemonNames.length > 0 && searchQuery.value.length === 0) applyFilters();
});

// Move to search bar when input "/"
document.addEventListener('keydown', function (event) {
    if (event.key === '/') {
      event.preventDefault();
      searchQuery.focus();
    }
});

// Dropdown menu
let currentFocus = -1;
let pokemonNames = [];

const pokemonDropdown = document.getElementById('pokemonDropdown');
searchQuery.addEventListener('input', () => {
    if (searchQuery.value.length >= 1) {
        suggestPokemon(pokemonNames);
        clearButton.style.display = 'block';
    } else {
        // Hide dropdown if input is empty
        pokemonDropdown.style.display = 'none';
        clearButton.style.display = 'none';
    }
});

searchQuery.addEventListener('keydown', handleKeydown);
searchQuery.addEventListener('click', () => {
    if (searchQuery.value.length >= 1) {
        suggestPokemon(pokemonNames);
        clearButton.style.display = 'block';
    } else {
        // Hide dropdown if input is empty
        pokemonDropdown.style.display = 'none';
        clearButton.style.display = 'none';
    }
    scrollIntoView();
});

// Hide the dropdown when clicking outside of it
window.addEventListener('click', (event) => {
    if (!event.target.matches(`#${searchQuery.id}`)) {
        pokemonDropdown.style.display = 'none';
    }
});

// Function to calculate Levenshtein distance between two strings
function levenshteinDistance(str1, str2) {
  const lenStr1 = str1.length + 1;
  const lenStr2 = str2.length + 1;

  // Create a matrix to store the distances
  const matrix = new Array(lenStr1);
  for (let i = 0; i < lenStr1; i++) {
      matrix[i] = new Array(lenStr2);
      matrix[i][0] = i;
  }

  for (let j = 0; j < lenStr2; j++) {
      matrix[0][j] = j;
  }

  // Fill in the matrix with the minimum distances
  for (let i = 1; i < lenStr1; i++) {
      for (let j = 1; j < lenStr2; j++) {
          const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
          matrix[i][j] = Math.min(
              matrix[i - 1][j] + 1,       // deletion
              matrix[i][j - 1] + 1,       // insertion
              matrix[i - 1][j - 1] + cost // substitution
          );
      }
  }

  // The bottom-right cell of the matrix contains the Levenshtein distance
  return matrix[lenStr1 - 1][lenStr2 - 1];
}

// Function to suggest Pokémon with flexible matching and sort by relevance
function suggestPokemon(pokemonNames) {
  const searchTerm = searchQuery.value.toLowerCase().trim();

  // Escape special characters in the search term
  const escapedSearchTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Create a regular expression for flexible matching
  const regex = new RegExp(escapedSearchTerm.split('').join('.*'));

  // Filter Pokémon names based on the user's input and flexible matching
  const suggestions = pokemonNames.filter(name =>
      name.toLowerCase().match(regex)
  );

  // Sort suggestions by Levenshtein distance and then alphabetically
  const sortedSuggestions = suggestions.sort((a, b) => {
      const distanceA = levenshteinDistance(a, searchTerm);
      const distanceB = levenshteinDistance(b, searchTerm);

      if (distanceA !== distanceB) {
          return distanceA - distanceB;
      } else {
          return a.localeCompare(b);
      }
  });
  
  updateDropdown(sortedSuggestions);
}

// Update the dropdown with suggestions
function updateDropdown(suggestions) {
  pokemonDropdown.innerHTML = '';

  // Populate the dropdown with new suggestions
  suggestions.forEach((name, index) => {
      const suggestionItem = document.createElement('div');
      suggestionItem.textContent = name;
      suggestionItem.addEventListener('click', () => {
          // Set the selected suggestion in the search input and perform search
          searchQuery.value = name;
          pokemonDropdown.style.display = 'none';
          if(pokemonNames.length>0) applyFilters();
      });

      // Highlight the suggestion on hover
      suggestionItem.addEventListener('mouseover', () => {
          currentFocus = index;
          addActive();
      });

      // Remove highlight when mouse moves away
      suggestionItem.addEventListener('mouseout', () => {
          currentFocus = -1;
          addActive();
      });

      pokemonDropdown.appendChild(suggestionItem);
  });

  // Display the dropdown if there are suggestions, otherwise hide it
  pokemonDropdown.style.display = suggestions.length > 0 ? 'block' : 'none';
  currentFocus = -1; // Reset the focus when updating the suggestions

  scrollIntoView();
}

// Manage Key Input (Down, Up, Enter)
function handleKeydown(event) {
  const suggestions = document.querySelectorAll('#pokemonDropdown div');

  if (event.key === 'ArrowDown' && suggestions.length > 0 && searchQuery.value.length >= 1) {
      currentFocus = (currentFocus + 1) % suggestions.length;
      searchQuery.value = suggestions[currentFocus].textContent;
      addActive();
  } else if (event.key === 'ArrowUp' && suggestions.length > 0 && searchQuery.value.length >= 1) {
      if (currentFocus === -1) {
          currentFocus = suggestions.length - 1;
      } else {
          currentFocus = (currentFocus - 1 + suggestions.length) % suggestions.length;
      }
      searchQuery.value = suggestions[currentFocus].textContent;
      addActive();
  } else if (event.key === 'Enter') {
      if (currentFocus > -1) {
          pokemonDropdown.innerHTML = '';
          pokemonDropdown.style.display = 'none';
      }
  }
  scrollIntoView();
}

// Change menu color when highlighted
function addActive() {
  const suggestions = document.querySelectorAll('#pokemonDropdown div');
  
  suggestions.forEach((item, index) => {
      if (index === currentFocus) {
          item.classList.add('active');
      } else {
          item.classList.remove('active');
      }
  });
  scrollIntoView();
}

// Adjust the scroll position to make the focused suggestion visible
function scrollIntoView() {
  const activeItem = document.querySelector('.active');
  if (activeItem) {
      activeItem.scrollIntoView({
          block: 'nearest',
      });
  }
}

document.getElementById('clearButton').addEventListener('click', clearInput);
// Clear context in search input
function clearInput() {
  searchQuery.value = '';
  pokemonDropdown.style.display = 'none';
  clearButton.style.display = 'none';
}

// Take CSV file
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        fetchCSVData(file).then(data => {
            document.getElementById('alert').style.display = 'none';
            csvData = data;
            fetchAllSets();
        });
    }
}

// Take CSV data
async function fetchCSVData(file) {
    try {
        const data = await file.text();
        const lines = data.split('\n').filter(line => line.trim()); // Filter out empty lines

        // Check if the header has all the required columns
        header = lines[0].split(',').map(column => column.trim()); // Trim whitespace
        holoFilter.innerHTML += `<option value="">🔍${header[2] || ''}</option>`;

        const requiredColumns = ['Sets', 'Number']; // Adjust column names if needed
        const missingColumns = requiredColumns.filter(column => !header.includes(column));

        if (missingColumns.length > 0) {
            throw new Error('There are some missing columns in CSV');
        }

        // Track duplicates
        const cardCount = {};

        // Parse CSV rows and count duplicates
        const uniqueCards = [];
        lines.slice(1).forEach(line => {
            const [set, number, foil] = line.split(',').map(item => item.trim()); 
            const cardKey = `${set}-${number}-${foil || ''}`; 
            
            // Increment the count for each unique card combination
            cardCount[cardKey] = (cardCount[cardKey] || 0) + 1;

            // Add to uniqueCards only if this is the first occurrence
            if (cardCount[cardKey] === 1) {
                uniqueCards.push({ set, number, foil });
            }
        });

        // Add the count back to each unique card object based on our cardCount dictionary
        return uniqueCards.map(card => ({
            ...card,
            count: cardCount[`${card.set}-${card.number}-${card.foil || ''}`]
        }));
    } catch (error) {
        alert('Error fetching CSV data: ' + error.message);
        throw error;
    }
}

// Fetch to each sets
async function fetchAllSets() {
    loadingContext.innerText = 'Fetching Sets...';

    const sets = [...new Set(csvData.map(card => card.set))];
    const validSets = sets.filter(set => set !== "N/A" && set !== undefined);
    const totalSets = validSets.length; // Total number of sets to process
    let completedSets = 0;              // Counter for processed sets

    // Create an async iterator that fetches each set and updates progress dynamically
    const fetchIterator = validSets.map(async (set) => {
        const formattedSetName = set.replace(/\s/g, '.');
        try {
            const response = await fetch(`${apiUrl}cards?q=set.name:${formattedSetName}`);
            if (!response.ok) {
                throw new Error(`Failed to fetch data for set: ${set}. Status: ${response.status}`);
            }
            const data = await response.json();

            if (data.data && data.data.length > 0) {
                // Iterate over all items to collect all unique set IDs for the set name
                data.data.forEach(item => {
                    const setId = item.set.id;
                    
                    // Initialize an array for this set name if it doesn't already exist
                    if (!setNameToIdMap[set]) setNameToIdMap[set] = [];

                    // Add the setId to the array if it's not already included
                    if (!setNameToIdMap[set].includes(setId)) setNameToIdMap[set].push(setId);
                });
            }

            return data.data;
        } catch (error) {
            console.error(error);
            return []; // Return an empty array on error
        } finally {
            // Increment progress and update UI
            completedSets += 1;
            const percentage = Math.round((completedSets / totalSets) * 100);
            loadingBar.style.width = `${percentage}%`;
            loadingContext.innerText = `${percentage}%`;
        }
    });

    // Use Promise.all to run all fetch operations in parallel
    const setDataArrays = await Promise.all(fetchIterator);

    // Flatten the array of arrays into a single array
    const allSetData = setDataArrays.flat();
    cardsData = cardsData.concat(allSetData);

    // Finalize UI
    loadingBar.style.width = '100%';

    filteredCards = csvData;
    await createDisplayCardsData(cardsData);
    displayCards();
    updateCSVData();
    populateFilters();
}

// Find cards in data
async function findCardBySetAndNumber(set, number, cardsDeck) {
    // Get all possible set IDs for the set name
    let setIds = setNameToIdMap[set];
    if (set === "151") setIds = ["sv3pt5"]; // Manually assign for 151
    if (!setIds || setIds.length === 0) {
        console.error(`Set ID not found for set: ${set}`);
        return null; // Return null if no ID mapping is found for the set
    }

    const match = number.match(/^[A-Za-z]+/); // Match any letters at the start of the string
    const prefix = match ? match[0].toLowerCase() : ''; // Convert prefix to lowercase if it exists

    let card = null;

    // Try each setId until a matching card is found
    for (const setId of setIds) {
        const id = `${setId}${prefix}-${number}`;
        card = cardsDeck.find(c => c.id === id && (c.set.name === set || c.set.name.includes(set)));
        if (!card){
            // Some Expansion does not need prefix
            const id = `${setId}-${number}`;
            card = cardsDeck.find(c => c.id === id && (c.set.name === set || c.set.name.includes(set)));    
        }
        if (card) return card;
    }

    // Try to fetch the card if it wasn't found in cardsData
    for (const setId of setIds) {
        const id = `${setId}${prefix}-${number}`;
        card = await fetchIndivCard(id);
        if (card) return card;
    }

    console.error(`Card not found with set: ${set}, number: ${number}`);
    return null; // Return null if no card was found
}

// Fetch Individual card if the card is not in a set
async function fetchIndivCard(id) {
    try {
        let response = await fetch(`${apiUrl}cards/${id}`);
        
        if (!response.ok) throw new Error(`Failed to fetch card by ID: ${id}`);
        
        let data = await response.json();

        return data.data ? data.data : null;
    } catch (error) {
        console.error('Error fetching card by ID:', error);
        return null;
    }
}

// Fetch each card to display cards
async function createDisplayCardsData(cardsDeck) {
    displayCardsData = []; // Clear previous data
    for (const { set, number, foil, count } of filteredCards) {
        if (!number) {
            console.error('Card number is blank or undefined');
            continue; // Skip this card
        }
        
        let card = await findCardBySetAndNumber(set, number, cardsDeck);
        if (card) {
            // Store additional information
            const releaseDate = card.set.releaseDate || '';
            const price = getPrice(card) || 0;
            displayCardsData.push({ ...card, releaseDate, price, foil, count });
        } else {
            console.error(`Card not found with set: ${set}, number: ${number}`);
        }
    }

    if (!cachedCardsData || cachedCardsData.length === 0) cachedCardsData = displayCardsData;
}

// Function to update csvData with additional properties based on displayCardsData
async function updateCSVData() {
    csvData = await Promise.all(csvData.map(async csvCard => {
        const { set, number } = csvCard;
        
        // Find matching card
        const matchingCard = await findCardBySetAndNumber(set, number, displayCardsData);

        // If a matching card is found, add the missing properties to csvCard
        if (matchingCard) {
            pokemonNames.push(matchingCard.name);
            csvCard.name = matchingCard.name || "N/A";
            csvCard.rarity = matchingCard.rarity || "N/A";
            csvCard.artist = matchingCard.artist || "N/A";
            csvCard.type = matchingCard.types?.[0] || matchingCard.subtypes?.[0] || "N/A";
        } else {
            console.error(`No matching card found for set: ${set}, number: ${number}`);
        }

        return csvCard;
    }));
    pokemonNames = [...new Set(pokemonNames)];
    pokemonNames.sort((a, b) => a.localeCompare(b));
}

// Fill the card container
function displayCards() {
    loadingBar.style.display = 'none';
    loadingContext.style.display = 'none';

    cardContainer.innerHTML = ''; // Clear the card container
    displayCardsData.forEach(card => {
        createCardElement(card);
    });
}

// Make Card Element
function createCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'card';

    // Determine holo symbol
    let holoSymbol = '';
    if (card.foil === "Holo") {
        holoSymbol = '✨';
    } else if (card.foil === "Reverse") {
        holoSymbol = '🌟';
    }

    // Add count to the card name if count is more than 1
    const countText = card.count > 1 ? ` (${card.count})` : '';
    const isVisible = document.querySelector('#visibleButton i').classList.contains('fa-eye');

    cardDiv.innerHTML = `
        <img src="${card.images.small}" alt="${card.name}" title="${card.name}" onclick="showPopup('${card.images.large}', '${card.name.replace(/'/g, '’')}')" style="cursor: zoom-in">
        <div class="cardInfo" style="display: ${isVisible ? 'block' : 'none'};">
            <a href="https://jihunkimcode.github.io/Pokemon-Card-Searcher/?searchMode=setList&searchQuery=${encodeURIComponent(card.set.name)}&sortOrder=newest&supertypeFilter=&rarityFilter=" target="_blank">
                <img src="${card.set.images.logo}" alt="${card.set.name}" title="${card.set.name}" style="width: 100px; cursor: pointer">
            </a>    
            <p>
                <a href="https://jihunkimcode.github.io/Pokemon-Card-Searcher/?searchMode=pokemonName&searchQuery=${encodeURIComponent(card.name)}&sortOrder=newest&supertypeFilter=&rarityFilter=" target="_blank">
                    <b>${card.name}${holoSymbol}${countText}</b>
                </a>
            </p>
            <p><i>Illus. ${
                card.artist && card.artist !== 'N/A' 
                    ? `<a href="https://jihunkimcode.github.io/Pokemon-Card-Searcher/?searchMode=artistName&searchQuery=${encodeURIComponent(card.artist)}&sortOrder=newest&supertypeFilter=&rarityFilter=" target="_blank">
                    ${card.artist}
                    </a>` 
                    : 'N/A'
            }</i></p>
            <p>${card.releaseDate || 'N/A'}</p>
            <p>${card.rarity || 'N/A'}</p>
            <p>
                ${card.tcgplayer && card.tcgplayer.url 
                ? `<a href="${card.tcgplayer.url}" target="_blank">Avg $${card.price || 'N/A'}</a>` 
                : `Avg $${card.price || 'N/A'}`}
            </p>
        </div>
    `;
    cardContainer.appendChild(cardDiv);
}

function getPrice(card) {
    const priceAttributes = ['unlimited', '1stEdition', 'unlimitedHolofoil', '1stEditionHolofoil', 'normal', 'holofoil', 'reverseHolofoil'];
    for (const attr of priceAttributes) {
        const price = card.tcgplayer?.prices?.[attr]?.market || card.tcgplayer?.prices?.[attr]?.mid;
        if (price !== undefined) return price;
    }
    return undefined;
}

function showPopup(image, name) {
    const popup = document.getElementById('popup');
    const popupImage = document.getElementById('popupImage');

    popup.style.display = "block";
    popupImage.src = image;
    document.body.style.overflow = "hidden";

    const close = document.getElementsByClassName('close')[1];
    close.onclick = function () {
        popup.style.display = "none";
        document.body.style.overflow = "auto";
    };

    window.onclick = function (event) {
        if (event.target == popup) {
            popup.style.display = "none";
            document.body.style.overflow = "auto";
        }
    };
}

// Window Scroll Button
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.onscroll = function () {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        scrollTopButton.style.display = 'block';
    } else {
        scrollTopButton.style.display = 'none';
    }
};

// Function to disable filter inputs
function disableFilters() {
    document.getElementById('rarity-filter').disabled = true;
    document.getElementById('set-filter').disabled = true;
    document.getElementById('type-filter').disabled = true;
    document.getElementById('artist-filter').disabled = true;
    document.getElementById('holo-filter').disabled = true;
    document.getElementById('sort-by').disabled = true;
    document.getElementById('order-toggle').disabled = true;
}

// Function to enable filter inputs
function enableFilters() {
    document.getElementById('rarity-filter').disabled = false;
    document.getElementById('set-filter').disabled = false;
    document.getElementById('type-filter').disabled = false;
    document.getElementById('artist-filter').disabled = false;
    document.getElementById('holo-filter').disabled = false;
    document.getElementById('sort-by').disabled = false;
    document.getElementById('order-toggle').disabled = false;
}

function populateFilters() {
    // Sort them alphabetically
    const sets = [...new Set(csvData.map(card => card.set).filter(set => set && set !== "N/A"))].sort();
    const counts = [...new Set(csvData.map(card => card.count).filter(count => count && count !== "N/A"))].sort((a, b) => a - b);
    const holos = [...new Set(csvData.map(card => card.foil).filter(holo => holo && holo !== "N/A"))].sort();  // Still using csvData for holo

    // Sort rarity
    const rarities = [...new Set(displayCardsData.map(card => card.rarity).filter(rarity => rarity && rarity !== "N/A"))]
    .sort((a, b) => {
        const orderA = rarityOrder[a] || 0;
        const orderB = rarityOrder[b] || 0;
        if (orderA === orderB) return a.localeCompare(b);  // Alphabetical comparison if order is the same
        return orderA - orderB;
    });
    const types = [...new Set(displayCardsData.map(card => card.types?.[0] || card.subtypes?.[0]).filter(type => type && type !== "N/A"))].sort();
    const artists = [...new Set(displayCardsData.map(card => card.artist).filter(artist => artist && artist !== "N/A"))].sort();

    // Populate rarity filter
    rarities.forEach(rarity => {
        const option = document.createElement('option');
        option.value = rarity;
        option.textContent = rarity;
        rarityFilter.appendChild(option);
    });

    // Populate set filter
    sets.forEach(set => {
        const option = document.createElement('option');
        option.value = set;
        option.textContent = set;
        setFilter.appendChild(option);
    });

    // Populate type filter
    types.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        typeFilter.appendChild(option);
    });

    // Populate artist filter
    artists.forEach(artist => {
        const option = document.createElement('option');
        option.value = artist;
        option.textContent = artist;
        artistFilter.appendChild(option);
    });

    // Populate holo filter
    holos.forEach(holo => {
        const option = document.createElement('option');
        option.value = holo;
        option.textContent = holo;
        holoFilter.appendChild(option);
    });

    // Populate count filter with unique counts from the csvData
    counts.forEach(count => {
        const option = document.createElement('option');
        option.value = count;
        option.textContent = count;
        countFilter.appendChild(option);
    });
}

// Apply Filters
rarityFilter.addEventListener('change', applyFilters);
setFilter.addEventListener('change', applyFilters);
artistFilter.addEventListener('change', applyFilters);
typeFilter.addEventListener('change', applyFilters);
holoFilter.addEventListener('change', applyFilters);
countFilter.addEventListener('change', applyFilters);

// searchQuery.addEventListener('input', applyFilters);
document.getElementById('fetchButton').addEventListener('click',()=>{
    if(pokemonNames.length > 0) applyFilters();
});
searchQuery.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        if(pokemonNames.length > 0) applyFilters();
        if(pokemonDropdown){
            pokemonDropdown.innerHTML = '';
            pokemonDropdown.style.display = 'none';
        }
    }
});

document.getElementById('sort-by').addEventListener('change', sortAndDisplayCards);
document.getElementById('order-toggle').addEventListener('click', () => {
    sortOrder *= -1;
    sortAndDisplayCards();
});

async function applyFilters() {
    disableFilters(); // Disable filters while applying
    const rarityFilterValue = rarityFilter.value;
    const setFilterValue = setFilter.value;
    const typeFilterValue = typeFilter.value;
    const artistFilterValue = artistFilter.value;
    const holoFilterValue = holoFilter.value;
    const countFilterValue = countFilter.value;
    const cardName = searchQuery.value;

    // Filter csvData based on selected filter values
    filteredCards = csvData.filter(card => {
        return (!rarityFilterValue || card.rarity === rarityFilterValue) &&
               (!setFilterValue || card.set === setFilterValue) &&
               (!typeFilterValue || card.type === typeFilterValue) &&
               (!artistFilterValue || card.artist === artistFilterValue) &&
               (!holoFilterValue || card.foil === holoFilterValue) &&
               (!countFilterValue || card.count == countFilterValue) &&
               (!cardName || card.name.toLowerCase().includes(cardName.toLowerCase()));
    });

    // Display updated data
    await createDisplayCardsData(cachedCardsData);
    sortAndDisplayCards();
    enableFilters();
}

function sortAndDisplayCards() {
    disableFilters(); // Disable filters while sorting
    const sortBy = document.getElementById('sort-by').value;

    const typeOrder = [
        'Colorless', 'Metal', 'Fire', 'Fighting', 'Dragon', 'Lightning', 'Grass', 'Water',
        'Psychic', 'Darkness', 'Supporter', 'Stadium', 'Pokémon Tool', 'Item', 'Special'
    ];

    const foilOrder = ['Holo', 'Reverse', 'Non-Holo']

    displayCardsData.sort((a, b) => {
        let compare = 0;
        if (sortBy === 'name') {
            compare = a.name.localeCompare(b.name);
        } else if (sortBy === 'rarity') {
            compare = (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
        } else if (sortBy === 'releaseDate') {
            compare = (a.releaseDate || '').localeCompare(b.releaseDate || '');
        } else if (sortBy === 'price') {
            compare = b.price - a.price;
        } else if (sortBy === 'artist') {
            compare = (a.artist || '').localeCompare(b.artist || '');
        } else if (sortBy === 'type') {
            compare = typeOrder.indexOf(a.types?.[0] || a.subtypes?.[0] || '') - typeOrder.indexOf(b.types?.[0] || b.subtypes?.[0] || '');
        } else if (sortBy === 'foil') {
            compare = foilOrder.indexOf(a.foil || '') - foilOrder.indexOf(b.foil || '');
        } else if (sortBy === 'count') {
            compare = (b.count || 0) - (a.count || 0);
        }
        return compare * sortOrder;
    });
    
    displayCards();
    enableFilters(); // Re-enable filters after sorting
}

// SortOrder Toggle Button
const sortBySelect = document.getElementById('sort-by');
const orderToggleBtn = document.getElementById('order-toggle');
let currentIcon = 'fa-arrow-down-short-wide';

function updateIcon() {
    const selectedValue = sortBySelect.value;
    const iconElement = orderToggleBtn.querySelector('i');

    if (selectedValue === 'name' || selectedValue === 'artist') {
        if (currentIcon === 'fa-arrow-down-short-wide' || currentIcon === 'fa-arrow-down-1-9') {
            currentIcon = 'fa-arrow-down-a-z';
        } else if (currentIcon === 'fa-arrow-up-short-wide' || currentIcon === 'fa-arrow-up-1-9') {
            currentIcon = 'fa-arrow-up-a-z';
        }
    } else {
        if (currentIcon === 'fa-arrow-down-a-z' || currentIcon === 'fa-arrow-down-1-9') {
            currentIcon = 'fa-arrow-down-short-wide';
        } else if (currentIcon === 'fa-arrow-up-a-z' || currentIcon === 'fa-arrow-up-1-9') {
            currentIcon = 'fa-arrow-up-short-wide';
        }
    } 

    iconElement.className = `fa-solid ${currentIcon}`;
}

orderToggleBtn.addEventListener('click', () => {
    if (currentIcon.includes('down')) {
        currentIcon = currentIcon.replace('down', 'up');
    } else {
        currentIcon = currentIcon.replace('up', 'down');
    }
    updateIcon();
});

sortBySelect.addEventListener('change', updateIcon);

// Visibility Toggle Button
document.getElementById('visibleButton').addEventListener('click', toggleVisibility);

document.addEventListener('keydown', function(event) {
    if (event.altKey && event.key === '`') {
        toggleVisibility();
    }
});

function toggleVisibility() {
    const cardInfos = document.querySelectorAll('.cardInfo');
    const icon = document.getElementById('visibleButton').querySelector('i');
    const isVisible = icon.classList.contains('fa-eye');

    cardInfos.forEach(cardInfo => {
        cardInfo.style.display = isVisible ? 'none' : 'block';
    });

    if (isVisible) {
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

// Stats Button Event Listener
document.getElementById('statsButton').addEventListener('click', showStats);

// Modal Close Event Listener
document.querySelector('#statsModal .close').addEventListener('click', () => {
    document.getElementById('statsModal').style.display = 'none';
    document.body.style.overflow = "auto";
});

window.addEventListener('click', event => {
    if (event.target == document.getElementById('statsModal')) {
        document.getElementById('statsModal').style.display = 'none';
        document.body.style.overflow = "auto";
    }
});

let charts = {}; // Keep track of chart instances

function showStats() {
    const stats = calculateStats(displayCardsData);

    const statsContent = document.getElementById('statsContent');
    document.body.style.overflow = "hidden";

    statsContent.innerHTML = `
        <p><b>Total number of cards:</b> ${stats.totalCards}</p>
        <p><b>Earliest release date:</b> ${stats.earliestDate}</p>
        <p><b>Latest release date:</b> ${stats.latestDate}</p>
        <p><b>Cheapest card price:</b> $${stats.cheapest}</p>
        <p><b>Most expensive card price:</b> $${stats.mostExpensive}</p>
    `;

    document.getElementById('statsModal').style.display = 'block';

    updateChart('setChart', 'Number of cards by set', stats.setCounts);
    updateChart('rarityChart', 'Number of cards by rarity', stats.rarityCounts);
    updateChart('supertypeChart', 'Number of cards by supertype', stats.supertypeCounts);
    updateChart('typeChart', `Number of cards by type`, stats.typeCounts);
    
    if (header[2]) {
        updateChart('foilChart', `Number of cards by ${header[2].toLowerCase()}`, stats.foilCounts);
    } else {
        removeChart('foilChart');
    }
    updateChart('illustratorChart', 'Top 10 illustrators', Object.fromEntries(stats.topIllustrators.map(({ name, count }) => [name, count])));
}

function calculateStats(cards) {
    const setCounts = {};
    const rarityCounts = {};
    const typeCounts = {};
    const illustratorCounts = {};
    const supertypeCounts = {};
    const foilCounts = {};
    let earliestDate = null;
    let latestDate = null;
    let mostExpensive = -Infinity;
    let cheapest = Infinity;
    let totalCards = 0;

    cards.forEach(card => {
        totalCards += parseInt(card.count);

        // Count Sets
        if (card.set.name) {
            setCounts[card.set.name] = (setCounts[card.set.name] || 0) + parseInt(card.count);
        }

        // Count rarities
        if (card.rarity) {
            rarityCounts[card.rarity] = (rarityCounts[card.rarity] || 0) + parseInt(card.count);
        }

        // Count types
        if (card.types?.[0]||card.subtypes?.[0]) {
            typeCounts[card.types?.[0]||card.subtypes?.[0]] = (typeCounts[card.types?.[0]||card.subtypes?.[0]] || 0) + parseInt(card.count);
        }

        // Count illustrators
        if (card.artist) {
            illustratorCounts[card.artist] = (illustratorCounts[card.artist] || 0) + parseInt(card.count);
        }

        // Count supertypes
        if (card.supertype) {
            supertypeCounts[card.supertype] = (supertypeCounts[card.supertype] || 0) + parseInt(card.count);
        }
        
        //Count Foils
        if (card.foil) {
            foilCounts[card.foil] = (foilCounts[card.foil] || 0) + parseInt(card.count);
        }

        // Find earliest and latest release dates
        const releaseDate = new Date(card.set.releaseDate);
        if (!earliestDate || releaseDate < earliestDate) earliestDate = releaseDate;
        if (!latestDate || releaseDate > latestDate) latestDate = releaseDate;

        // Track highest price by date
        const price = getPrice(card);
        if (price !== undefined) {
            if (price > mostExpensive) mostExpensive = price;
            if (price < cheapest) cheapest = price;
        }
    });

    const topIllustrators = Object.entries(illustratorCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));

    return {
        totalCards,
        setCounts: sortObjectByValues(setCounts),
        rarityCounts: sortObjectByValues(rarityCounts),
        typeCounts: sortObjectByValues(typeCounts),
        illustratorCounts: sortObjectByValues(illustratorCounts),
        supertypeCounts: sortObjectByValues(supertypeCounts),
        foilCounts: sortObjectByValues(foilCounts),    
        topIllustrators,
        earliestDate: earliestDate ? earliestDate.toISOString().split('T')[0] : 'N/A',
        latestDate: latestDate ? latestDate.toISOString().split('T')[0] : 'N/A',
        mostExpensive: mostExpensive === -Infinity ? 'N/A' : mostExpensive.toFixed(2),
        cheapest: cheapest === Infinity ? 'N/A' : cheapest.toFixed(2),
    };
}

function sortObjectByValues(obj) {
    return Object.fromEntries(Object.entries(obj).sort(([, a], [, b]) => b - a));
}

function updateChart(canvasId, title, data, type = 'bar') {
    if (charts[canvasId]) {
        charts[canvasId].destroy(); // Destroy existing chart instance
    }

    const ctx = document.getElementById(canvasId).getContext('2d');
    charts[canvasId] = new Chart(ctx, {
        type: type,
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: title,
                data: Object.values(data),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, // Allow custom sizing
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function removeChart(chartId) {
    const chartContainer = document.getElementById(chartId).parentElement;
    chartContainer.style.display = 'none';
    const ctx = document.getElementById(chartId).getContext('2d');
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

// Rarity Order for sorting
const rarityOrder = {
    "Common": 10,
    "Uncommon": 20,
    "Rare": 30,                         // Regular
    "Classic Collection": 31,
    "Rare Holo": 40,                    // Holofoil
    "Double Rare": 50,                  // EX
    "Ultra Rare": 60,                   // Unique card classification
    "Rare Ultra": 60,                   // Unique card classification
    "Rare Holo Star": 61,
    "Rare Prime": 61,
    "Rare Holo LV.X": 61,
    "Rare Holo EX": 61,
    "Rare Holo GX": 61,
    "LEGEND": 61,
    "Rare BREAK": 61,
    "Amazing Rare": 61,
    "Rare Prism Star": 61,
    "Rare ACE": 61,
    "ACE SPEC Rare": 61,
    "Radiant Rare": 62,
    "Rare Holo V": 63,
    "Rare Holo VSTAR": 64,
    "Rare Holo VMAX": 65,
    "Trainer Gallery Rare Holo": 66,
    "Rare Secret": 70,                  // Out of numbers
    "Rare Shining": 71,                 // Shiny Pokemon
    "Shiny Rare": 72,                   // Shiny Pokemon
    "Rare Shiny": 72,                   // Shiny Pokemon
    "Rare Shiny GX": 73,                // Shiny Pokemon
    "Shiny Ultra Rare": 73,             // Shiny Pokemon
    "Rare Rainbow": 74,
    "Illustration Rare": 75,            // Full-Art
    "Special Illustration Rare": 76,    // Full-Art
    "Hyper Rare": 80,                   // Gold Cards
    "Promo": 90                         // Event Cards
};