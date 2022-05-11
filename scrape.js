const fs = require('fs');
const events = require('./pages/events')

if (!fs.existsSync('files')){
    fs.mkdirSync('files');
}

async function main()
{
    await events.getEvents();
}

main();