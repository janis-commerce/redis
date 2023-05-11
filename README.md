# redis

![Build Status](https://github.com/janis-commerce/redis/workflows/Build%20Status/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/janis-commerce/redis/badge.svg?branch=master)](https://coveralls.io/github/janis-commerce/redis?branch=master)
[![npm version](https://badge.fury.io/js/%40janiscommerce%2Fredis.svg)](https://www.npmjs.com/package/@janiscommerce/redis)

## Installation
```sh
npm install @janiscommerce/redis
```

## Breaking changes _Since 2.0.0_ :warning:
- Config `host` is required to connect. Connection will be ignored if not received.
- The package now works as a wrapper of [redis](https://www.npmjs.com/package/redis) package for using Redis commands
- Removed Api method `set()`, `get()`, `del()`, use [redis](https://www.npmjs.com/package/redis) commands instead
- Now _async_ method `connect()` must be executed before using any other command.

## Configuration
This package uses [@janiscommerce/settings](https://www.npmjs.com/package/@janiscommerce/settings).

In `.janiscommercerc.json` file requires to have the configuration under the `redis`.
- The field `host` is required.
- The field `port` is optional. Default value is set by [redis](https://www.npmjs.com/package/redis), See more information in [client-configuration](https://github.com/redis/node-redis/blob/master/docs/client-configuration.md)

### Example
```json
{
    "redis": {
        "host": "redis.example.host",
        "port": 4040
    }
}
```

## API

### `connect()`

**async** | Connects the Redis server using settings.

Returns:
* `client`: The Redis client when `host` is present in settings.
* `undefined`: When `host` is not present in settings.

Throw an `Error` if Redis Server fails.

## Usage
```js

const Redis = require('@janiscommerce/redis');

(async () => {

    const redisClient = await Redis.connect();

    await redisClient.set('product-123', 'blue-shirt');

    const value = await redisClient.get('product-123');

    // expected value: blue-shirt

})();
```

> :information_source: For more examples see [redis](https://www.npmjs.com/package/redis)
