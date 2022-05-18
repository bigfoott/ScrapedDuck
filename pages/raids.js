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
                            normalMin: -1,
                            normalMax: -1,
                            boostMin: -1,
                            boostMax: -1
                        },
                        boostWeather: [],
                        image: "",
                        typesAssets: [],
                        boostWeatherAssets: []
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
                            boss.types.push(img.getAttribute("title").toLowerCase());
                            boss.typesAssets.push(img.src);
                        }
                    });

                    var tempPower = e.getElementsByClassName("boss-2")[0].textContent.trim().substring(3);
                    boss.combatPower.normalMin = parseInt(tempPower.split(" - ")[0]);
                    boss.combatPower.normalMax = parseInt(tempPower.split(" - ")[1]);

                    var tempBoost = e.getElementsByClassName("boss-3")[0];
                    tempBoost.getElementsByClassName("boss-weather")[0].childNodes.forEach(img =>
                    {
                        if (img && img.className && img.className.startsWith("weather"))
                        {
                            boss.boostWeather.push(img.getAttribute("title").toLowerCase());
                            boss.boostWeatherAssets.push(img.src);
                        }
                    });
                    var tempBoostPower = tempBoost.getElementsByClassName("boosted-cp")[0].textContent.trim().substring(3);
                    boss.combatPower.boostedMin = parseInt(tempBoostPower.split(" - ")[0]);
                    boss.combatPower.boostedMax = parseInt(tempBoostPower.split(" - ")[1]);

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