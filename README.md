# ScrapedDuck

ScrapedDuck routinely scrapes [LeekDuck.com](https://leekduck.com) (with permission) for Pokemon GO data and pushes said data to [a branch](https://github.com/bigfoott/ScrapedDuck/tree/data) on this repository for use by other external applications. If you plan to use this in your Pokemon GO related projects, please follow [the guidelines below](#for-developers).

To follow development progress for this tool, check out [the Trello board for PoGOEvents/ScrapedDuck](https://trello.com/b/32UjZbdu/pogoevents-scrapedduck).

## For Developers

Developers, feel free to use this data for whatever project's you like! As long as your use of this data follows the terms below, you should be good!

- Applications of the APIs cannot be hidden behind a paywall.
- Applications of the APIs cannot be monetized with advertisements.
- Give credit to ScrapedDuck and [LeekDuck.com](https://leekduck.com).

I just want to emphasize again to credit **[LeekDuck.com](https://leekduck.com)**, as the data itself is provided by them.

## Endpoints

### Events

[**Documentation**](/docs/EVENTS.md)

- Formatted: [`GET /data/events.json`](https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/events.json)
- Minimized: [`GET /data/events.min.json`](https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/events.min.json)

### Raids

[**Documentation**](/docs/RAIDS.md)

- Formatted: [`GET /data/raids.json`](https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/raids.json)
- Minimized: [`GET /data/raids.min.json`](https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/raids.min.json)

### Research

[**Documentation**](/docs/RESEARCH.md)

- Formatted: [`GET /data/research.json`](https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/research.json)
- Minimized: [`GET /data/research.min.json`](https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/research.min.json)

### Eggs

[**Documentation**](/docs/EGGS.md)

- Formatted: [`GET /data/eggs.json`](https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/eggs.json)
- Minimized: [`GET /data/eggs.min.json`](https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/eggs.min.json)
