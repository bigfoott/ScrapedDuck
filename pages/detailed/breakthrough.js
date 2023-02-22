const fs = require('fs');
const jsd = require('jsdom');
const { JSDOM } = jsd;
const https = require('https');

function get(url, id, bkp)
{
    return new Promise(resolve => {
        JSDOM.fromURL(url, {
        })
        .then((dom) => {

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

            fs.writeFile(`files/temp/${id}.json`, JSON.stringify({ id: id, type: "research-breakthrough", data: reward }), err => {
                if (err) {
                    console.error(err);
                    return;
                }
            });
        }).catch(_err =>
        {
            for (var i = 0; i < bkp.length; i++)
            {
                if (bkp[i].eventID == id)
                {
                    fs.writeFile(`files/temp/${id}.json`, JSON.stringify({ id: id, type: "research-breakthrough", data: bkp[i].extraData.breakthrough.data }), err => {
                        if (err) {
                            console.error(err);
                            return;
                        }
                    });
                }
            }
        });
    })
}

module.exports = { get }