const fsp = require('fs').promises;
const { JSDOM } = require('jsdom');

async function get(url, id, bkp) {
    try {
        const dom = await JSDOM.fromURL(url, {});

        var content = dom.window.document.querySelectorAll('.pkmn-list-flex');

        var spotlight = {
            name: "",
            canBeShiny: false,
            image: "",
            bonus: "",
            list: []
        };

        spotlight.name = content[0].querySelector(":scope > .pkmn-list-item > .pkmn-name").innerHTML;
        spotlight.canBeShiny = content[0].querySelector(":scope > .pkmn-list-item > .shiny-icon") != null;
        spotlight.image = content[0].querySelector(":scope > .pkmn-list-item > .pkmn-list-img > img").src;

        var temp = dom.window.document.querySelectorAll('.event-description')[0].innerHTML;
        var split = temp.split("<strong>");
        spotlight.bonus = split[split.length - 1].split("</strong>")[0];

        dom.window.document.querySelectorAll(".pkmn-list-item").forEach(p => {
            var pokemon = {
                name: p.querySelector(":scope > .pkmn-name").innerHTML,
                canBeShiny: p.querySelector(":scope > .shiny-icon") != null,
                image: p.querySelector(":scope > .pkmn-list-img > img").src
            }
            spotlight.list.push(pokemon);
        });

        await fsp.writeFile(`files/temp/${id}.json`, JSON.stringify({ id: id, type: "pokemon-spotlight-hour", data: spotlight }));
    } catch (err) {
        console.error(err);
        for (var i = 0; i < bkp.length; i++) {
            if (bkp[i].eventID == id) {
                await fsp.writeFile(`files/temp/${id}.json`, JSON.stringify({ id: id, type: "pokemon-spotlight-hour", data: bkp[i].extraData.spotlight.data }));
            }
        }
    }
}

module.exports = { get }
