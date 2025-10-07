const pokedex = document.querySelector(".pokedex");
const openBtn = document.getElementById("open-btn");
const closeBtn = document.getElementById("close-btn");

openBtn.addEventListener("click", () => pokedex.classList.add("open"));
closeBtn.addEventListener("click", () => pokedex.classList.remove("open"));

