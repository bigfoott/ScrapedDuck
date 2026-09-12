const fsp = require('fs').promises;
const { JSDOM } = require('jsdom');
const config = require('../config');
const { fetchJSON } = require('../utils');

async function get() {
    try {
        const dom = await JSDOM.fromURL("https://leekduck.com/promo-codes/", {});

        var promoCodes = [];

        // Find all redemption links on the page
        var links = Array.from(dom.window.document.querySelectorAll('a'));

        links.forEach(link => {
            var href = link.href || "";
            if (!href.includes('store.pokemongo.com/offer-redemption')) return;

            var captures = /.*?passcode=(\w+)/.exec(href);
            if (!captures || captures.length < 2) return;

            var code = captures[1];

            // Skip if we already captured this code
            if (promoCodes.some(p => p.code === code)) return;

            // Try to find reward description from nearby text
            var rewards = "";
            var parent = link.closest('.promo-code') || link.closest('.code-item') || link.parentElement;
            if (parent) {
                var rewardEl = parent.querySelector('.rewards') || parent.querySelector('.reward-text') || parent.querySelector('.description');
                if (rewardEl) {
                    rewards = rewardEl.textContent.trim();
                }
            }

            promoCodes.push({
                code: code,
                rewards: rewards,
                link: href
            });
        });

        await fsp.writeFile('files/promoCodes.json', JSON.stringify(promoCodes, null, 4));
        await fsp.writeFile('files/promoCodes.min.json', JSON.stringify(promoCodes));
    } catch (err) {
        console.error(err);
        try {
            const fallback = await fetchJSON(`${config.fallbackBaseUrl}/promoCodes.min.json`);
            await fsp.writeFile('files/promoCodes.json', JSON.stringify(fallback, null, 4));
            await fsp.writeFile('files/promoCodes.min.json', JSON.stringify(fallback));
        } catch (fallbackErr) {
            console.error(fallbackErr.message);
        }
    }
}

module.exports = { get }
