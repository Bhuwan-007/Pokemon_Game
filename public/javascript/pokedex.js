// --- Global UI Elements ---
const pokedex = document.querySelector(".pokedex");
const openBtn = document.getElementById("open-btn");
const closeBtn = document.getElementById("close-btn");
const searchBtn = document.getElementById("search-btn");
const searchContainer = document.querySelector(".search-container");
// UPDATED: Renamed from searchIdInput to searchNameInput
const searchNameInput = document.getElementById("searchId"); 
const searchGoBtn = document.getElementById("search-go");  
const detailView = document.querySelector(".detail-view");
const detailSprite = document.querySelector(".detail-sprite");
const detailInfo = document.querySelector(".detail-info");
const pokemonDisplay = document.querySelector(".pokemon-display");

// --- Data & State ---
const DATA_URL = '/data/pokedex_data.json'; 
let pokedexData = [];
let searchOpen = false;
let selectedSprite = null;


// =======================================================
// 1. UTILITY FUNCTIONS (for visual feedback)
// =======================================================

function showTemporaryMessage(message, color) {
    searchContainer.style.display = "none";
    pokemonDisplay.style.display = "none";
    detailView.style.display = "flex";
    
    detailSprite.innerHTML = '';
    
    detailInfo.innerHTML = `
        <div style="color: ${color}; font-size: 20px; font-weight: bold; padding-top: 50px; text-align: center; width: 100%;">
            ${message}
        </div>
        <button id="message-ok-btn" class="control-btn" style="width: 100px; height: 30px; border-radius: 5px; background: #333; margin-top: 20px; font-size: 14px;">
            OK
        </button>
    `;
    
    document.getElementById("message-ok-btn").addEventListener('click', hideTemporaryMessage);
    setTimeout(hideTemporaryMessage, 5000);
}

function hideTemporaryMessage() {
    if (detailView.style.display === "flex" && selectedSprite === null) {
        detailView.style.display = "none";
        pokemonDisplay.style.display = "flex";
    }
}


// =======================================================
// 2. DATA LOADING AND RENDERING
// =======================================================

async function loadPokedex() {
    try {
        const response = await fetch(DATA_URL);
        if (!response.ok) {
            console.warn(`Pokedex data file error: ${response.status}. Displaying empty list.`);
            renderSprites([]);
            return;
        }
        
        pokedexData = await response.json();
        renderSprites(pokedexData);

    } catch (error) {
        console.error('Failed to load Pokedex data:', error);
        pokemonDisplay.innerHTML = '<div style="color: #FF0000; font-size: 14px; padding: 20px;">ERROR: Could not fetch Pokedex data.</div>';
    }
}

function renderSprites(data) {
    pokemonDisplay.innerHTML = ''; 

    if (data.length === 0) {
        pokemonDisplay.innerHTML = '<div style="color: #00ffff; font-size: 14px; padding: 20px;">No entries yet! Be the first to submit a Pokémon.</div>';
        return;
    }

    data.forEach(pokemon => {
        const spriteImg = document.createElement('img');
        spriteImg.src = pokemon.sprite;
        spriteImg.alt = `${pokemon.name} animated sprite`;
        spriteImg.className = 'pokemon-sprite';
        
        // Store the dynamic data attributes on the DOM element
        spriteImg.dataset.id = pokemon.id;
        spriteImg.dataset.name = pokemon.name;
        spriteImg.dataset.note = pokemon.note; 
        spriteImg.dataset.submitter = pokemon.submitted_by; 

        // Attach event listener for detail view
        spriteImg.addEventListener("click", () => showDetailView(spriteImg));
        
        pokemonDisplay.appendChild(spriteImg);
    });
}

