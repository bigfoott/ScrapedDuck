const fs = require('fs');
const events = require('./pages/events')

async function main()
{
    if (!fs.existsSync('files')){
        fs.mkdirSync('files');
    }

    await events.getEvents();
}

main();