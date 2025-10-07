const pokedex = document.querySelector(".pokedex");
const openBtn = document.getElementById("open-btn");
const closeBtn = document.getElementById("close-btn");
const searchBtn = document.getElementById("search-btn");
const searchContainer = document.querySelector(".search-container");
const pokemonSprites = document.querySelectorAll(".pokemon-sprite");
const detailView = document.querySelector(".detail-view");
const detailSprite = document.querySelector(".detail-sprite");
const detailInfo = document.querySelector(".detail-info");
const pokemonDisplay = document.querySelector(".pokemon-display");

let searchOpen = false;
let selectedSprite = null;

// Open/close Pokedex
openBtn.addEventListener("click", () => pokedex.classList.add("open"));
closeBtn.addEventListener("click", () => pokedex.classList.remove("open"));

// Toggle search
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

// Sprite click -> toggle detail view
pokemonSprites.forEach(sprite => {
  sprite.addEventListener("click", () => {
    if (selectedSprite === sprite && detailView.style.display === "flex") {
      // Clicked the same sprite again → hide detail view, show all sprites
      detailView.style.display = "none";
      pokemonDisplay.style.display = "flex";
      selectedSprite = null;
    } else {
      // Show this sprite in detail view
      selectedSprite = sprite;
      pokemonDisplay.style.display = "none";  // hide all sprites
      detailSprite.innerHTML = `<img src="${sprite.src}" />`;
      detailInfo.innerHTML = `
        <strong>Name:</strong> ${sprite.dataset.name}<br>
        <strong>Type:</strong> ${sprite.dataset.type}<br>
        <strong>UID:</strong> ${sprite.dataset.uid}<br>
        <strong>Line:</strong> ${sprite.dataset.line}
      `;
      detailView.style.display = "flex";
    }
  });
});
// Close detail view when clicking outside
detailView.addEventListener("click", (e) => {
  if (e.target === detailView) {
    detailView.style.display = "none";
    pokemonDisplay.style.display = "flex";
    selectedSprite = null;
  }
});

