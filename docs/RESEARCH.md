# Endpoints

- Formatted: [`GET /data/research.json`](https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/research.json)
- Minimized: [`GET /data/research.min.json`](https://raw.githubusercontent.com/bigfoott/ScrapedDuck/data/research.min.json)

# Example Research Object

```json
{
    "text": "Catch 5 Pokémon",
    "type": "catch",
    "rewards": [
        {
            "name": "Misdreavus",
            "image": "https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon%20-%20256x256/pokemon_icon_200_00.png",
            "canBeShiny": true,
            "combatPower": {
                "min": 779,
                "max": 825
            }
        },
        {
            "name": "Shuppet",
            "image": "https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon%20-%20256x256/pokemon_icon_353_00.png",
            "canBeShiny": true,
            "combatPower": {
                "min": 401,
                "max": 436
            }
        },
        {
            "name": "Duskull",
            "image": "https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon%20-%20256x256/pokemon_icon_355_00.png",
            "canBeShiny": true,
            "combatPower": {
                "min": 273,
                "max": 302
            }
        }
    ]
}
```
# Fields

| Field         | Type     | Description
|-------------- |--------- |---------------------
| **`text`**    | `string` | The research task text.
| **`type`**    | `string` | The type of research.<br />Can be `catch`, `berry`, `battle`, `buddy`, `hatch`, `power`, `raid`, `throw`, `misc`
| **`rewards`** | `Reward` | The rewards for completing the research Task. See [Reward](#Reward)

# Other Objects

## Reward

### Example Object

```json
{
    "name": "Misdreavus",
    "image": "https://raw.githubusercontent.com/PokeMiners/pogo_assets/master/Images/Pokemon%20-%20256x256/pokemon_icon_200_00.png",
    "canBeShiny": true,
    "combatPower": {
        "min": 779,
        "max": 825
    }
}
```

### Fields

| Field                 | Type      | Description
|---------------------- |---------- |---------------------
| **`name`**            | `string`  | The name of the reward Pokemon.
| **`image`**           | `string`  | The image of the reward Pokemon.
| **`canBeShiny`**      | `boolean` | Whether or not the reward Pokemon can be shiny.
| **`combatPower.min`** | `int`     | The minimum combat power of the reward Pokemon.
| **`combatPower.max`** | `int`     | The maximum combat power of the reward Pokemon.
