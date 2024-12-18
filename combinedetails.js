const fs = require('fs');

function main()
{
    var events = JSON.parse(fs.readFileSync("./files/events.min.json"));

    fs.readdir("files/temp", function (err, files) {
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }

        files.forEach(f =>
        {
            var data = JSON.parse(fs.readFileSync("./files/temp/" + f));

            events.forEach(e =>
            {
                if (e.eventID == data.id)
                {
                    // add always generic data as 'generic' block in 'extraData' (available for all possible events)
                    if (data.type == "generic")
                    {
                        if (e.extraData === null) {
                            e.extraData = {};
                        }
                        e.extraData.generic = data.data;
                    }
                    // add event specific extra data. Block named as event type name
                    if (data.type == "research-breakthrough")
                    {
                        if (e.extraData === null) {
                            e.extraData = {};
                        }
                        e.extraData.breakthrough = data.data;
                    }
                    else if (data.type == "pokemon-spotlight-hour")
                    {
                        if (e.extraData === null) {
                            e.extraData = {};
                        }
                        e.extraData.spotlight = data.data
                    }
                    else if (data.type == "community-day")
                    {
                        if (e.extraData === null) {
                            e.extraData = {};
                        }
                        e.extraData.communityday = data.data
                    }
                    else if (data.type == "raid-battles")
                    {
                        if (e.extraData === null) {
                            e.extraData = {};
                        }
                        e.extraData.raidbattles = data.data
                    }
                }
            });
        });

        fs.writeFile('files/events.json', JSON.stringify(events, null, 4), err => {
            if (err) {
                console.error(err);
                return;
            }
        });
        fs.writeFile('files/events.min.json', JSON.stringify(events), err => {
            if (err) {
                console.error(err);
                return;
            }
        });

        fs.rm("files/temp", { recursive: true }, (err) => {
            if (err) { throw err; }
        });
    });
}

try
{
    main();
}
catch (e)
{
    console.error("ERROR: " + e);
    process.exit(1);
}