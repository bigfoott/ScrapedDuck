const fsp = require('fs').promises;
const { JSDOM } = require('jsdom');
const config = require('../config');
const { fetchJSON } = require('../utils');

async function get() {
    try {
        const dom = await JSDOM.fromURL("https://leekduck.com/raid-bosses/", {});

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

        await fsp.writeFile('files/raids.json', JSON.stringify(bosses, null, 4));
        await fsp.writeFile('files/raids.min.json', JSON.stringify(bosses));
    } catch (err) {
        console.error(err);
        try {
            const fallback = await fetchJSON(`${config.fallbackBaseUrl}/raids.min.json`);
            await fsp.writeFile('files/raids.json', JSON.stringify(fallback, null, 4));
            await fsp.writeFile('files/raids.min.json', JSON.stringify(fallback));
        } catch (fallbackErr) {
            console.error(fallbackErr.message);
        }
    }
}

module.exports = { get }
