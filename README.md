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

### Client configuration

#### Env Vars

If the env vars `REDIS_WRITE_URL` is set, will create a Redis connection

#### Settings

> :warning: **Deprecated** :warning:

This package uses [@janiscommerce/settings](https://www.npmjs.com/package/@janiscommerce/settings).

In `.janiscommercerc.json` file requires to have the configuration under the `redis`.
- The field `host` is required.

See an example below

```json
{
    "redis": {
        "host": "redis.example.host"
    }
}
```

### Cluster Mode

The env var `REDIS_CLUSTER_MODE` must be set with a truthy value.

Then, the env vars `REDIS_WRITE_URL` and `REDIS_READ_URL` will be used for creating a Redis cluster connection.

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

    const redisCluster = await Redis.connect();

    await redisCluster.set('product-123', 'blue-shirt');

    const value = await redisCluster.get('product-123');

    // expected value: blue-shirt

})();
```

> :information_source: For more examples see [redis](https://www.npmjs.com/package/redis)
