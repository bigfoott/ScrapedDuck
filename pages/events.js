const fs = require('fs');
const moment = require('moment');
const jsd = require('jsdom');
const { JSDOM } = jsd;
const tzd = require('timezoned-date');
const https = require('https');
const { resolve } = require('path');
const { exec } = require('child_process');

async function get()
{
    var cache = await loadCache();

    console.log("CACHE SIZE: " + cache.length);

    var events = [], first = [], last = [], activeEvents = [];

    //exec('sudo timedatectl set-timezone Pacific/Kiritimati');
    exec('date');
    getData().then((allEvents) => {
        first = allEvents;

        //exec('sudo timedatectl set-timezone Pacific/Gambier');
        exec('date');
        getData().then((allEvents2) => {
            last = allEvents2;

            last.forEach(eventL =>
            {
                var hasFirst = false;
                first.forEach(eventF =>
                {
                    if (!hasFirst && eventF.eventID == eventL.eventID)
                    {
                        var event = eventF;
                        activeEvents.push(event.eventID);
                        event.start = eventL.start;

                        if (event.isLocalTime)
                        {
                            if (event.start)
                            {
                                event.start = event.start.substr(0, event.start.length - 1);
                            }
                            if (event.end)
                            {
                                event.end = event.end.substr(0, event.end.length - 1)
                            }
                        }

                        if (cache.some(e => e.id == event.eventID))
                        {
                            var cachedEvent = cache.filter(e => e.id == event.eventID)[0];
                            if (!cachedEvent.start && event.start)
                            {
                                cachedEvent.start = event.start;
                                cache = cache.filter(e => e.id != event.eventID);
                                cache.push(cachedEvent)
                            }
                            if (!cachedEvent.end && event.end)
                            {
                                cachedEvent.end = event.end;
                                cache = cache.filter(e => e.id != event.eventID);
                                cache.push(cachedEvent)
                            }
                        }

                        if (!event.start)
                        {
                            if (cache.some(e => e.id == event.eventID))
                                event.start = cache.filter(e => e.id == event.eventID)[0].start;
                        }

                        if (!cache.some(e => e.id == event.eventID))
                        {
                            cache.push({ "id": event.eventID, "start": event.start, "end": event.end });
                        }

                        delete event.isLocalTime;

                        events.push(event);
                        
                        hasFirst = true;
                    }
                });
                if (!hasFirst)
                {
                    var event = eventL;
                    activeEvents.push(event.eventID);

                    if (event.isLocalTime)
                    {
                        if (event.start)
                        {
                            event.start = event.start.substr(0, event.start.length - 1);
                        }
                        if (event.end)
                        {
                            event.end = event.end.substr(0, event.end.length - 1)
                        }
                    }

                    if (cache.some(e => e.id == event.eventID))
                    {
                        var cachedEvent = cache.filter(e => e.id == event.eventID)[0];
                        if (!cachedEvent.start && event.start)
                        {
                            cachedEvent.start = event.start;
                            cache = cache.filter(e => e.id != event.eventID);
                            cache.push(cachedEvent)
                        }
                        if (!cachedEvent.end && event.end)
                        {
                            cachedEvent.end = event.end;
                            cache = cache.filter(e => e.id != event.eventID);
                            cache.push(cachedEvent)
                        }
                    }

                    if (!event.start)
                    {
                        if (cache.some(e => e.id == event.eventID))
                            event.start = cache.filter(e => e.id == event.eventID)[0].start;
                    }

                    if (!cache.some(e => e.id == event.eventID))
                    {
                        cache.push({ "id": event.eventID, "start": event.start, "end": event.end });
                    }

                    delete event.isLocalTime;

                    events.push(event);
                }
            });

            cache = cache.filter(e => activeEvents.includes(e.id));

            fs.writeFile('files/events.json', JSON.stringify(events, null, 4), err => {
                if (err) {
                    console.error(err);
                    return;
                }
            });
            fs.writeFile('files/events.min.json', JSON.stringify(events), err => {
                if (err) {
                    console.error(err);
                    return;
                }
            });

            fs.writeFile('files/cache/eventsCache.json', JSON.stringify(cache), err => {
                if (err) {
                    console.error(err);
                    return;
                }
            });
            fs.writeFile('files/cache/README.md', "# The file(s) in this directory are for internal use. Use the files in the root directory instead :)", err => {
                if (err) {
                    console.error(err);
                    return;
                }
            });
        });
    });
}

