# Endpoints

- Formatted: [`GET /data/events.json`](https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/events.json)
- Minimized: [`GET /data/events.min.json`](https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/events.min.json)

# Example Event Object

```
{
    "eventID": "season-of-go",
    "name": "Season of GO",
    "eventType": "event",
    "heading": "Event",
    "link": "https://www.leekduck.com/events/season-of-go/",
    "image": "https://www.leekduck.com/assets/img/events/season-of-go.jpg",
    "start": "2022-06-01T10:00:00.000",
    "end": "2022-09-01T10:00:00.000"
}
```
# Fields

| Field           | Type     | Description
|---------------- |--------- |---------------------
| **`eventID`**   | `string` | The ID of the event. Also the last part of the event page's URL.
| **`name`**      | `string` | The name of the event.
| **`eventType`** | `string` | The type of the event.
| **`heading`**   | `string` | The heading for the event. Based on the event's type.
| **`link`**      | `string` | The URL to the event's page.
| **`image`**     | `string` | The header/thumbnail image for the event.
| **`start`**     | `string` | The start date of the event.*
| **`end`**       | `string` | The end date of the event.*

## Note for Start/End dates

The `start` and `end` fields are DateTime objects encoded in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601).

Most events in Pokemon GO occur based around a user's local timezone. However, there are also some events that happen at the same time globally.

If an event starts/ends at the same time globally, the `start` and `end` fields will have strings ending with "Z", signifying the DateTime is in UTC. Otherwise, the DateTime displayed is based on the user's local timezone.

Depending on the use case, many parsers (ex: Javascript's `Date.parse()`) will handle this automatically.
