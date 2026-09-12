const fsp = require('fs').promises;
const { JSDOM } = require('jsdom');
const config = require('../config');
const { fetchJSON } = require('../utils');

async function get() {
    try {
        const dom = await JSDOM.fromURL("https://leekduck.com/rocket-lineups/", {});

        const lineups = [];

        const rocketProfiles = dom.window.document.querySelectorAll('.rocket-profile');

        rocketProfiles.forEach(profile => {
            let lineup = {
                name: "",
                title: "",
                type: "",
                firstPokemon: [],
                secondPokemon: [],
                thirdPokemon: [],
            };

            let nameElement = profile.querySelector('.name');
            let titleElement = profile.querySelector('.title');
            let typeElement = profile.querySelector('.type img');

            lineup.name = nameElement ? nameElement.textContent.replace(/\s+/g, ' ').trim() : ""; // Scraped text contains non-breaking spaces, hence the regex replace
            lineup.title = titleElement ? titleElement.textContent.trim() : "";
            lineup.type = typeElement ? typeElement.src.replace('.png', '').split('/').pop().toLowerCase() : "";

            let slots = profile.querySelectorAll('.slot');

            slots.forEach((slot, index) => {
                let slotNumber = index + 1;

                let shadowPokemons = slot.querySelectorAll('.shadow-pokemon');
                let pokemonList = [];

                shadowPokemons.forEach(shadowPokemon => {
                    let pokemon = {
                        name: "",
                        image: "",
                        types: [],
                        isEncounter: false,
                        canBeShiny: false
                    };

                    pokemon.name = shadowPokemon.getAttribute('data-pokemon') || "";

                    let imageElement = shadowPokemon.querySelector('.pokemon-image');
                    pokemon.image = imageElement ? imageElement.src : "";

                    let type1 = shadowPokemon.getAttribute('data-type1');
                    let type2 = shadowPokemon.getAttribute('data-type2');

                    if (type1 && type1 !== "None") {
                        pokemon.types.push(type1.toLowerCase());
                    }
                    if (type2 && type2 !== "None") {
                        pokemon.types.push(type2.toLowerCase());
                    }

                    pokemon.isEncounter = slot.classList.contains('encounter');
                    pokemon.canBeShiny = shadowPokemon.querySelector('.shiny-icon') != null;

                    pokemonList.push(pokemon);
                });

                if (slotNumber === 1) {
                    lineup.firstPokemon = pokemonList;
                } else if (slotNumber === 2) {
                    lineup.secondPokemon = pokemonList;
                } else if (slotNumber === 3) {
                    lineup.thirdPokemon = pokemonList;
                }

            });

            lineups.push(lineup);
        });

        await fsp.writeFile('files/rocketLineups.json', JSON.stringify(lineups, null, 4));
        await fsp.writeFile('files/rocketLineups.min.json', JSON.stringify(lineups));
    } catch (err) {
        console.error(err);
        try {
            const fallback = await fetchJSON(`${config.fallbackBaseUrl}/rocketLineups.min.json`);
            await fsp.writeFile('files/rocketLineups.json', JSON.stringify(fallback, null, 4));
            await fsp.writeFile('files/rocketLineups.min.json', JSON.stringify(fallback));
        } catch (fallbackErr) {
            console.error(fallbackErr.message);
        }
    }
}

module.exports = { get }
