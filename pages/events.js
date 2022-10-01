const fs = require('fs');
const moment = require('moment');
const jsd = require('jsdom');
const { JSDOM } = jsd;
const https = require('https');

function get()
{
    return new Promise(resolve => {
        JSDOM.fromURL("https://leekduck.com/events/", {
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
                    if (image.includes("cdn-cgi"))
                    {
                        image = "https://leekduck.com/assets/" + image.split("/assets/")[1];
                    }
                    var link = e.href;
                    var eventID = link.split("/events/")[1];
                    eventID = eventID.substring(0, eventID.length - 1);
                    
                    var eventItemWrapper = e.querySelector(":scope > .event-item-wrapper");
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

                    if (isLocalTime)
                    {
                        if (startTime) startTime = startTime.substr(0, startTime.length - 1);
                        if (endTime) endTime = endTime.substr(0, endTime.length - 1);
                    }

                    allEvents.push({ "eventID": eventID, "name": name, "eventType": eventType, "heading": heading, "link": link, "image": image, "start": startTime, "end": endTime, "extraData": null });
                });
            });

            for (var i = 0; i < allEvents.length; i++)
            {
                var event = allEvents[i];
                if (allEvents.filter(e => e.eventID == event.eventID).length > 1)
                {
                    var allWithID = allEvents.filter(_e => _e.eventID == event.eventID);

                    if (allWithID[0].start)
                    {
                        event.start = allWithID[0].start;
                        event.end = allWithID[1].end;
                    }
                    else
                    {
                        event.start = allWithID[1].start;
                        event.end = allWithID[0].end;
                    }

                    allEvents = allEvents.filter(e => e.eventID != event.eventID);
                    allEvents.splice(i, 0, event);

                    i--;
                }
            }

            fs.writeFile('files/events.json', JSON.stringify(allEvents, null, 4), err => {
                if (err) {
                    console.error(err);
                    return;
                }
            });
            fs.writeFile('files/events.min.json', JSON.stringify(allEvents), err => {
                if (err) {
                    console.error(err);
                    return;
                }
            });
        }).catch(_err =>
        {
            console.log(_err);
            https.get("https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/events.min.json", (res) =>
            {
                let body = "";
                res.on("data", (chunk) => { body += chunk; });
            
                res.on("end", () => {
                    try
                    {
                        let json = JSON.parse(body);

                        fs.writeFile('files/events.json', JSON.stringify(json, null, 4), err => {
                            if (err) {
                                console.error(err);
                                return;
                            }
                        });
                        fs.writeFile('files/events.min.json', JSON.stringify(json), err => {
                            if (err) {
                                console.error(err);
                                return;
                            }
                        });
                    }
                    catch (error)
                    {
                        console.error(error.message);
                    };
                });
            
            }).on("error", (error) => {
                console.error(error.message);
            });
        });
    })
}

module.exports = { get }