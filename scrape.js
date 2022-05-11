const fs = require('fs');
const events = require('pages/events')

if (!fs.existsSync('files')){
    fs.mkdirSync('files');
}

await events.getEvents();