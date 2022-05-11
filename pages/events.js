const fs = require('fs');
const moment = require('moment');
const jsd = require('jsdom');
const { JSDOM } = jsd;

function getEvents()
{
    return new Promise(resolve => {
        JSDOM.fromURL("https://www.leekduck.com/events/")
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
                    var isLocaleTime = ['start', 'end'].includes(countdownTo) ? !/^\d+$/.test(timeRaw) : null;
                    var time = isLocaleTime ? moment(timeRaw, 'MM/DD/YYYY HH:mm:ss').toISOString() : moment.unix(parseInt(timeRaw) / 1000).toISOString();
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
                                allEvents.push({ "heading": heading, "name": name, "eventType": eventType, "eventID": eventID, "link": link, "image": image, "state": category, "start": start, "end": end });
                            }
                        }
                    }
                    else if (category == "upcoming")
                    {
                        if (start > Date.now())
                        {
                            allEvents.push({ "heading": heading, "name": name, "eventType": eventType, "eventID": eventID, "link": link, "image": image, "state": category, "start": start, "end": end });
                        }
                    }
                });
            });

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
        });
    })
}

module.exports = { getEvents }