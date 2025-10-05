const express = require('express');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'main.html'));
});
app.get("/mooncave", (req, res) => {
    res.sendFile(path.join(__dirname, 'mooncave.html'));
})
app.get("/pokelab", (req, res) => {
    res.sendFile(path.join(__dirname, 'pokelab.html'));
})


app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
