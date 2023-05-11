'use strict';

const redis = require('@redis/client');

const Settings = require('@janiscommerce/settings');

const SETTINGS_KEY = 'redis';

module.exports = class Redis {

	static get config() {

		if(!this._config)
			this._config = Settings.get(SETTINGS_KEY);

		return this._config;
	}

	static async connect() {

		if(!this.config?.host)
			return;

		const client = redis.createClient({
			socket: {
				host: this.config.host,
				...this.config.port && { port: this.config.port },
				reconnectStrategy: retries => (retries >= 2 ? false : 1000)
			}
		});

		await client.connect();

		return client;
	}
};
