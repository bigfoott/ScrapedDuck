const fs = require('fs');
const jsd = require('jsdom');
const { JSDOM } = jsd;
const https = require('https');
 
function get(url, id, bkp)
{
    return new Promise(resolve => {
        JSDOM.fromURL(url, {
        })
        .then((dom) => {

            // grab all the links from the page
            var links = Array.from(dom.window.document.querySelectorAll('a'));
            
            // look for links to the store 'offer redemption' page, and pluck out the passcodes.
            var codes = links.map(l => l.href)
                .filter(href => href.includes('store.pokemongo.com/offer-redemption'))
                .map(href => {
                    var captures = /.*?passcode=(\w+)/.exec(href);
                    if (captures && captures.length > 1) {
                        return captures[1];
                    }
                    return null;
                })
                .filter(code => code != null);
            
            if (!codes || codes.length == 0) {
                return;
            }
            
            fs.writeFile(`files/temp/${id}_codes.json`, JSON.stringify({ id: id, type: "promo-codes", data: codes }), err => {
                if (err) {
                    console.error(err);
                    return;
                }
            });
        }).catch(_err =>
        {
            console.error(_err);
        });
    })
}

module.exports = { get }