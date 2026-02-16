const fs = require('fs');
const events = require('./pages/events')
const raids = require('./pages/raids')
const research = require('./pages/research')
const eggs = require('./pages/eggs')
const rocketLineups = require('./pages/rocketLineups')
const promoCodes = require('./pages/promoCodes')

async function main() {
    if (!fs.existsSync('files'))
        fs.mkdirSync('files');

    await Promise.all([
        events.get(),
        raids.get(),
        research.get(),
        eggs.get(),
        rocketLineups.get(),
        promoCodes.get()
    ]);
}

main().catch(e => {
    console.error("ERROR: " + e);
    process.exit(1);
});
