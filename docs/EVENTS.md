# Endpoints

- Formatted: [`GET /data/events.json`](https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/events.json)
- Minimized: [`GET /data/events.min.json`](https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/events.min.json)

# Example Event Object

```json
{
    "eventID": "legendaryraidhour20220601",
    "name": "Kyogre Raid Hour",
    "eventType": "raid-hour",
    "heading": "Raid Hour",
    "link": "https://www.leekduck.com/events/legendaryraidhour20220601/",
    "image": "https://www.leekduck.com/assets/img/events/raidhour.jpg",
    "start": "2022-06-01T18:00:00.000",
    "end": "2022-06-01T19:00:00.000",
    "extraData": null
}
```
# Fields

| Field           | Type     | Description
|---------------- |--------- |---------------------
| **`eventID`**   | `string` | The ID of the event. Also the last part of the event page's URL.
| **`name`**      | `string` | The name of the event.
| **`eventType`** | `string` | The type of the event. See [List of Event Types](#list-of-event-types)
| **`heading`**   | `string` | The heading for the event. Based on the event's type.
| **`link`**      | `string` | The URL to the event's page.
| **`image`**     | `string` | The header/thumbnail image for the event.
| **`start`**     | `string` | The start date of the event (Can be null). See [Note for Start/End dates](#note-for-startend-dates)
| **`end`**       | `string` | The end date of the event (Can be null). See [Note for Start/End dates](#note-for-startend-dates)
| **`extraData`** | dynamic  | This is a spot for extra data that is unique to the event type. See [Extra Data](#extra-data)

## List of Event Types

| Events/Misc.               | Research                  | Raids/Battle         | GO Rocket
|--------------------------- |-------------------------- |--------------------- |------------------------------
| `community-day`          | `research`              | `raid-day`         | `go-rocket-takeover`
| `event`                  | `timed-research`        | `raid-battles`     | `team-go-rocket`
| `live-event`             | `limited-research`      | `raid-hour`        | `giovanni-special-research`
| `pokemon-go-fest`        | `research-breakthrough` | `raid-weekend`
| `global-challenge`       | `special-research`      | `go-battle-league`
| `safari-zone`
| `ticketed-event`
| `location-specific`
| `bonus-hour`
| `pokemon-spotlight-hour`
| `potential-ultra-unlock`
| `update`

If you want to figure out what type of event a specific event on [LeekDuck.com/events](https://www.leekduck.com/events/) is, use your browser's dev tools to determine what class is setting the background color of that event. The class name is the same as the event type (except for `pokemon-go-fest` and `pokemon-spotlight-hour`, where the accented "é" is replaced with "e").

## Note for Start/End dates

The `start` and `end` fields are DateTime objects encoded in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601).

Most events in Pokemon GO occur based around a user's local timezone. However, there are also some events that happen at the same time globally.

If an event starts/ends at the same time globally, the `start` and `end` fields will have strings ending with "Z", signifying the DateTime is in UTC. Otherwise, the DateTime displayed is based on the user's local timezone.

Depending on the use case, many parsers (ex: Javascript's `Date.parse()`) will handle this automatically.

## Extra Data

For some event types, it would be useful to have more information that what's provided in the title and heading of an event.

As of now, the following event types have extra data:

### Pokémon Spotlight Hours

Example:

```json
"extraData": {
    "spotlight": {
        "name": "Mantine",
        "canBeShiny": true,
        "image": "https://www.leekduck.com/assets/img/pokemon_icons/pokemon_icon_226_00.png",
        "bonus": "2× Transfer Candy"
    }
}
```

### Research Breakthroughs

Example:

```json
"extraData": {
    "breakthrough": {
        "name": "Klink",
        "canBeShiny": true,
        "image": "https://www.leekduck.com/assets/img/pokemon_icons/pokemon_icon_599_00.png"
    }
}
```

### Community Days

Example:

```json
"extraData": {
    "communityday": {
        "spawns": [
            {
                "name": "Deino",
                "image": "https://www.leekduck.com/assets/img/pokemon_icons/pokemon_icon_633_00.png"
            }
        ],
        "bonuses": [
            {
                "text": "Increased Spawns",
                "image": "https://www.leekduck.com/assets/img/events/bonuses/wildgrass.png"
            },
            {
                "text": "1/4 Egg Hatch Distance",
                "image": "https://www.leekduck.com/assets/img/events/bonuses/eggdistance.png"
            },
            ...
        ],
        "shinies": [
            {
                "name": "Deino",
                "image": "https://www.leekduck.com/assets/img/pokemon_icons/pokemon_icon_633_00_shiny.png"
            },
            {
                "name": "Zweilous",
                "image": "https://www.leekduck.com/assets/img/pokemon_icons/pokemon_icon_634_00_shiny.png"
            },
            ...
        ],
        "specialresearch": [
            {
                "name": "Field Notes: Deino (1/4)",
                "step": 1,
                "tasks": [
                    {
                        "text": "Earn 3 hearts with your buddy",
                        "reward": {
                            "text": "Poké Ball <span>×15</span>",
                            "image": "https://www.leekduck.com/assets/img/items/Pok%C3%A9%20Ball.png"
                        }
                    },
                    {
                        "text": "Catch 3 Deino",
                        "reward": {
                            "text": "Hyper Potion <span>×3</span>",
                            "image": "https://www.leekduck.com/assets/img/items/Hyper%20Potion.png"
                        }
                    },
                    ...
                ],
                "rewards": [
                    {
                        "text": "×2000",
                        "image": "https://www.leekduck.com/assets/img/items/Stardust.png"
                    },
                    {
                        "text": "Deino",
                        "image": "https://www.leekduck.com/assets/img/pokemon_icons_crop/pokemon_icon_633_00.png"
                    },
                    ...
                ]
            },
            ...
        ]
    }
}
```
