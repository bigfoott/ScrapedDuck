const fs = require('fs');
import { getEvents } from 'pages/events.js'

if (!fs.existsSync('files')){
    fs.mkdirSync('files');
}

await getEvents();