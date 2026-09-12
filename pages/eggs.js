const fsp = require('fs').promises;
const { JSDOM } = require('jsdom');
const config = require('../config');
const { fetchJSON } = require('../utils');

async function get() {
    try {
        const dom = await JSDOM.fromURL("https://leekduck.com/eggs/", {});

        var content = dom.window.document.querySelector('.page-content').childNodes;

        var eggs = [];
        var currentType = "";
        var currentAdventureSync = false;
        var currentGiftExchange = false;

        content.forEach(c => {
            if (c.tagName == "H2") {
                currentType = c.innerHTML.trim();
                currentAdventureSync = currentType.includes("(Adventure Sync Rewards)");
                currentGiftExchange = currentType.includes("(From Route Gift)");
                currentType = currentType.split(" Eggs")[0];
            }
            else if (c.className == "egg-grid") {
                c.querySelectorAll(".pokemon-card").forEach(e => {
                    var pokemon = {
                        name: "",
                        eggType: "",
                        isAdventureSync: false,
                        image: "",
                        canBeShiny: false,
                        combatPower: {
                            min: -1,
                            max: -1
                        },
                        isRegional: false,
                        isGiftExchange: false,
                        rarity: 0
                    };

                    pokemon.name = e.querySelector(".name").innerHTML || "";
                    pokemon.eggType = currentType;
                    pokemon.isAdventureSync = currentAdventureSync;
                    pokemon.image = e.querySelector(".icon img").src || "";
                    pokemon.canBeShiny = e.querySelector(".shiny-icon") != null;
                    pokemon.isRegional = e.querySelector(".regional-icon") != null;
                    pokemon.isGiftExchange = currentGiftExchange;

                    var cpText = e.querySelector(".cp-range").innerHTML;
                    var cpValue = cpText.replace('<span class="label">CP </span>', '').trim();

                    // Logic to handle single CP value if no range is provided
                    if (cpValue.includes(' - ')) {
                        pokemon.combatPower.min = parseInt(cpValue.split(' - ')[0]);
                        pokemon.combatPower.max = parseInt(cpValue.split(' - ')[1]);
                    } else {
                        pokemon.combatPower.min = parseInt(cpValue);
                        pokemon.combatPower.max = parseInt(cpValue);
                    }

                    var rarityDiv = e.querySelector(".rarity");
                    if (rarityDiv) {
                        var miniEggs = rarityDiv.querySelectorAll("svg.mini-egg");
                        pokemon.rarity = miniEggs.length;
                    }

                    eggs.push(pokemon);
                });
            }
        })

        await fsp.writeFile('files/eggs.json', JSON.stringify(eggs, null, 4));
        await fsp.writeFile('files/eggs.min.json', JSON.stringify(eggs));
    } catch (err) {
        console.error(err);
        try {
            const fallback = await fetchJSON(`${config.fallbackBaseUrl}/eggs.min.json`);
            await fsp.writeFile('files/eggs.json', JSON.stringify(fallback, null, 4));
            await fsp.writeFile('files/eggs.min.json', JSON.stringify(fallback));
        } catch (fallbackErr) {
            console.error(fallbackErr.message);
        }
    }
}

module.exports = { get }
