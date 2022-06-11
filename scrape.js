const fs = require('fs');
const events = require('./pages/events')
const raids = require('./pages/raids')
const research = require('./pages/research')
const eggs = require('./pages/eggs')

function main()
{
    if (!fs.existsSync('files'))
    {
        fs.mkdirSync('files');
        fs.mkdirSync('files/temp');
    }

    events.get();
    raids.get();
    research.get();
    eggs.get();
}

main();