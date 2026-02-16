const fsp = require('fs').promises;
const { JSDOM } = require('jsdom');

async function get(url, id, bkp) {
    try {
        const dom = await JSDOM.fromURL(url, {});

        var maxbattles = {
            pokemon: [],
        };

        var content = dom.window.document.querySelectorAll('.pkmn-list-flex');

        content.forEach(list => {
            list.querySelectorAll(":scope > .pkmn-list-item").forEach(p => {
                var pokemon = {
                    name: p.querySelector(":scope > .pkmn-name")?.innerHTML || "",
                    image: p.querySelector(":scope > .pkmn-list-img > img")?.src || "",
                    canBeShiny: p.querySelector(":scope > .shiny-icon") != null
                };
                maxbattles.pokemon.push(pokemon);
            });
        });

        if (maxbattles.pokemon.length > 0) {
            await fsp.writeFile(`files/temp/${id}.json`, JSON.stringify({ id: id, type: "max-battles", data: maxbattles }));
        }
    } catch (err) {
        console.error(err);
        for (var i = 0; i < bkp.length; i++) {
            if (bkp[i].eventID == id && bkp[i].extraData != null) {
                if ('maxbattles' in bkp[i].extraData) {
                    await fsp.writeFile(`files/temp/${id}.json`, JSON.stringify({ id: id, type: "max-battles", data: bkp[i].extraData.maxbattles.data }));
                }
            }
        }
    }
}

module.exports = { get }
