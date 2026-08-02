# ScrapedDuck API Documentation

ScrapedDuck scrapes [LeekDuck.com](https://leekduck.com) for Pokemon GO data every 10 minutes and publishes JSON files to the [`data` branch](https://github.com/hector-hyrivera/ScrapedDuck/tree/data).

## Base URL

```
https://raw.githubusercontent.com/hector-hyrivera/ScrapedDuck/data
```

All endpoints are static JSON files served from this base. Both pretty-printed and minified versions are available for each endpoint.

---

## Endpoints

| Endpoint | Description | Files |
|----------|-------------|-------|
| [Events](#events) | Current and upcoming Pokemon GO events with detailed extra data | `events.json`, `events.min.json` |
| [Raids](#raids) | Current raid bosses with CP ranges, types, and weather boosts | `raids.json`, `raids.min.json` |
| [Research](#research) | Field research tasks, rewards, and Research Breakthrough | `research.json`, `research.min.json` |
| [Eggs](#eggs) | Egg hatch pool with rarity, CP ranges, and regional status | `eggs.json`, `eggs.min.json` |
| [Rocket Lineups](#rocket-lineups) | Team GO Rocket grunt and leader lineups | `rocketLineups.json`, `rocketLineups.min.json` |
| [Promo Codes](#promo-codes) | Active Pokemon GO promo codes with redemption links | `promoCodes.json`, `promoCodes.min.json` |
| [Calendars](#calendars) | iCal feeds for events, filterable by event type | `calendars/*.ics` |

---

## Events

**URL:** `{base}/events.json` or `{base}/events.min.json`

Returns an array of current and upcoming Pokemon GO events. Each event includes dates from the LeekDuck events feed, and detailed extra data scraped from individual event pages.

### Event Object

```json
{
  "eventID": "go-battle-league-interlude-season",
  "name": "GO Battle League: Interlude Season",
  "eventType": "go-battle-league",
  "heading": "GO Battle League",
  "link": "https://leekduck.com/events/go-battle-league-interlude-season/",
  "image": "https://cdn.leekduck.com/assets/img/events/...",
  "start": "2025-03-01T21:00:00.000Z",
  "end": "2025-06-01T21:00:00.000Z",
  "extraData": { ... }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `eventID` | `string` | Unique identifier derived from the event URL slug |
| `name` | `string` | Display name of the event |
| `eventType` | `string` | Event category (see [Event Types](#event-types)) |
| `heading` | `string` | Category heading (e.g., "Community Day", "Raid Battles") |
| `link` | `string` | Full URL to the event page on LeekDuck |
| `image` | `string` | Event banner image URL |
| `start` | `string\|null` | ISO 8601 start timestamp, or `null` if not in the feed |
| `end` | `string\|null` | ISO 8601 end timestamp, or `null` if not in the feed |
| `extraData` | `object\|null` | Detailed data scraped from the event page (see below) |

### Event Types

| `eventType` value | Description | Extra Data Key |
|-------------------|-------------|----------------|
| `community-day` | Community Day events | `communityday` |
| `pokemon-spotlight-hour` | Weekly Spotlight Hour | `spotlight` |
| `raid-battles` | Raid boss rotations | `raidbattles` |
| `raid-hour` | Weekly Raid Hour | `raidhour` |
| `research-breakthrough` | Monthly Research Breakthrough | `breakthrough` |
| `research` | Research event (may contain promo codes) | `promocodes` |
| `go-battle-league` | GO Battle League seasons | `gobattleleague` |
| `max-battles` | Max Battle events | `maxbattles` |
| `max-monday` | Max Monday events | `maxbattles` |
| Other values | Various event types (e.g., `event`, `pokemon-go-fest`) | — |

### Extra Data

The `extraData` object is populated by detailed scraping of each event's page. It always contains a `generic` block, plus an event-type-specific block when applicable.

#### `extraData.generic`

Present for all events.

```json
{
  "hasSpawns": true,
  "hasFieldResearchTasks": false,
  "description": "Explore the wild with featured Pokemon..."
}
```

| Field | Type | Description |
|-------|------|-------------|
| `hasSpawns` | `boolean` | Whether the event page lists specific wild spawns |
| `hasFieldResearchTasks` | `boolean` | Whether the event page lists field research tasks |
| `description` | `string` | Event description text from the page (may be empty) |

#### `extraData.breakthrough`

Present for `research-breakthrough` events.

```json
{
  "name": "Galarian Mr. Mime",
  "canBeShiny": false,
  "image": "https://cdn.leekduck.com/assets/img/pokemon/...",
  "list": [
    {
      "name": "Galarian Mr. Mime",
      "canBeShiny": false,
      "image": "https://cdn.leekduck.com/assets/img/pokemon/..."
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Featured breakthrough Pokemon name |
| `canBeShiny` | `boolean` | Whether the featured Pokemon can be shiny |
| `image` | `string` | Featured Pokemon image URL |
| `list` | `array` | All possible breakthrough reward Pokemon |

#### `extraData.spotlight`

Present for `pokemon-spotlight-hour` events.

```json
{
  "name": "Pikachu",
  "canBeShiny": true,
  "image": "https://cdn.leekduck.com/assets/img/pokemon/...",
  "bonus": "2x catch Stardust",
  "list": [
    {
      "name": "Pikachu",
      "canBeShiny": true,
      "image": "..."
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Spotlight Pokemon name |
| `canBeShiny` | `boolean` | Whether the Pokemon can be shiny |
| `image` | `string` | Pokemon image URL |
| `bonus` | `string` | Active bonus during Spotlight Hour (e.g., "2x catch Stardust") |
| `list` | `array` | Pokemon in the evolution family |

#### `extraData.communityday`

Present for `community-day` events.

```json
{
  "spawns": [
    { "name": "Bulbasaur", "image": "..." }
  ],
  "bonuses": [
    { "text": "3x catch XP", "image": "..." }
  ],
  "bonusDisclaimers": ["*Bonus applies during event hours only"],
  "shinies": [
    { "name": "Bulbasaur", "image": "..." }
  ],
  "specialresearch": [
    {
      "name": "Bulbasaur Community Day",
      "step": 1,
      "tasks": [
        {
          "text": "Catch 5 Bulbasaur",
          "reward": { "text": "10 Poke Balls", "image": "..." }
        }
      ],
      "rewards": [
        { "text": "Bulbasaur encounter", "image": "..." }
      ]
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `spawns` | `array` | Featured wild spawns (`name`, `image`) |
| `bonuses` | `array` | Active bonuses (`text`, `image`) |
| `bonusDisclaimers` | `array` | Footnotes for bonus conditions |
| `shinies` | `array` | Shiny-eligible Pokemon family (`name`, `image`) |
| `specialresearch` | `array` | Special Research story steps (see below) |

**Special Research Step:**

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Step name |
| `step` | `number` | Step number (1-indexed) |
| `tasks` | `array` | Tasks to complete, each with `text` and `reward` (`text`, `image`) |
| `rewards` | `array` | Step completion rewards (`text`, `image`) |

#### `extraData.raidbattles`

Present for `raid-battles` events.

```json
{
  "bosses": [
    { "name": "Mewtwo", "image": "...", "canBeShiny": true }
  ],
  "shinies": [
    { "name": "Mewtwo", "image": "..." }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `bosses` | `array` | Event raid bosses (`name`, `image`, `canBeShiny`) |
| `shinies` | `array` | Shiny-available Pokemon (`name`, `image`) |

#### `extraData.raidhour`

Present for `raid-hour` events.

```json
{
  "pokemon": [
    { "name": "Dialga", "image": "...", "canBeShiny": true }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `pokemon` | `array` | Featured raid hour Pokemon (`name`, `image`, `canBeShiny`) |

#### `extraData.maxbattles`

Present for `max-battles` and `max-monday` events.

```json
{
  "pokemon": [
    { "name": "Gigantamax Charizard", "image": "...", "canBeShiny": false }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `pokemon` | `array` | Featured Dynamax/Gigantamax Pokemon (`name`, `image`, `canBeShiny`) |

#### `extraData.gobattleleague`

Present for `go-battle-league` events.

```json
{
  "description": "Season 20 of GO Battle League...",
  "pokemon": [
    { "name": "Pikachu Libre", "image": "...", "canBeShiny": false }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `description` | `string` | Season/event description |
| `pokemon` | `array` | Featured reward Pokemon (`name`, `image`, `canBeShiny`) |

#### `extraData.promocodes`

Present for `research` events that contain promo code links.

```json
["PROMOCODE1", "PROMOCODE2"]
```

An array of promo code strings extracted from event page redemption links.

---

## Raids

**URL:** `{base}/raids.json` or `{base}/raids.min.json`

Returns an array of current raid bosses.

### Raid Boss Object

```json
{
  "name": "Mewtwo",
  "tier": "5-Star Raids",
  "canBeShiny": true,
  "types": [
    { "name": "psychic", "image": "https://..." }
  ],
  "combatPower": {
    "normal": { "min": 2294, "max": 2387 },
    "boosted": { "min": 2868, "max": 2984 }
  },
  "boostedWeather": [
    { "name": "windy", "image": "https://..." }
  ],
  "image": "https://cdn.leekduck.com/assets/img/pokemon/..."
}
```

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Pokemon name |
| `tier` | `string` | Raid tier (e.g., "1-Star Raids", "3-Star Raids", "5-Star Raids", "Mega Raids") |
| `canBeShiny` | `boolean` | Whether the boss can be shiny |
| `types` | `array` | Pokemon types, each with `name` (lowercase) and `image` |
| `combatPower.normal` | `object` | CP range at level 20 (`min`, `max`; `-1` if unknown) |
| `combatPower.boosted` | `object` | CP range at level 25 weather boost (`min`, `max`; `-1` if unknown) |
| `boostedWeather` | `array` | Weather conditions that boost this boss (`name`, `image`) |
| `image` | `string` | Pokemon image URL |

---

## Research

**URL:** `{base}/research.json` or `{base}/research.min.json`

Returns an object containing the current Research Breakthrough and all field research tasks with rewards.

### Research Object

```json
{
  "breakthrough": {
    "name": "Galarian Mr. Mime",
    "image": "https://...",
    "canBeShiny": false
  },
  "tasks": [
    {
      "text": "Catch 5 Pokemon",
      "type": "catch",
      "rewards": [ ... ]
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `breakthrough` | `object\|null` | Current Research Breakthrough Pokemon, or `null` if not found |
| `breakthrough.name` | `string` | Pokemon name |
| `breakthrough.image` | `string` | Pokemon image URL |
| `breakthrough.canBeShiny` | `boolean` | Whether it can be shiny |
| `tasks` | `array` | Field research tasks (see below) |

### Task Object

| Field | Type | Description |
|-------|------|-------------|
| `text` | `string` | Task description (e.g., "Catch 5 Pokemon") |
| `type` | `string` | Task category: `event`, `catch`, `throw`, `battle`, `explore`, `training`, `rocket`, `buddy`, `ar`, `sponsored` |
| `rewards` | `array` | Possible rewards for completing the task |

### Reward Object (Encounter)

```json
{
  "type": "encounter",
  "name": "Chansey",
  "image": "https://...",
  "canBeShiny": true,
  "combatPower": { "min": 717, "max": 763 }
}
```

### Reward Object (Item)

```json
{
  "type": "stardust",
  "name": "200 Stardust",
  "image": "https://...",
  "quantity": "200"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `type` | `string` | `"encounter"` for Pokemon, or the `data-rewardType` value (e.g., `"stardust"`, `"item"`) |
| `name` | `string` | Reward name |
| `image` | `string` | Reward image URL |
| `canBeShiny` | `boolean` | *(encounter only)* Whether the Pokemon can be shiny |
| `combatPower` | `object` | *(encounter only)* CP range (`min`, `max`) |
| `quantity` | `string` | *(item only)* Quantity extracted from name (e.g., `"200"`) |

---

## Eggs

**URL:** `{base}/eggs.json` or `{base}/eggs.min.json`

Returns an array of Pokemon available from eggs.

### Egg Pokemon Object

```json
{
  "name": "Riolu",
  "eggType": "10km",
  "isAdventureSync": false,
  "image": "https://...",
  "canBeShiny": true,
  "combatPower": { "min": 523, "max": 572 },
  "isRegional": false,
  "isGiftExchange": false,
  "rarity": 4
}
```

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Pokemon name |
| `eggType` | `string` | Egg distance (e.g., `"2km"`, `"5km"`, `"7km"`, `"10km"`, `"12km"`) |
| `isAdventureSync` | `boolean` | Whether the egg is from Adventure Sync rewards |
| `image` | `string` | Pokemon image URL |
| `canBeShiny` | `boolean` | Whether the Pokemon can be shiny |
| `combatPower.min` | `number` | Minimum CP at hatch |
| `combatPower.max` | `number` | Maximum CP at hatch |
| `isRegional` | `boolean` | Whether the Pokemon is a regional exclusive |
| `isGiftExchange` | `boolean` | Whether the egg is from Route Gifts |
| `rarity` | `number` | Rarity tier (0-5, based on number of egg icons displayed) |

---

## Rocket Lineups

**URL:** `{base}/rocketLineups.json` or `{base}/rocketLineups.min.json`

Returns an array of Team GO Rocket grunt and leader lineups.

### Lineup Object

```json
{
  "name": "Sierra",
  "title": "Team GO Rocket Leader",
  "type": "dark",
  "firstPokemon": [ ... ],
  "secondPokemon": [ ... ],
  "thirdPokemon": [ ... ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Grunt/Leader name |
| `title` | `string` | Title (e.g., "Team GO Rocket Leader", "Team GO Rocket Grunt") |
| `type` | `string` | Lineup type derived from icon (lowercase) |
| `firstPokemon` | `array` | Possible Pokemon in battle slot 1 |
| `secondPokemon` | `array` | Possible Pokemon in battle slot 2 |
| `thirdPokemon` | `array` | Possible Pokemon in battle slot 3 |

### Slot Pokemon Object

```json
{
  "name": "Beldum",
  "image": "https://...",
  "types": ["steel", "psychic"],
  "isEncounter": true,
  "canBeShiny": false
}
```

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | Pokemon name |
| `image` | `string` | Pokemon image URL |
| `types` | `array` | Pokemon types (lowercase strings) |
| `isEncounter` | `boolean` | Whether defeating this slot yields a catch encounter |
| `canBeShiny` | `boolean` | Whether the Shadow Pokemon can be shiny |

---

## Promo Codes

**URL:** `{base}/promoCodes.json` or `{base}/promoCodes.min.json`

Returns an array of active Pokemon GO promo codes.

### Promo Code Object

```json
{
  "code": "SYJMGFM3SWRLQ",
  "rewards": "10 Poke Balls",
  "link": "https://store.pokemongo.com/offer-redemption?passcode=SYJMGFM3SWRLQ"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `code` | `string` | The promo code string |
| `rewards` | `string` | Description of what the code redeems (may be empty if not found on page) |
| `link` | `string` | Direct redemption URL |

---

## Calendars

**URL:** `{base}/calendars/{type}.ics`

iCalendar feeds for subscribing to Pokemon GO events in calendar apps.

| Calendar | URL |
|----------|-----|
| All Events | `{base}/calendars/all.ics` |
| By Event Type | `{base}/calendars/{eventType}.ics` |

Events with missing dates (`start` or `end` is `null`) are excluded from calendar feeds.

Each calendar event includes:
- Event title in `{heading} - {name}` format
- Link to the LeekDuck event page
- Event banner image
- Google Calendar metadata for rich display

---

## Rate Limits

These are static files served from GitHub's raw content CDN. GitHub applies standard rate limits for raw file access. For high-traffic applications, consider caching responses locally.

---

## Breaking Changes from Previous Version

### Research Endpoint

The research endpoint output has changed from a flat array to an object:

**Before:**
```json
[
  { "text": "Catch 5 Pokemon", "type": "catch", "rewards": [...] }
]
```

**After:**
```json
{
  "breakthrough": { "name": "...", "image": "...", "canBeShiny": true },
  "tasks": [
    { "text": "Catch 5 Pokemon", "type": "catch", "rewards": [...] }
  ]
}
```

### Research Reward Objects

Rewards now include a `type` field and item rewards are captured:

**Before:** Only encounter rewards, no `type` field.

**After:** All rewards included with explicit `type` field (`"encounter"` or item type like `"stardust"`).

### Event Extra Data

New fields added:
- `extraData.generic.description` — event description text
- `extraData.raidhour` — raid hour featured Pokemon
- `extraData.maxbattles` — max battle featured Pokemon
- `extraData.gobattleleague` — GO Battle League season data

### New Endpoint

- `promoCodes.json` — standalone promo codes endpoint (previously codes were only extracted from individual event pages)
