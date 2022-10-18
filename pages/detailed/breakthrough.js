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

            var content = dom.window.document.querySelectorAll('.pkmn-list-flex')[0];

            var reward = {
                name: "",
                canBeShiny: false,
                image: ""
            };

            reward.name = content.querySelector(":scope > .pkmn-list-item > .pkmn-name").innerHTML;
            reward.canBeShiny = content.querySelector(":scope > .pkmn-list-item > .shiny-icon") != null;
            reward.image = content.querySelector(":scope > .pkmn-list-item > .pkmn-list-img > img").src;

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