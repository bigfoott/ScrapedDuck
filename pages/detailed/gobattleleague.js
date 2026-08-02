const fsp = require('fs').promises;
const { JSDOM } = require('jsdom');

async function get(url, id, bkp) {
    try {
        const dom = await JSDOM.fromURL(url, {});

        var gbl = {
            description: "",
            pokemon: [],
        };

        var descEl = dom.window.document.querySelector('.event-description');
        if (descEl) {
            gbl.description = descEl.textContent.trim().replace(/\n{3,}/g, '\n\n');
        }

        var content = dom.window.document.querySelectorAll('.pkmn-list-flex');
        content.forEach(list => {
            list.querySelectorAll(":scope > .pkmn-list-item").forEach(p => {
                var pokemon = {
                    name: p.querySelector(":scope > .pkmn-name")?.innerHTML || "",
                    image: p.querySelector(":scope > .pkmn-list-img > img")?.src || "",
                    canBeShiny: p.querySelector(":scope > .shiny-icon") != null
                };
                gbl.pokemon.push(pokemon);
            });
        });

        if (gbl.description || gbl.pokemon.length > 0) {
            await fsp.writeFile(`files/temp/${id}.json`, JSON.stringify({ id: id, type: "go-battle-league", data: gbl }));
        }
    } catch (err) {
        console.error(err);
        for (var i = 0; i < bkp.length; i++) {
            if (bkp[i].eventID == id && bkp[i].extraData != null) {
                if ('gobattleleague' in bkp[i].extraData) {
                    await fsp.writeFile(`files/temp/${id}.json`, JSON.stringify({ id: id, type: "go-battle-league", data: bkp[i].extraData.gobattleleague.data }));
                }
            }
        }
    }
}

module.exports = { get }
