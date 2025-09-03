const fs = require('fs');
const jsd = require('jsdom');
const { JSDOM } = jsd;
const https = require('https');

function get()
{
    return new Promise(resolve => {
        JSDOM.fromURL("https://leekduck.com/boss/", {
        })
        .then((dom) => {

            const raidBosses = dom.window.document.querySelector('.raid-bosses');
            const tiers = raidBosses.querySelectorAll('.tier');
            let bosses = [];

            tiers.forEach(tierDiv => {
                const tierHeader = tierDiv.querySelector('h2.header');
                const currentTier = tierHeader ? tierHeader.textContent.trim() : "";

                const cards = tierDiv.querySelectorAll('.grid .card');
                cards.forEach(card => {
                    let boss = {
                        name: "",
                        tier: currentTier,
                        canBeShiny: false,
                        types: [],
                        combatPower: {
                            normal: { min: -1, max: -1 },
                            boosted: { min: -1, max: -1 }
                        },
                        boostedWeather: [],
                        image: ""
                    };

                    // Name
                    boss.name = card.querySelector('.identity .name')?.textContent.trim() || "";

                    // Image
                    boss.image = card.querySelector('.boss-img img')?.src || "";

                    // Shiny
                    boss.canBeShiny = !!card.querySelector('.boss-img .shiny-icon');

                    // Types
                    card.querySelectorAll('.boss-type .type img').forEach(img => {
                        boss.types.push({
                            name: img.getAttribute('title')?.toLowerCase() || "",
                            image: img.src
                        });
                    });

                    // Combat Power (normal)
                    let cpText = card.querySelector('.cp-range')?.textContent.replace('CP', '').trim() || "";
                    let [cpMin, cpMax] = cpText.split('-').map(s => parseInt(s.trim()));
                    boss.combatPower.normal.min = cpMin || -1;
                    boss.combatPower.normal.max = cpMax || -1;

                    // Combat Power (boosted)
                    let boostedText = card.querySelector('.boosted-cp-row .boosted-cp')?.textContent.replace('CP', '').trim() || "";
                    let [boostMin, boostMax] = boostedText.split('-').map(s => parseInt(s.trim()));
                    boss.combatPower.boosted.min = boostMin || -1;
                    boss.combatPower.boosted.max = boostMax || -1;

                    // Boosted Weather
                    card.querySelectorAll('.weather-boosted .boss-weather .weather-pill img').forEach(img => {
                        boss.boostedWeather.push({
                            name: img.getAttribute('alt')?.toLowerCase() || "",
                            image: img.src
                        });
                    });

                    bosses.push(boss);
                });
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
        }).catch(_err =>
            {
                console.log(_err);
                https.get("https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/raids.min.json", (res) =>
                {
                    let body = "";
                    res.on("data", (chunk) => { body += chunk; });
                
                    res.on("end", () => {
                        try
                        {
                            let json = JSON.parse(body);
    
                            fs.writeFile('files/raids.json', JSON.stringify(json, null, 4), err => {
                                if (err) {
                                    console.error(err);
                                    return;
                                }
                            });
                            fs.writeFile('files/raids.min.json', JSON.stringify(json), err => {
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