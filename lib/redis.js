'use strict';

const RedisLib = require('@redis/client');

const Events = require('@janiscommerce/events');

const Settings = require('@janiscommerce/settings');

const logger = require('lllog')();

const SETTINGS_KEY = 'redis';

let conn;

module.exports = class Redis {

	/**
	 * @deprecated
	 */
	static get config() {
		return Settings.get(SETTINGS_KEY); // internal cache already implemented by Settings package
	}

	static async connect() {

		if(conn)
			return conn;

		if(process.env.REDIS_CLUSTER_MODE) {

			const urls = [
				...[process.env.REDIS_WRITE_URL || false],
				...[process.env.REDIS_READ_URL || false]
			].filter(Boolean);

			if(!urls.length)
				return;

			conn = RedisLib.createCluster({
				rootNodes: urls.map(url => ({ url })),
				useReplicas: true
			});

		} else {

			const url = process.env.REDIS_WRITE_URL || this.config?.host;

			if(!url)
				return;

			conn = RedisLib.createClient({ url });
		}

		conn.on('error', err => logger.error(`Redis Client Error - ${err.message}`));

		await conn.connect();

		Events.once('janiscommerce.ended', this.closeConnection);

		return conn;
	}

	static async closeConnection() {

		if(conn?.quit)
			await conn.quit();

		Redis.cleanConn();
	}

	static cleanConn() {
		conn = null;
	}
};
