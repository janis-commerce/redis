'use strict';

const RedisLib = require('@redis/client');

const Events = require('@janiscommerce/events');

const Settings = require('@janiscommerce/settings');

const SETTINGS_KEY = 'redis';

let cluster;

module.exports = class Redis {

	static get config() {

		if(!this._config)
			this._config = Settings.get(SETTINGS_KEY);

		return this._config;
	}

	static async connect() {

		if(cluster)
			return cluster;

		const urls = [];

		if(this.config?.host)
			urls.push(this.config.host);
		else if(process.env.REDIS_WRITE_URL) {

			urls.push(process.env.REDIS_WRITE_URL);

			if(process.env.REDIS_READ_URL)
				urls.push(process.env.REDIS_READ_URL);
		}

		if(!urls.length)
			return;

		cluster = RedisLib.createCluster({
			rootNodes: urls.map(url => ({ url })),
			useReplicas: true
		});

		await cluster.connect();

		Events.on('janiscommerce.ended', this.closeConnection);

		return cluster;
	}

	static async closeConnection() {

		if(cluster) {
			await cluster.quit();
			Redis.cleanCluster();
		}
	}

	static cleanCluster() {
		cluster = null;
	}
};
