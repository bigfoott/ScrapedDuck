# Endpoints

- Formatted: [`GET /data/raids.json`](https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/raids.json)
- Minimized: [`GET /data/raids.min.json`](https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/raids.min.json)

# Example Raid Object

```
{
    "name": "Alolan Marowak",
    "tier": "Tier 3",
    "canBeShiny": true,
    "types": [
        {
            "name": "fire",
            "image": "https://www.leekduck.com/assets/img/types/fire.png"
        },
        {
            "name": "ghost",
            "image": "https://www.leekduck.com/assets/img/types/ghost.png"
        }
    ],
    "combatPower": {
        "normal": {
            "min": 988,
            "max": 1048
        },
        "boosted": {
            "min": 1235,
            "max": 1311
        }
    },
    "boostedWeather": [
        {
            "name": "sunnyclear",
            "image": "https://www.leekduck.com/assets/img/weather/sunny.png"
        },
        {
            "name": "foggy",
            "image": "https://www.leekduck.com/assets/img/weather/foggy.png"
        }
    ],
    "image": "https://www.leekduck.com/assets/img/pokemon_icons/pokemon_icon_105_61.png"
}
```
# Fields

| Field                | Type          | Description
|--------------------- |-------------- |---------------------
| **`name`**           | `string`      | The name of the Pokemon.
| **`tier`**           | `string`      | The raid tier of the Pokemon.<br />Can be `Tier 1`, `Tier 3`, `Tier 5`, `Mega` 
| **`canBeShiny`**     | `boolean`     | Whether or not the Pokemon can be shiny.
| **`types`**          | `Type[]`      | The type(s) of the Pokemon. See [Type](#Type).
| **`combatPower`**    | `CombatPower` | The combat power range the Pokemon can be caught with. See [CombatPower](#CombatPower).
| **`boostedWeather`** | `Weather[]`   | The type(s) of weather that boost the Pokemon's combat power. See [Weather](#Weather).
| **`image`**          | `string`      | The image of the Pokemon.*

# Other Objects

## Type

### Example Object

```
{
    "name": "fire",
    "image": "https://www.leekduck.com/assets/img/types/fire.png"
}
```

### Fields

| Field       | Type     | Description
|------------ |--------- |---------------------
| **`name`**  | `string` | The name of the type
| **`image`** | `string` | The image of the type. 

## CombatPower

### Example Object

```
{
    "normal": {
        "min": 988,
        "max": 1048
    },
    "boosted": {
        "min": 1235,
        "max": 1311
    }
}
```

### Fields

| Field             | Type  | Description
|------------------ |------ |---------------------
| **`normal.min`**  | `int` | The minimum normal combat power of the Pokemon.
| **`normal.max`**  | `int` | The maximum normal combat power of the Pokemon.
| **`boosted.min`** | `int` | The minimum boosted combat power of the Pokemon.
| **`boosted.max`** | `int` | The maximum boosted combat power of the Pokemon.

## Weather

### Example Object

```
{
    "name": "foggy",
    "image": "https://www.leekduck.com/assets/img/weather/foggy.png"
}
```

### Fields

| Field       | Type     | Description
|------------ |--------- |---------------------
| **`name`**  | `string` | The name of the weather type.
| **`image`** | `string` | The image of the weather type.
