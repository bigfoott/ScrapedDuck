const fs = require('fs');
const jsd = require('jsdom');
const { JSDOM } = jsd;
const https = require('https');

/**
 * Create temporary json file (<event-id>_generic.json) for each event with generic event data.
 *
 * @param {string} url leekduck.com url for eventspecfic website.
 * @param {string} id unique event id string.
 * @param {dict} bkp parsed event_min.json. Used for get fallback data, if anything goes wrong.
 * @return {Promise} -
 */
function get(url, id, bkp)
{
    return new Promise(resolve => {
        JSDOM.fromURL(url, {
        })
        .then((dom) => {

            var generic = {
                hasSpawns: false,
                hasFieldResearchTasks: false
            };
            // For events with specific spawns, there is a h2 heading element with id 'spawns'
            if (dom.window.document.getElementById('spawns') !== null)
                generic.hasSpawns = true;
            // For events with specific field research tasks, there is a h2 heading element with id 'field-research-tasks'
            if (dom.window.document.getElementById('field-research-tasks') !== null)
                generic.hasFieldResearchTasks = true;

            fs.writeFile(`files/temp/${id}_generic.json`, JSON.stringify({ id: id, type: "generic", data: generic }), err => {
                if (err) {
                    console.error(err);
                    return;
                }
            });
        }).catch(_err =>
        {
            // on error, go through backup data and search for matching event to use backup data as fallback
            for (var i = 0; i < bkp.length; i++)
            {
                if (bkp[i].eventID == id && bkp[i].extraData != null)
                {
                    // if there are generic data in backup data -> use these data instead for temporary json file
                    if ('generic' in bkp[i].extraData){
                        fs.writeFile(`files/temp/${id}_generic.json`, JSON.stringify({ id: id, type: "generic", data: bkp[i].extraData.generic.data }), err => {
                            if (err) {
                                console.error(err);
                                return;
                            }
                        });
                    }
                }
            }
        });
    })
}

module.exports = { get }