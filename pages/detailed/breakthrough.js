const fsp = require('fs').promises;
const { JSDOM } = require('jsdom');

async function get(url, id, bkp) {
    try {
        const dom = await JSDOM.fromURL(url, {});

        var content = dom.window.document.querySelectorAll('.pkmn-list-flex');

        var reward = {
            name: "",
            canBeShiny: false,
            image: "",
            list: []
        };

        reward.name = content[0].querySelector(":scope > .pkmn-list-item > .pkmn-name").innerHTML;
        reward.canBeShiny = content[0].querySelector(":scope > .pkmn-list-item > .shiny-icon") != null;
        reward.image = content[0].querySelector(":scope > .pkmn-list-item > .pkmn-list-img > img").src;

        dom.window.document.querySelectorAll(".pkmn-list-item").forEach(p => {
            var pokemon = {
                name: p.querySelector(":scope > .pkmn-name").innerHTML,
                canBeShiny: p.querySelector(":scope > .shiny-icon") != null,
                image: p.querySelector(":scope > .pkmn-list-img > img").src
            }
            reward.list.push(pokemon);
        })

        await fsp.writeFile(`files/temp/${id}.json`, JSON.stringify({ id: id, type: "research-breakthrough", data: reward }));
    } catch (err) {
        console.error(err);
        for (var i = 0; i < bkp.length; i++) {
            if (bkp[i].eventID == id) {
                await fsp.writeFile(`files/temp/${id}.json`, JSON.stringify({ id: id, type: "research-breakthrough", data: bkp[i].extraData.breakthrough.data }));
            }
        }
    }
}

module.exports = { get }
