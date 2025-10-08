const fs = require('fs/promises');
const path = require('path');
const yaml = require('js-yaml');
const fetch = require('node-fetch');

// --- Configuration ---
// CRITICAL: Path must point to public/data/pokedex_data.json relative to the script's location (scripts/)
const DATA_FILE = path.join(__dirname, '..', 'public', 'data', 'pokedex_data.json'); 
const POKEAPI_BASE = 'https://pokeapi.co/api/v2/pokemon/';
const GITHUB_API_BASE = 'https://api.github.com/repos/';
// Path to find the animated sprite URL inside the PokeAPI JSON response
const SPRITE_PATH = ['sprites', 'versions', 'generation-v', 'black-white', 'animated', 'front_default'];
// ---------------------

/**
 * Helper to safely extract a deeply nested value from an object.
 */
function getNested(obj, keys) {
    return keys.reduce((current, key) => (current && current[key] !== undefined) ? current[key] : null, obj);
}

/**
 * Fetches the list of added/modified YAML files in the current Pull Request.
 */
async function getChangedFiles(prNumber, repo) {
    const url = `${GITHUB_API_BASE}${repo}/pulls/${prNumber}/files`;
    const response = await fetch(url, {
        headers: {
            // Token is required to query the GitHub API for PR details
            'Authorization': `token ${process.env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'GitHub-Pokedex-Bot' 
        }
    });
    
    if (!response.ok) {
        throw new Error(`Failed to fetch PR files: ${response.statusText}`);
    }

    const files = await response.json();
    // Filter for files that were added or modified in the 'submissions' folder
    return files
        .filter(f => f.status === 'added' || f.status === 'modified')
        .map(f => f.filename)
        .filter(filename => filename.startsWith('submissions/') && filename.endsWith('.yaml'));
}

/**
 * Processes a single YAML file, fetches PokeAPI data, and returns a structured entry.
 */
async function processEntry(filePath) {
    // 1. Read and parse the YAML submission file
    const yamlContent = await fs.readFile(filePath, 'utf8');
    const entry = yaml.load(yamlContent);
    const pokemonName = entry.pokemon_name.toLowerCase().trim();

    // 2. Fetch official data from PokeAPI
    const apiResponse = await fetch(`${POKEAPI_BASE}${pokemonName}`);
    if (!apiResponse.ok) {
        console.warn(`Could not find Pokemon in PokeAPI: ${pokemonName}. Skipping.`);
        return null;
    }
    const pokeData = await apiResponse.json();

    // 3. Extract the animated sprite URL and official ID
    const spriteUrl = getNested(pokeData, SPRITE_PATH);

    if (!spriteUrl) {
        console.warn(`Could not find animated sprite for ${pokemonName}. Skipping.`);
        return null; 
    }

    // 4. Create the final Pokedex entry object
    return {
        id: pokeData.id, // The official UID/ID
        name: entry.pokemon_name,
        note: entry.trainer_note.trim(),
        sprite: spriteUrl,
        submitted_by: entry.submitted_by || 'Anonymous Trainer',
        timestamp: new Date().toISOString()
    };
}

/**
 * Main function: orchestrates the reading, processing, and writing of the Pokedex data.
 */
async function main() {
    const prNumber = process.argv[2];
    const repo = process.env.GITHUB_REPOSITORY; 
    
    if (!prNumber || !repo) {
        console.error("Missing PR number or repository environment variable. Exiting.");
        process.exit(1);
    }
    
    try {
        console.log(`Starting Pokedex update for PR #${prNumber} on repo ${repo}`);
        
        // 1. Identify which YAML files were added/changed in the PR
        const changedYamlFiles = await getChangedFiles(prNumber, repo);

        if (changedYamlFiles.length === 0) {
            console.log("No new YAML files found to process. Exiting.");
            return;
        }

        // 2. Load existing Pokedex data
        let pokedexData = [];
        try {
            const dataString = await fs.readFile(DATA_FILE, 'utf8');
            pokedexData = JSON.parse(dataString);
        } catch (error) {
            console.warn("Pokedex data file not found or empty. Starting fresh.");
        }

        // 3. Process new YAML submissions
        for (const filePath of changedYamlFiles) {
            // Ensure the script can locate the file checked out by the action
            const absolutePath = path.join(path.dirname(DATA_FILE), '..', '..', filePath);
            
            const newEntry = await processEntry(absolutePath);
            
            if (newEntry) {
                // Check if a Pokémon with this ID already exists
                const isDuplicate = pokedexData.some(entry => entry.id === newEntry.id);
                if (!isDuplicate) {
                    pokedexData.push(newEntry);
                    console.log(`Successfully added entry for ${newEntry.name}.`);
                } else {
                    console.log(`${newEntry.name} (ID: ${newEntry.id}) already exists. Skipping addition.`);
                }
            }
        }
        
        // 4. Write the final, sorted data back to the JSON file
        pokedexData.sort((a, b) => a.id - b.id);
        await fs.writeFile(DATA_FILE, JSON.stringify(pokedexData, null, 2));
        console.log(`Successfully updated ${DATA_FILE}. Total entries: ${pokedexData.length}`);

    } catch (error) {
        console.error("A critical error occurred during main process:", error.message);
        process.exit(1);
    }
}

main();
