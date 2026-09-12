const fsp = require('fs').promises;
const { JSDOM } = require('jsdom');
const config = require('../config');
const { fetchJSON } = require('../utils');

async function get() {
    try {
        var eventDates = [];

        try {
            var feedJson = await fetchJSON("https://leekduck.com/feeds/events.json");

            for (var i = 0; i < feedJson.length; i++) {
                var id = feedJson[i].eventID;
                var start = feedJson[i].start;
                var end = feedJson[i].end;

                eventDates[id] = { "start": start, "end": end };
            }
        } catch (error) {
            console.error(error.message);
        }

        const dom = await JSDOM.fromURL("https://leekduck.com/events/", {});

        var allEvents = [];

        ["current", "upcoming"].forEach(category => {

            var events = dom.window.document.querySelectorAll(`div.events-list.${category}-events a.event-item-link`);

            events.forEach(e => {
                var heading = e.querySelector(":scope > .event-item-wrapper > p").innerHTML;
                var name = e.querySelector(":scope > .event-item-wrapper > .event-item > .event-text-container > .event-text > h2").innerHTML;
                var image = e.querySelector(":scope > .event-item-wrapper > .event-item > .event-img-wrapper > img").src;
                if (image.includes("cdn-cgi")) {
                    image = "https://cdn.leekduck.com/assets/" + image.split("/assets/")[1];
                }
                var link = e.href;
                var eventID = link.split("/events/")[1];
                eventID = eventID.substring(0, eventID.length - 1);

                if (!(eventID in eventDates)) {
                    console.warn(`WARNING: Event '${eventID}' not present in events feed. Date values will be null.`);
                }

                var eventItemWrapper = e.querySelector(":scope > .event-item-wrapper");
                var eventType = (eventItemWrapper.classList + "").replace("event-item-wrapper ", "").replace(" skeleton-loading", "");
                eventType = eventType.replace("é", "e");

                var start = eventDates[eventID]?.start || null;
                var end = eventDates[eventID]?.end || null;

                // Pass Leek Duck's timestamps through verbatim. They are valid ISO 8601 and the
                // offset is part of the meaning: go-battle-league carries -0700, city events carry
                // their host offset, and raid events are bare wall-clock. Converting through
                // new Date()/toISOString() here turned bare wall-clock times into the CI runner's
                // local zone read as UTC, which is how the Mega Finale window shifted on event day.

                allEvents.push({ "eventID": eventID, "name": name, "eventType": eventType, "heading": heading, "link": link, "image": image, "start": start, "end": end, "extraData": null });
            });
        });

        for (var i = 0; i < allEvents.length; i++) {
            var event = allEvents[i];
            if (allEvents.filter(e => e.eventID == event.eventID).length > 1) {
                var allWithID = allEvents.filter(_e => _e.eventID == event.eventID);

                if (allWithID[0].start) {
                    event.start = allWithID[0].start;
                    event.end = allWithID[1].end;
                }
                else {
                    event.start = allWithID[1].start;
                    event.end = allWithID[0].end;
                }

                allEvents = allEvents.filter(e => e.eventID != event.eventID);
                allEvents.splice(i, 0, event);

                i--;
            }
        }

        await fsp.writeFile('files/events.json', JSON.stringify(allEvents, null, 4));
        await fsp.writeFile('files/events.min.json', JSON.stringify(allEvents));
    } catch (err) {
        console.error(err);
        try {
            const fallback = await fetchJSON(`${config.fallbackBaseUrl}/events.min.json`);
            await fsp.writeFile('files/events.json', JSON.stringify(fallback, null, 4));
            await fsp.writeFile('files/events.min.json', JSON.stringify(fallback));
        } catch (fallbackErr) {
            console.error(fallbackErr.message);
        }
    }
}

module.exports = { get }