function showDetailView(spriteElement) {
    if (selectedSprite === spriteElement && detailView.style.display === "flex") {
        detailView.style.display = "none";
        pokemonDisplay.style.display = "flex";
        selectedSprite = null;
    } else {
        selectedSprite = spriteElement;
        pokemonDisplay.style.display = "none";    
        searchContainer.style.display = "none"; 
        searchOpen = false;
        
        detailSprite.innerHTML = '';
        detailInfo.innerHTML = '';

        // Display the data
        detailSprite.innerHTML = `<img src="${spriteElement.src}" alt="${spriteElement.dataset.name}" />`;
        detailInfo.innerHTML = `
            <h2>#${spriteElement.dataset.id} ${spriteElement.dataset.name}</h2>
            <div class="info-line"><strong>Trainer's Note:</strong></div>
            <p>${spriteElement.dataset.note.replace(/\n/g, '<br>')}</p>
            <small>Submitted by: ${spriteElement.dataset.submitter}</small>
        `;
        detailView.style.display = "flex";
    }
}


// =======================================================
// 3. UI CONTROL LOGIC 
// =======================================================

// --- Pokedex Open/Close ---
openBtn.addEventListener("click", () => {
    pokedex.classList.add("open");
    detailView.style.display = "none";
    pokemonDisplay.style.display = "flex";
    searchContainer.style.display = "none";
    searchOpen = false;

    if (pokedexData.length === 0) {
        loadPokedex(); 
    }
});
closeBtn.addEventListener("click", () => {
    pokedex.classList.remove("open");
    searchContainer.style.display = "none";
    detailView.style.display = "none";
    pokemonDisplay.style.display = "flex";
    searchOpen = false;
    selectedSprite = null;
});

// --- Toggle Search ---
searchBtn.addEventListener("click", () => {
    searchOpen = !searchOpen;
    if (searchOpen) {
        searchContainer.style.display = "flex";
        pokemonDisplay.style.display = "none";
        detailView.style.display = "none";
    } else {
        searchContainer.style.display = "none";
        pokemonDisplay.style.display = "flex";
    }
});

// --- Search Functionality (Name Lookup) ---
searchGoBtn.addEventListener("click", () => {
    const searchName = searchNameInput.value.trim().toLowerCase();
    
    if (searchName.length < 2) {
        showTemporaryMessage("Please enter at least 2 characters of the Trainer Name.", "#ff00ff");
        return;
    }

    if (pokedexData.length === 0) {
        showTemporaryMessage("Pokedex data is currently empty or still loading.", "#ff00ff");
        return;
    }
    
    // Find ALL entries submitted by this trainer
    const matchingPokemon = pokedexData.filter(p => 
        p.submitted_by.toLowerCase().includes(searchName)
    );
    
    if (matchingPokemon.length > 0) {
        
        // If one match is found, jump straight to the detail view for that one
        if (matchingPokemon.length === 1) {
             const pokemon = matchingPokemon[0];
             const targetSprite = document.querySelector(`.pokemon-sprite[data-id="${pokemon.id}"]`);
             if (targetSprite) {
                showDetailView(targetSprite);
                searchNameInput.value = ''; // Clear input on success
             } else {
                 showTemporaryMessage(`Data found for ${pokemon.name}, but sprite element missing.`, "#ff00ff");
             }
        } else {
            // Multiple matches: Show only the matching sprites in the display row
            // 1. Hide search/details
            searchContainer.style.display = "none";
            detailView.style.display = "none";
            
            // 2. Filter the rendered sprites
            pokemonDisplay.innerHTML = '';
            matchingPokemon.forEach(pokemon => {
                const targetSprite = document.querySelector(`.pokemon-sprite[data-id="${pokemon.id}"]`);
                if (targetSprite) {
                    pokemonDisplay.appendChild(targetSprite.cloneNode(true)); // Clone and display the sprite
                }
            });
            pokemonDisplay.style.display = "flex";

            // Temporary message to explain the filtered view
            showTemporaryMessage(`Found ${matchingPokemon.length} entries. Now showing filtered results.`, "#00ffff");

        }
    } else {
        // Failure: Pokemon not found in the loaded data
        showTemporaryMessage(`No Pokémon submitted by trainer "${searchName}" found.`, "#ff00ff");
    }
});


// --- Detail View Close Listener ---
detailView.addEventListener("click", (e) => {
    if (e.target.classList.contains('detail-view') || e.target.classList.contains('screen-content')) {
        detailView.style.display = "none";
        pokemonDisplay.style.display = "flex";
        selectedSprite = null;
    }
});


// Initial Load: Load data on page load so it's ready quickly
loadPokedex();
