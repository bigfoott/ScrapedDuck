const fs = require('fs');
const jsd = require('jsdom');
const { JSDOM } = jsd;
const https = require('https');

function get()
{
    return new Promise(resolve => {
        JSDOM.fromURL("https://www.leekduck.com/eggs/", {
        })
        .then((dom) => {

            var content = dom.window.document.querySelector('.page-content').childNodes;

            var eggs = [];
            var currentType = "";
            var currentAdventureSync = false;
            content.forEach(c =>
            {
                if (c.tagName == "H2")
                {
                    currentType = c.innerHTML.trim();
                    currentAdventureSync = currentType.includes("(Adventure Sync Rewards)");
                    currentType = currentType.split(" Eggs")[0];
                }
                else if (c.className == "egg-list-flex")
                {
                    c.querySelectorAll(".egg-list-item").forEach(e =>
                    {
                        var pokemon = {
                            name: "",
                            eggType: "",
                            isAdventureSync: false,
                            image: "",
                            canBeShiny: false,
                            combatPower: {
                                min: -1,
                                max: -1
                            }
                        };

                        pokemon.name = e.querySelector(":scope > .hatch-pkmn").innerHTML;
                        pokemon.eggType = currentType;
                        pokemon.isAdventureSync = currentAdventureSync;
                        pokemon.image = e.querySelector(":scope > .egg-list-img > img").src;
                        pokemon.canBeShiny = e.querySelector(":scope > .shiny-icon") != null;

                        var combatPower = e.querySelector(":scope > .font-size-smaller").innerHTML.split('</span>')[1];
                        pokemon.combatPower.min = parseInt(combatPower.split(' - ')[0]);
                        pokemon.combatPower.max = parseInt(combatPower.split(' - ')[1]);

                        eggs.push(pokemon);
                    });
                }
            })

            fs.writeFile('files/eggs.json', JSON.stringify(eggs, null, 4), err => {
                if (err) {
                    console.error(err);
                    return;
                }
            });
            fs.writeFile('files/eggs.min.json', JSON.stringify(eggs), err => {
                if (err) {
                    console.error(err);
                    return;
                }
            });
        }).catch(_err =>
            {
                console.log(_err);
                https.get("https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/eggs.min.json", (res) =>
                {
                    let body = "";
                    res.on("data", (chunk) => { body += chunk; });
                
                    res.on("end", () => {
                        try
                        {
                            let json = JSON.parse(body);
    
                            fs.writeFile('files/eggs.json', JSON.stringify(json, null, 4), err => {
                                if (err) {
                                    console.error(err);
                                    return;
                                }
                            });
                            fs.writeFile('files/eggs.min.json', JSON.stringify(json), err => {
                                if (err) {
                                    console.error(err);
                                    return;
                                }
                            });
                        }
                        catch (error)
                        {
                            console.error(error.message);
                        };
                    });
                
                }).on("error", (error) => {
                    console.error(error.message);
                });
            });
    })
}

module.exports = { get }