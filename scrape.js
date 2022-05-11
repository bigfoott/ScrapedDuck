var fs = require('fs');
var dir = 'files'

if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

fs.writeFile(dir + '/test.txt', (new Date()).toString(), err => {
    if (err) {
        console.error(err)
        return
    }
})