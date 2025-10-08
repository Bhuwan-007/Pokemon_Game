const fs = require('fs/promises');
const path = require('path');
const yaml = require('js-yaml');
const fetch = require('node-fetch');

// --- Configuration ---
// Path to the JSON data file (located in the repo root)
// This path is correct relative to the scripts/ folder
const DATA_FILE = path.join(__dirname, '..', 'public', 'data', 'pokedex_data.json'); 
const POKEAPI_BASE = 'https://pokeapi.co/api/v2/pokemon/';
const GITHUB_API_BASE = 'https://api.github.com/repos/';
// Path to the animated sprites in PokeAPI JSON response
const SPRITE_PATH = ['sprites', 'versions', 'generation-v', 'black-white', 'animated', 'front_default'];
// ---------------------

function getNested(obj, keys) {
    // Helper function to safely navigate complex JSON structures
    return keys.reduce((current, key) => (current && current[key] !== undefined) ? current[key] : null, obj);
}

async function getChangedFiles(prNumber, repo) {
    const url = `${GITHUB_API_BASE}${repo}/pulls/${prNumber}/files`;
    const response = await fetch(url, {
        headers: {
            // Need the token and User-Agent for GitHub API requests
            'Authorization': `token ${process.env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'GitHub-Pokedex-Bot' 
        }
    });
    
    if (!response.ok) {
        throw new Error(`Failed to fetch PR files from GitHub API: ${response.statusText}`);
    }

    const files = await response.json();
    // Filter for new/modified YAML files in the 'submissions' folder
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

    // 1. Fetch data from PokeAPI
    const apiResponse = await fetch(`${POKEAPI_BASE}${pokemonName}`);
    
    // === CRITICAL VALIDATION CHECK ===
    if (!apiResponse.ok) {
        // If the API call fails (usually 404 Not Found), we assume a misspelling.
        console.error(`\n--- POKÉAPI VALIDATION FAILED ---`);
        console.error(`Error: Could not find the Pokémon "${entry.pokemon_name}".`);
        console.error(`Please check the spelling in your YAML file and resubmit.`);
        console.error(`----------------------------------\n`);
        
        // Exiting with code 1 fails the GitHub job, preventing the auto-merge.
        process.exit(1);
    }
    const pokeData = await apiResponse.json();
    // =================================

    // 2. Extract the animated sprite URL
    const spriteUrl = getNested(pokeData, SPRITE_PATH);

    if (!spriteUrl) {
        console.warn(`Could not find animated sprite URL for ${pokemonName}. Skipping.`);
        return null; 
    }

    // 3. Create the new Pokedex entry object
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

        // Process each new YAML file
        for (const filePath of changedYamlFiles) {
            // === THE FIX IS HERE ===
            // Calculate absolute path correctly relative to the repo root
            const absolutePath = path.join(__dirname, '..', filePath); 
            // =========================
            
            const newEntry = await processEntry(absolutePath);
            
            if (newEntry) {
                // Prevent duplicates based on official ID
                const isDuplicate = pokedexData.some(entry => entry.id === newEntry.id);
                if (!isDuplicate) {
                    pokedexData.push(newEntry);
                    newEntriesAdded = true;
                    console.log(`Successfully added entry for ${newEntry.name} (ID: ${newEntry.id}).`);
                } else {
                    console.log(`${newEntry.name} (ID: ${newEntry.id}) already exists. Skipping duplicate entry.`);
                }
            }
        }
        
        // Only write and commit if actual changes were made
        if (newEntriesAdded) {
            // Sort data by ID and write back
            pokedexData.sort((a, b) => a.id - b.id);
            await fs.writeFile(DATA_FILE, JSON.stringify(pokedexData, null, 2));
            console.log(`\n--- JSON DATABASE UPDATED SUCCESSFULLY ---`);
            console.log(`Pushed changes will trigger the auto-merge.`);
        } else {
            console.log("No unique new entries found. JSON file remains unchanged.");
        }


    } catch (error) {
        // If the error is not the expected validation failure, log it as a critical error.
        if (!error.message.includes('VALIDATION FAILED')) {
            console.error("A critical error occurred:", error.message);
            process.exit(1); 
        }
    }
}

main();
