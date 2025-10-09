const fs = require('fs/promises');
const path = require('path');
const yaml = require('js-yaml');
const fetch = require('node-fetch');

// --- Configuration ---
const DATA_FILE = path.join(__dirname, '..', 'public', 'data', 'pokedex_data.json'); 
const POKEAPI_BASE = 'https://pokeapi.co/api/v2/pokemon/';
const GITHUB_API_BASE = 'https://api.github.com/repos/';

// Multiple paths for sprite fallback
const SPRITE_PATHS = [
  ['sprites', 'versions', 'generation-v', 'black-white', 'animated', 'front_default'],
  ['sprites', 'front_default']
];

// ---------------------
function getNested(obj, keys) {
  return keys.reduce((current, key) => (current && current[key] !== undefined) ? current[key] : null, obj);
}

async function getChangedFiles(prNumber, repo) {
  const url = `${GITHUB_API_BASE}${repo}/pulls/${prNumber}/files`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `token ${process.env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GitHub-Pokedex-Bot' 
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch PR files from GitHub API: ${response.statusText}`);
  }

  const files = await response.json();
  return files
    .filter(f => f.status === 'added' || f.status === 'modified')
    .map(f => f.filename)
    .filter(filename => filename.startsWith('submissions/') && filename.endsWith('.yaml'));
}

async function processEntry(filePath) {
  const yamlContent = await fs.readFile(filePath, 'utf8');
  const entry = yaml.load(yamlContent);
  const pokemonName = entry.pokemon_name.toLowerCase().trim();

  console.log(`Processing entry for: ${entry.pokemon_name}...`);

  // Fetch PokeAPI data
  const apiResponse = await fetch(`${POKEAPI_BASE}${pokemonName}`);

  if (!apiResponse.ok) {
    console.error(`\n--- POKÉAPI VALIDATION FAILED ---`);
    console.error(`Could not find Pokémon "${entry.pokemon_name}".`);
    console.error(`Check the spelling in your YAML file and resubmit.`);
    console.error(`----------------------------------\n`);
    process.exit(1);
  }

  const pokeData = await apiResponse.json();

  // Extract sprite URL using fallback paths
  let spriteUrl = null;
  for (const pathArr of SPRITE_PATHS) {
    spriteUrl = getNested(pokeData, pathArr);
    if (spriteUrl) break;
  }

  if (!spriteUrl) {
    console.warn(`Could not find a sprite for ${pokemonName}. Skipping.`);
    return null;
  }

  // Create Pokedex entry object
  return {
    id: pokeData.id,
    name: entry.pokemon_name,
    note: entry.trainer_note.trim(),
    sprite: spriteUrl,
    submitted_by: entry.submitted_by || 'Anonymous Trainer',
    timestamp: new Date().toISOString()
  };
}

async function main() {
  const prNumber = process.argv[2];
  const repo = process.env.GITHUB_REPOSITORY; 

  if (!prNumber || !repo) {
    console.error("Missing PR number or repository environment variable.");
    process.exit(1);
  }

  try {
    const changedYamlFiles = await getChangedFiles(prNumber, repo);

    if (changedYamlFiles.length === 0) {
      console.log("No new YAML files found to process. Exiting.");
      return;
    }

    // Load existing Pokedex data
    let pokedexData = [];
    try {
      const dataString = await fs.readFile(DATA_FILE, 'utf8');
      pokedexData = JSON.parse(dataString);
    } catch (error) {
      console.warn("Pokedex data file not found or empty. Starting fresh.");
    }

    let newEntriesAdded = false;

    for (const filePath of changedYamlFiles) {
      const absolutePath = path.join(__dirname, '..', filePath);
      const newEntry = await processEntry(absolutePath);

      if (newEntry) {
        // ✅ Add every entry, even if Pokémon already exists
        pokedexData.push(newEntry);
        newEntriesAdded = true;
        console.log(`Added entry for ${newEntry.name} (ID: ${newEntry.id}).`);
      }
    }

    // Write changes only if new entries were added
    if (newEntriesAdded) {
      pokedexData.sort((a, b) => a.id - b.id);
      await fs.writeFile(DATA_FILE, JSON.stringify(pokedexData, null, 2));
      console.log(`\n--- JSON DATABASE UPDATED SUCCESSFULLY ---`);
      console.log(`Pushed changes will trigger the auto-merge.`);
    } else {
      console.log("No new entries found. JSON file remains unchanged.");
    }

  } catch (error) {
    if (!error.message.includes('VALIDATION FAILED')) {
      console.error("A critical error occurred:", error.message);
      process.exit(1); 
    }
  }
}

main();
