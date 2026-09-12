const fsp = require('fs').promises;
const { JSDOM } = require('jsdom');
const config = require('../config');
const { fetchJSON } = require('../utils');

async function get() {
    try {
        const dom = await JSDOM.fromURL("https://leekduck.com/research/", {});

        var taskNameToID = [];
        taskNameToID["Event Tasks"] = "event";
        taskNameToID["Catching Tasks"] = "catch";
        taskNameToID["Throwing Tasks"] = "throw";
        taskNameToID["Battling Tasks"] = "battle";
        taskNameToID["Exploring Tasks"] = "explore";
        taskNameToID["Training Tasks"] = "training";
        taskNameToID["Team GO Rocket Tasks"] = "rocket";
        taskNameToID["Buddy &amp; Friendship Tasks"] = "buddy";
        taskNameToID["AR Scanning Tasks"] = "ar";
        taskNameToID["Sponsored Tasks"] = "sponsored";

        // Capture Research Breakthrough section
        var breakthrough = null;

        var breakthroughSection = dom.window.document.querySelector('.research-breakthrough');
        if (!breakthroughSection) {
            breakthroughSection = dom.window.document.querySelector('.breakthrough-pokemon');
        }
        if (!breakthroughSection) {
            // Fallback: look for .pkmn-list-flex as the first such element on the page
            breakthroughSection = dom.window.document.querySelector('.pkmn-list-flex');
        }
        if (breakthroughSection) {
            var pkmnItems = breakthroughSection.querySelectorAll('.pkmn-list-item');
            if (pkmnItems.length > 0) {
                var p = pkmnItems[0];
                breakthrough = {
                    name: p.querySelector(":scope > .pkmn-name")?.innerHTML || "",
                    image: p.querySelector(":scope > .pkmn-list-img > img")?.src || "",
                    canBeShiny: p.querySelector(":scope > .shiny-icon") != null
                };
            }
        }

        var types = dom.window.document.querySelectorAll('.task-category');

        var research = []

        types.forEach(_e => {
            _e.querySelectorAll(":scope > .task-list > .task-item").forEach(task => {
                var text = task.querySelector(":scope > .task-text").innerHTML.trim();
                var type = taskNameToID[_e.querySelector(":scope > h2").innerHTML.trim()];

                var rewards = [];

                task.querySelectorAll(":scope > .reward-list > .reward").forEach(r => {
                    if (r.dataset.rewardType == "encounter") {
                        var reward = {
                            type: "encounter",
                            name: "",
                            image: "",
                            canBeShiny: false,
                            combatPower: {
                                min: -1,
                                max: -1
                            }
                        };

                        reward.name = r.querySelector(":scope > .reward-label > span").innerHTML.trim();
                        reward.image = r.querySelector(":scope > .reward-bubble > .reward-image").src;

                        reward.combatPower.min = parseInt(r.querySelector(":scope > .cp-values > .min-cp").innerHTML.trim().split("</div>")[1]);
                        reward.combatPower.max = parseInt(r.querySelector(":scope > .cp-values > .max-cp").innerHTML.trim().split("</div>")[1]);
                        reward.canBeShiny = r.querySelector(":scope > .reward-bubble > .shiny-icon") != null;

                        rewards.push(reward);
                    } else {
                        // Item reward (stardust, items, candy, etc.)
                        var reward = {
                            type: r.dataset.rewardType || "item",
                            name: "",
                            image: "",
                            quantity: ""
                        };

                        var labelEl = r.querySelector(":scope > .reward-label > span");
                        if (labelEl) reward.name = labelEl.innerHTML.trim();

                        var imageEl = r.querySelector(":scope > .reward-bubble > .reward-image");
                        if (imageEl) reward.image = imageEl.src;

                        // Try to extract quantity from the label text (e.g., "200 Stardust" -> "200")
                        var quantityMatch = reward.name.match(/^(\d[\d,]*)\s*/);
                        if (quantityMatch) {
                            reward.quantity = quantityMatch[1];
                        }

                        rewards.push(reward);
                    }
                });

                if (rewards.length > 0) {
                    if (research.filter(r => r.text == text && r.type == type).length > 0) {
                        var foundResearch = research.findIndex(fr => { return fr.text == text });
                        rewards.forEach(rw => {
                            research[foundResearch].rewards.push(rw);
                        });
                    }
                    else {
                        research.push({ "text": text, "type": type, "rewards": rewards });
                    }
                }
            });
        });

        var output = {
            breakthrough: breakthrough,
            tasks: research
        };

        await fsp.writeFile('files/research.json', JSON.stringify(output, null, 4));
        await fsp.writeFile('files/research.min.json', JSON.stringify(output));
    } catch (err) {
        console.error(err);
        try {
            const fallback = await fetchJSON(`${config.fallbackBaseUrl}/research.min.json`);
            await fsp.writeFile('files/research.json', JSON.stringify(fallback, null, 4));
            await fsp.writeFile('files/research.min.json', JSON.stringify(fallback));
        } catch (fallbackErr) {
            console.error(fallbackErr.message);
        }
    }
}

module.exports = { get }
