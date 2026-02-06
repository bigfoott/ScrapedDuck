const fs = require('fs');
const jsd = require('jsdom');
const { JSDOM } = jsd;
const https = require('https');

function get() {
    return new Promise(resolve => {
        JSDOM.fromURL("https://leekduck.com/raid-bosses/", {
        })
            .then((dom) => {

                let bosses = [];
                const grids = dom.window.document.querySelectorAll('div.grid');

                grids.forEach((grid) => {
                    let tierHeader = grid.previousElementSibling;
                    while (tierHeader && (tierHeader.tagName.toLowerCase() !== 'h2' || !tierHeader.getAttribute('class') || !tierHeader.getAttribute('class').includes('header'))) {
                        tierHeader = tierHeader.previousElementSibling;
                    }
                    let currentTier = tierHeader ? (tierHeader.textContent.trim() || "") : "";
                    if (!currentTier && tierHeader) {
                        const dataTier = tierHeader.getAttribute('data-tier') || "";
                        const tierMap = { '1': '1-Star Raids', '3': '3-Star Raids', '5': '5-Star Raids', 'mega': 'Mega Raids' };
                        currentTier = tierMap[dataTier.toLowerCase()] || dataTier;
                    }

                    const cards = grid.querySelectorAll('div.card');
                    cards.forEach((card) => {
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
                        const nameEl = card.querySelector('p.name') || card.querySelector('.identity .name');
                        boss.name = nameEl ? (nameEl.textContent.trim() || "") : "";

                            // Image
                        boss.image = card.querySelector('div.boss-img img')?.src || "";

                            // Shiny
                        boss.canBeShiny = !!card.querySelector('div.boss-img .shiny-icon');

                            // Types
                        card.querySelectorAll('div.boss-type img, div.boss-type .type img').forEach((img) => {
                            const typeName = img.getAttribute('title') || img.getAttribute('alt') || "";
                            if (typeName) {
                                boss.types.push({
                                    name: typeName.toLowerCase(),
                                    image: img.src || ""
                                });
                            }
                            });

                            // Combat Power (normal)
                        let cpText = (card.querySelector('div.cp-range')?.textContent || "").replace(/^CP\s*/i, "").trim();
                        let [cpMin, cpMax] = cpText.split('-').map(s => parseInt(s.trim(), 10));
                            boss.combatPower.normal.min = cpMin || -1;
                            boss.combatPower.normal.max = cpMax || -1;

                            // Combat Power (boosted)
                        let boostedText = (card.querySelector('div.boosted-cp-row .boosted-cp, div.boosted-cp-row span.boosted-cp')?.textContent || "").replace(/^CP\s*/i, "").trim();
                        let [boostMin, boostMax] = boostedText.split('-').map(s => parseInt(s.trim(), 10));
                            boss.combatPower.boosted.min = boostMin || -1;
                            boss.combatPower.boosted.max = boostMax || -1;

                            // Boosted Weather
                        const weatherContainer = card.querySelector('div.weather-boosted') || card.querySelector('div.boss-3');
                        (weatherContainer?.querySelectorAll('.boss-weather img, .weather-pill img') || []).forEach((img) => {
                            let weatherName = (img.getAttribute('alt') || "").toLowerCase();
                            if (!weatherName && img.getAttribute('src')) {
                                const match = img.getAttribute('src').match(/(\w+)\.png$/);
                                weatherName = match ? match[1].toLowerCase() : "";
                            }
                            if (weatherName) {
                                boss.boostedWeather.push({
                                    name: weatherName,
                                    image: img.src || ""
                                });
                            }
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
            }).catch(_err => {
                console.log(_err);
                https.get("https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/raids.min.json", (res) => {
                    let body = "";
                    res.on("data", (chunk) => { body += chunk; });

                    res.on("end", () => {
                        try {
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
                        catch (error) {
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