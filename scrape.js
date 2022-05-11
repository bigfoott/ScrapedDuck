const fs = require('fs');
const events = require('./pages/events')
// const raids = require('./pages/raids')
// const research = require('./pages/research')
// const eggs = require('./pages/eggs')

async function main()
{
    if (!fs.existsSync('files'))
    {
        fs.mkdirSync('files');
    }

    await events.get();
    // await raids.get();
    // await research.get();
    // await eggs.get();
}

main();