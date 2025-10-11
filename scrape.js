const fs = require('fs');
const events = require('./pages/events')
const raids = require('./pages/raids')
const research = require('./pages/research')
const eggs = require('./pages/eggs')
const rocketLineups = require('./pages/rocketLineups')

function main()
{
    if (!fs.existsSync('files'))
        fs.mkdirSync('files');

    events.get();
    raids.get();
    research.get();
    eggs.get();
    rocketLineups.get();
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