function loadCache()
{
    return new Promise(resolve => {
        https.get('https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/cache/eventsCache.json', res =>
        {
            let data = [];

            res.on('data', chunk => {
                data.push(chunk);
            });

            res.on('end', () => {
                try {
                    var parse = JSON.parse(Buffer.concat(data).toString());
                    resolve(parse);
                }
                catch (e) {
                    resolve([]);
                }
            });
        }).on('error', err => {
            console.log('Error: ', err.message);
            resolve([]);
        });
    });
}

function getData(offset)
{
    return new Promise(resolve => {
        JSDOM.fromURL("https://www.leekduck.com/events/", {
        })
        .then((dom) => {

            var allEvents = [];

            ["current","upcoming"].forEach(category => {
                
                var events = dom.window.document.querySelectorAll(`div.events-list.${category}-events a.event-item-link`);

                events.forEach (e =>
                {
                    var heading = e.querySelector(":scope > .event-item-wrapper > p").innerHTML;
                    var name = e.querySelector(":scope > .event-item-wrapper > .event-item > .event-text-container > .event-text > h2").innerHTML;
                    var image = e.querySelector(":scope > .event-item-wrapper > .event-item > .event-img-wrapper > img").src;
                    var link = e.href;
                    var eventID = link.substring(32, link.length - 1)
                    
                    var eventItemWrapper = e.querySelector(":scope > .event-item-wrapper");
                    eventItemWrapper.classList
                    var eventType = (eventItemWrapper.classList + "").replace("event-item-wrapper ", "");
                    eventType = eventType.replace("é", "e");

                    var revealCountdownNode = e.querySelector(":scope > .event-item-wrapper > div:not(.event-item)");
                    var revealCountdown = "";
                    if (revealCountdownNode != null) revealCountdown = revealCountdownNode.dataset.revealCountdown; 
                    var reveal = new Date(0)
                    if (!/^\d+$/.test(revealCountdown))
                    {
                        reveal = Date.parse(moment(revealCountdown, 'MM/DD/YYYY HH:mm:ss').toISOString());
                    }
                    else
                    {
                        reveal.setUTCSeconds(parseInt(revealCountdown))
                    }
                    
                    var countdownNode = e.querySelector(":scope > .event-item-wrapper > .event-item > .event-text-container > .event-countdown-container > .event-countdown");
                    var timeRaw = timeRaw = countdownNode.dataset.countdown;
                    var countdownTo = countdownNode.dataset.countdownTo;
                    var isLocalTime = ['start', 'end'].includes(countdownTo) ? !/^\d+$/.test(timeRaw) : null;
                    var time = isLocalTime ? moment.utc(timeRaw, 'MM/DD/YYYY HH:mm:ss').toISOString() : moment.unix(parseInt(timeRaw) / 1000).toISOString();
                    var startTime = countdownTo === 'start' ? time : null;
                    var endTime = countdownTo === 'end' ? time : null;

                    
                    var start = Date.parse(startTime);
                    var end = Date.parse(endTime);

                    if (category == "current")
                    {
                        if ((startTime == null || start < Date.now()) && end > Date.now())
                        {
                            if (revealCountdown == null || reveal <= Date.now())
                            {
                                if (eventID == "pokemonspotlighthour2022-05-17")
                                {
                                    console.log("current ---")
                                    console.log(start)
                                    console.log(end);
                                }

                                allEvents.push({ "heading": heading, "name": name, "eventType": eventType, "eventID": eventID, "link": link, "image": image, "start": startTime, "end": endTime, "isLocalTime": isLocalTime });
                            }
                        }
                    }
                    else if (category == "upcoming")
                    {
                        if (start > Date.now())
                        {
                            if (eventID == "pokemonspotlighthour2022-05-17")
                            {
                                console.log("upcoming ---")
                                console.log(start)
                                console.log(end);

                                console.log((tzd.makeConstructor(offset * 60))())
                            }

                            allEvents.push({ "heading": heading, "name": name, "eventType": eventType, "eventID": eventID, "link": link, "image": image, "start": startTime, "end": endTime, "isLocalTime": isLocalTime });
                        }
                    }
                });
            });

            resolve(allEvents);
        });
    })
}

module.exports = { get }