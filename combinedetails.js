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
                    if (data.type == "research-breakthrough")
                    {
                        e.extraData = { breakthrough: data.data }
                    }
                    else if (data.type == "pokemon-spotlight-hour")
                    {
                        e.extraData = { spotlight: data.data }
                    }
                    else if (data.type == "community-day")
                    {
                        e.extraData = { communityday: data.data }
                    }
                    else if (data.type == "raid-battles")
                    {
                        e.extraData = { raidbattles: data.data }
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

        fs.rmdir("files/temp", { recursive: true }, (err) => {
            if (err) { throw err; }
        });
    });
}

main();