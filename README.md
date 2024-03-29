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

#### Config object parameter

_Since 2.3.0_

The `connect()` allows to receive an object with the `url`.

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

#### Env Vars

If the env vars `REDIS_WRITE_URL` and `REDIS_READ_URL` will be used for creating a Redis cluster connection.

#### Config object parameter

_Since 2.3.0_

The `connect()` allows to receive an object with the `url` as _String_ or _String Array_.

## API

### `connect(config = {})`

**async** | Connects the Redis server using settings.

#### :new: Parameters
- `config` the optional configuration.
    -  `config.url` optional url as _String_ for connecting the client of cluster. _Since 2.3.0_
    -  `config.url` optional url as _String Array_ for connecting. Exclusive for in cluster mode. _Since 2.3.0_
    -  :new: `config.maxRetries` optional _Number_ indicates the max amount of connection retries. (Default: `3`)
        -   When the max retries are reached the Client stops retrying and throws an [error](#errors)
        -   This **won't** close the cached connection, the cached connection will persist and won't retry to connect.
            -   If you need to set a limit of retries but retry when your process is executed again, then `try catch` the error and use [closeConnection](#closeconnection)
            -   If you don't want it to retry connection until your process is restarted, then don't need to close the connection.
    -   :new: `config.connectTimeout` optional _Number_ indicates the connection timeout in **miliseconds**. (Default: `5000`)

#### Return
* `client`: The Redis client when `host` is present in settings.
* `undefined`: When `host` is not present in settings.

Throw an `Error` if Redis Server fails.

### `closeConnection()`

**async** | Closes the active connection.

## Usage
```js

const Redis = require('@janiscommerce/redis');

(async () => {

    const redisCluster = await Redis.connect();

    await redisCluster.set('product-123', 'blue-shirt');

    const value = await redisCluster.get('product-123');

    // expected value: blue-shirt

})();

// Usage with custom max retries
(async () => {

    try {

        const redisCluster = await Redis.connect({
            connectTimeout: 1000,
            maxRetries: 1
        });

    }catch(err) {
        console.log(err.message);
        await Redis.closeConnection();
    }
})();
```

## Errors

The errors are informed with a `RedisError`.
This object has a code that can be useful for a debugging or error handling.
The codes are the following:

| Code | Description                        |
|------|----------------------------------- |
| 1    | Redis error                        |
| 2    | Max connection retries reached     |

> :information_source: For more examples see [redis](https://www.npmjs.com/package/redis)
