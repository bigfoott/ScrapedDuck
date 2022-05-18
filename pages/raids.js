const fs = require('fs');
const jsd = require('jsdom');
const { JSDOM } = jsd;

function get()
{
    return new Promise(resolve => {
        JSDOM.fromURL("https://www.leekduck.com/boss/", {
        })
        .then((dom) => {

            var list = dom.window.document.getElementById("raid-list").getElementsByTagName("ul")[0].childNodes;

            var bosses = []
            var currentTier = "";
            list.forEach (e =>
            {
                if (e.className == "header-li")
                {
                    currentTier = e.textContent;
                }
                else if (e.className == "boss-item")
                {
                    e = e.getElementsByClassName("boss-border")[0];

                    var boss = { 
                        name: "",
                        tier: currentTier,
                        canBeShiny: false,
                        types: [],
                        combatPower: {
                            normal: {
                                min: -1,
                                max: -1
                            },
                            boosted: {
                                min: -1,
                                max: -1
                            }
                        },
                        boostedWeather: [],
                        image: ""
                    }

                    boss.name = e.getElementsByClassName("boss-1")[0].getElementsByClassName("boss-name")[0].textContent;
                    
                    var images = e.getElementsByClassName("boss-img")[0].getElementsByTagName("img");
                    (Array.prototype.slice.call(images)).forEach(img =>
                    {
                        if (img.className == "shiny-icon")
                        {
                            boss.canBeShiny = true;
                        }
                        else{
                            boss.image = img.src;
                        }
                    });

                    e.getElementsByClassName("boss-1")[0].getElementsByClassName("boss-type")[0].childNodes.forEach(img =>
                    {
                        if (img && img.className && img.className.startsWith("type"))
                        {
                            boss.types.push({ name: img.getAttribute("title").toLowerCase(), image: img.src });
                        }
                    });

                    var tempPower = e.getElementsByClassName("boss-2")[0].textContent.trim().substring(3);
                    boss.combatPower.normal.min = parseInt(tempPower.split(" - ")[0]);
                    boss.combatPower.normal.max = parseInt(tempPower.split(" - ")[1]);

                    var tempBoost = e.getElementsByClassName("boss-3")[0];
                    tempBoost.getElementsByClassName("boss-weather")[0].childNodes.forEach(img =>
                    {
                        if (img && img.className && img.className.startsWith("weather"))
                        {
                            boss.boostedWeather.push({ name: img.getAttribute("title").toLowerCase(), image: img.src });
                        }
                    });
                    var tempBoostPower = tempBoost.getElementsByClassName("boosted-cp")[0].textContent.trim().substring(3);
                    boss.combatPower.boosted.min = parseInt(tempBoostPower.split(" - ")[0]);
                    boss.combatPower.boosted.max = parseInt(tempBoostPower.split(" - ")[1]);

                    bosses.push(boss);
                }
            });

            fs.writeFile('files/raids.json', JSON.stringify(bosses, null, 4), err => {
                if (err) {
                    console.error(err);
                    return;
                }
            });
            fs.writeFile('files/raids.min.json', JSON.stringify(bosses), err => {
                if (err) {
                    console.error(err);
                    return;
                }
            });
        });
    })
}

module.exports = { get }