# Endpoints

- Formatted: [`GET /data/eggs.json`](https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/eggs.json)
- Minimized: [`GET /data/eggs.min.json`](https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/eggs.min.json)

# Example Egg Object

```
{
    "name": "Wailmer",
    "eggType": "2 km",
    "isAdventureSync": false,
    "image": "https://www.leekduck.com/assets/img/pokemon_icons/pokemon_icon_320_00.png",
    "canBeShiny": true,
    "combatPower": {
        "min": 779,
        "max": 838
    }
}
```
# Fields

| Field                 | Type      | Description
|---------------------- |---------- |---------------------
| **`name`**            | `string`  | The name of the hatched Pokemon.
| **`eggType`**         | `string`  | The type of the egg.<br />Can be `2 km`, `5 km`, `7 km`, `10 km`, `12 km`
| **`isAdventureSync`** | `boolean` | Whether or not the egg is obtained from Adventure Sync.
| **`image`**           | `string`  | The image of the hatched Pokemon.
| **`canBeShiny`**      | `boolean` | Whether or not the hatched Pokemon can be shiny.
| **`combatPower.min`** | `int`     | The minimum combat power of the hatched Pokemon.
| **`combatPower.max`** | `int`     | The maximum combat power of the hatched Pokemon.
