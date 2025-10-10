document.addEventListener("DOMContentLoaded", () => {
  // Floating Pokémon sprites
  const pokemonSprites = [
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png', // Pikachu
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',  // Bulbasaur
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png',  // Charmander
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png',  // Squirtle
    'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/39.png', // Jigglypuff
  ];

  const numberOfSprites = 10;
  for (let i = 0; i < numberOfSprites; i++) {
    const sprite = document.createElement("div");
    sprite.classList.add("sprite");

    const randomIndex = Math.floor(Math.random() * pokemonSprites.length);
    sprite.style.backgroundImage = `url(${pokemonSprites[randomIndex]})`;

    sprite.style.left = Math.random() * window.innerWidth + "px";
    const duration = 5 + Math.random() * 5;
    sprite.style.animationDuration = `${duration}s`;

    const size = 50 + Math.random() * 50;
    sprite.style.width = `${size}px`;
    sprite.style.height = `${size}px`;

    sprite.style.animationDelay = `${Math.random() * 5}s`;

    document.body.appendChild(sprite);
  }

  // Pokeball Slider
  const pokeballIcon = document.getElementById('pokeball-icon');
  const sliderNav = document.getElementById('slider-nav');

  pokeballIcon.addEventListener('click', () => {
    if (sliderNav.style.left === '0px') {
      sliderNav.style.left = '-325px'; // hide
    } else {
      sliderNav.style.left = '0px'; // show
    }
  });
});