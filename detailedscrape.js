const fs = require('fs');
const https = require('https');

const breakthrough = require('./pages/detailed/breakthrough')
const spotlight = require('./pages/detailed/spotlight')
const communityday = require('./pages/detailed/communityday')
const raidbattles = require('./pages/detailed/raidbattles')
const generic = require('./pages/detailed/generic')

function main()
{
    if (!fs.existsSync('files/temp'))
        fs.mkdirSync('files/temp');

    var events = JSON.parse(fs.readFileSync("./files/events.min.json"));

    https.get("https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/events.min.json", (res) =>
    {
        let body = "";
        res.on("data", (chunk) => { body += chunk; });
    
        res.on("end", () => {
            try
            {
                let bkp = JSON.parse(body);

                events.forEach(e => {
                    // get generic extra data independend from event type
                    generic.get(e.link, e.eventID, bkp);
                    // get event type specific extra data
                    if (e.eventType == "research-breakthrough")
                    {
                        breakthrough.get(e.link, e.eventID, bkp);
                    }
                    else if (e.eventType == "pokemon-spotlight-hour")
                    {
                        spotlight.get(e.link, e.eventID, bkp);
                    }
                    else if (e.eventType == "community-day")
                    {
                        communityday.get(e.link, e.eventID, bkp);
                    }
                    else if (e.eventType == "raid-battles")
                    {
                        raidbattles.get(e.link, e.eventID, bkp);
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
}

main();