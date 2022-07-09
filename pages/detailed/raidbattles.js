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

            var raidboss = {
                bosses: [],
                shinies: []
            };

            var pageContent = dom.window.document.querySelector('.page-content');

            var lastHeader = "";
            pageContent.childNodes.forEach(n =>
            {
                if (n.className && n.className.includes("event-section-header"))
                {
                    lastHeader = n.id;
                }
                
                if (lastHeader == "raids" && n.className == "pkmn-list-flex")
                {
                    var bosses = n.querySelectorAll(":scope > .pkmn-list-item");
                    
                    bosses.forEach(s =>
                    {
                        var temp = {};
                        temp.name = s.querySelector(":scope > .pkmn-name").innerHTML;
                        temp.image = s.querySelector(":scope > .pkmn-list-img > img").src;
                        temp.canBeShiny = s.querySelector(":scope > .shiny-icon") != null;
                        raidboss.bosses.push(temp);
                    });
                }
                else if (lastHeader == "shiny" && n.className == "pkmn-list-flex")
                {
                    var shinies = n.querySelectorAll(":scope > .pkmn-list-item");

                    shinies.forEach(f =>
                    {
                        var poke = {};
                        poke.name = f.querySelector(":scope > .pkmn-name").innerHTML;
                        poke.image = f.querySelector(":scope > .pkmn-list-img > img").src;

                        raidboss.shinies.push(poke);
                    });
                }
            });

            fs.writeFile(`files/temp/${id}.json`, JSON.stringify({ id: id, type: "raid-battles", data: raidboss }), err => {
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
                    fs.writeFile(`files/temp/${id}.json`, JSON.stringify({ id: id, type: "raid-battles", data: bkp[i].extraData }), err => {
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