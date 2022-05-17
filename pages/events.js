const fs = require('fs');
const moment = require('moment');
const jsd = require('jsdom');
const { JSDOM } = jsd;
const tzd = require('timezoned-date');

async function get()
{
    var first = [], last = [];

    getData(14).then((allEvents) => {
        first = allEvents;

        getData(-9).then((allEvents2) => {
            last = allEvents2;

            var events = [];

            first.forEach(eventF =>
            {
                last.forEach(eventL =>
                {
                    if (eventF.eventID == eventL.eventID)
                    {
                        var event = eventF;
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
                        delete event.isLocalTime;

                        events.push(event);
                    }
                });
            });

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
        });
    });
}

function getData(offset)
{
    return new Promise(resolve => {
        JSDOM.fromURL("https://www.leekduck.com/events/", {
            beforeParse(window) {
                window.Date = tzd.makeConstructor(offset * 60);
            }
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
                    var time = isLocalTime ? moment(timeRaw, 'MM/DD/YYYY HH:mm:ss').toISOString() : moment.unix(parseInt(timeRaw) / 1000).toISOString();
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
                                allEvents.push({ "heading": heading, "name": name, "eventType": eventType, "eventID": eventID, "link": link, "image": image, "start": startTime, "end": endTime, "isLocalTime": isLocalTime });
                            }
                        }
                    }
                    else if (category == "upcoming")
                    {
                        if (start > Date.now())
                        {
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