const fsp = require('fs').promises;
const { JSDOM } = require('jsdom');

async function get(url, id, bkp) {
    try {
        const dom = await JSDOM.fromURL(url, {});

        var raidhour = {
            pokemon: [],
        };

        var content = dom.window.document.querySelectorAll('.pkmn-list-flex');

        if (content.length > 0) {
            content[0].querySelectorAll(":scope > .pkmn-list-item").forEach(p => {
                var pokemon = {
                    name: p.querySelector(":scope > .pkmn-name")?.innerHTML || "",
                    image: p.querySelector(":scope > .pkmn-list-img > img")?.src || "",
                    canBeShiny: p.querySelector(":scope > .shiny-icon") != null
                };
                raidhour.pokemon.push(pokemon);
            });
        }

        if (raidhour.pokemon.length > 0) {
            await fsp.writeFile(`files/temp/${id}.json`, JSON.stringify({ id: id, type: "raid-hour", data: raidhour }));
        }
    } catch (err) {
        console.error(err);
        for (var i = 0; i < bkp.length; i++) {
            if (bkp[i].eventID == id && bkp[i].extraData != null) {
                if ('raidhour' in bkp[i].extraData) {
                    await fsp.writeFile(`files/temp/${id}.json`, JSON.stringify({ id: id, type: "raid-hour", data: bkp[i].extraData.raidhour.data }));
                }
            }
        }
    }
}

module.exports = { get }
