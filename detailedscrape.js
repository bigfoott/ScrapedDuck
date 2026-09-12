const fsp = require('fs').promises;
const { fallbackBaseUrl } = require('./config');
const { fetchJSON } = require('./utils');

const breakthrough = require('./pages/detailed/breakthrough')
const spotlight = require('./pages/detailed/spotlight')
const communityday = require('./pages/detailed/communityday')
const raidbattles = require('./pages/detailed/raidbattles')
const research = require('./pages/detailed/research')
const generic = require('./pages/detailed/generic')
const raidhour = require('./pages/detailed/raidhour')
const maxbattles = require('./pages/detailed/maxbattles')
const gobattleleague = require('./pages/detailed/gobattleleague')

async function main()
{
    const fs = require('fs');
    if (!fs.existsSync('files/temp'))
        fs.mkdirSync('files/temp');

    var events = JSON.parse(await fsp.readFile("./files/events.min.json", "utf-8"));

    var bkp = await fetchJSON(`${fallbackBaseUrl}/events.min.json`);

    var promises = [];

    events.forEach(e => {
        // get generic extra data independend from event type
        promises.push(generic.get(e.link, e.eventID, bkp));
        // get event type specific extra data
        if (e.eventType == "research-breakthrough")
        {
            promises.push(breakthrough.get(e.link, e.eventID, bkp));
        }
        else if (e.eventType == "pokemon-spotlight-hour")
        {
            promises.push(spotlight.get(e.link, e.eventID, bkp));
        }
        else if (e.eventType == "community-day")
        {
            promises.push(communityday.get(e.link, e.eventID, bkp));
        }
        else if (e.eventType == "raid-battles")
        {
            promises.push(raidbattles.get(e.link, e.eventID, bkp));
        }
        else if (e.eventType == "research")
        {
            promises.push(research.get(e.link, e.eventID, bkp));
        }
        else if (e.eventType == "raid-hour")
        {
            promises.push(raidhour.get(e.link, e.eventID, bkp));
        }
        else if (e.eventType == "max-battles" || e.eventType == "max-monday")
        {
            promises.push(maxbattles.get(e.link, e.eventID, bkp));
        }
        else if (e.eventType == "go-battle-league")
        {
            promises.push(gobattleleague.get(e.link, e.eventID, bkp));
        }
    });

    await Promise.all(promises);
}

main().catch(e => {
    console.error("ERROR: " + e);
    process.exit(1);
});
