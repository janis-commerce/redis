# redis

[![Build Status](https://travis-ci.org/janis-commerce/redis.svg?branch=master)](https://travis-ci.org/janis-commerce/redis)
[![Coverage Status](https://coveralls.io/repos/github/janis-commerce/redis/badge.svg?branch=master)](https://coveralls.io/github/janis-commerce/redis?branch=master)

## Installation
```sh
npm install @janiscommerce/redis --save
```

## Configuration
This package uses [@janiscommerce/settings](https://www.npmjs.com/package/@janiscommerce/settings). 

In `.janiscommercerc.json` file could have the configuration, under `"redis"` key and `"host"` and / or `"port"` values (both optionals).

### Example
```json
{
    "redis": {
        "host": "redis.example.host",
        "port": 4040
    }
}
```

### Defaults
If there isn't any settings the `host` and `port` would be default:
- `host`: `localhost`
- `port`: `6379`

## API

### `set(entity, id, value)`

**async** | Saved or Updated a value.

* `entity`, type: `string`, main key.
* `id`, type: `string`, sub key.
* `value`, type: `object`, value to be saved.

Returns an `integer`:
* `1`, saved a new value
* `0`, updated a value

Throw an `RedisError` if Redis Server fails.

### `get(entity, id)`

**async** | Get a value.

* `entity`, type: `string`, main key.
* `id`, type: `string`, sub key.

Returns an `object`, with the value. If it not exists returns `null`.

Throw an `RedisError` if Redis Server fails.

### `del(entity, id)` 

**async** | Delete a value.

* `entity`, type: `string`, main key.
* `id`, type: `string`, sub key.

Returns an `integer`:
* `1`, delete de registry
* `0`, no delete

Throw an `RedisError` if Redis Server fails.

## Errors

The errors are informed with a `RedisError`.  
This object has a code that can be useful for a correct error handling.  
The codes are the following:  

| Code | Description                    |
|------|--------------------------------|
| 1    | Connections Errors             |
| 2    | Errors trying to Set           |
| 3    | Errors trying to Get           |
| 4    | Errors trying to Delete        |

## Usage
```js
const Redis = require('@janiscommerce/redis');

// SET - Insert

const itemProperties = {
   name: 'BatGun' ,
   description: 'not a gun'
}

let saved = await Redis.set('Batman', 'artifact-01', itemProperties);

console.log(saved); // 1

// SET - Update

itemProperties.description = 'deprecated gun';

saved = await Redis.set('Batman', 'artifact-01', itemProperties);

console.log(saved) // 0

// GET

let itemGetted = await Redis.get('Batman', 'artifact-01');

console.log(itemGetted); // { name: 'BatGun', description: 'deprecated gun' }

itemGetted = await Redis.get('Batman', 'artifact-02');

console.log(itemGetted); // null

// DELETE

let deleted = await Redis.del('Batman', 'artifact-01');

console.log(deleted); // 1

deleted = await Redis.del('Batman', 'artifact-01');

console.log(deleted); // 0

```

