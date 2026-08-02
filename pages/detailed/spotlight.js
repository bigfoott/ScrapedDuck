const fsp = require('fs').promises;
const { JSDOM } = require('jsdom');

async function get(url, id, bkp) {
    try {
        const dom = await JSDOM.fromURL(url, {});

        var content = dom.window.document.querySelectorAll('.pkmn-list-flex');
        var description = dom.window.document.querySelector('.event-description');

        var spotlight = {
            name: "",
            canBeShiny: false,
            image: "",
            bonus: "",
            list: []
        };

        if (content.length > 0) {
            spotlight.name = content[0].querySelector(":scope > .pkmn-list-item > .pkmn-name")?.innerHTML || "";
            spotlight.canBeShiny = content[0].querySelector(":scope > .pkmn-list-item > .shiny-icon") != null;
            spotlight.image = content[0].querySelector(":scope > .pkmn-list-item > .pkmn-list-img > img")?.src || "";

            dom.window.document.querySelectorAll(".pkmn-list-item").forEach(p => {
                var pokemon = {
                    name: p.querySelector(":scope > .pkmn-name")?.innerHTML || "",
                    canBeShiny: p.querySelector(":scope > .shiny-icon") != null,
                    image: p.querySelector(":scope > .pkmn-list-img > img")?.src || ""
                }
                spotlight.list.push(pokemon);
            });
        } else if (description) {
            var strongText = Array.from(description.querySelectorAll("strong")).map(s => s.textContent.trim());
            var title = dom.window.document.querySelector(".page-title")?.textContent.trim().replace(/\s+/g, " ") || "";

            spotlight.name = strongText.length > 1 ? strongText[1] : title.replace(/\s*Spotlight\s+Hour\s*$/i, "");
            spotlight.bonus = strongText.length > 2 ? strongText[2] : "";

            if (spotlight.name) {
                spotlight.list.push({
                    name: spotlight.name,
                    canBeShiny: spotlight.canBeShiny,
                    image: spotlight.image
                });
            }
        }

        if (!spotlight.bonus && description) {
            var temp = description.innerHTML;
            var split = temp.split("<strong>");
            spotlight.bonus = split[split.length - 1].split("</strong>")[0];
        }

        if (spotlight.name || spotlight.bonus || spotlight.list.length > 0) {
            await fsp.writeFile(`files/temp/${id}.json`, JSON.stringify({ id: id, type: "pokemon-spotlight-hour", data: spotlight }));
        }
    } catch (err) {
        console.error(err);
        for (var i = 0; i < bkp.length; i++) {
            if (bkp[i].eventID == id && bkp[i].extraData != null && 'spotlight' in bkp[i].extraData) {
                var fallbackData = bkp[i].extraData.spotlight.data || bkp[i].extraData.spotlight;
                await fsp.writeFile(`files/temp/${id}.json`, JSON.stringify({ id: id, type: "pokemon-spotlight-hour", data: fallbackData }));
            }
        }
    }
}

module.exports = { get }
