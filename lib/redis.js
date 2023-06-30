'use strict';

const RedisLib = require('@redis/client');

const Events = require('@janiscommerce/events');

const Settings = require('@janiscommerce/settings');

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

			const host = process.env.REDIS_WRITE_URL || this.config?.host;

			if(!host)
				return;

			conn = RedisLib.createClient({ socket: { host } });
		}

		await conn.connect();

		Events.once('janiscommerce.ended', this.closeConnection);

		return conn;
	}

	static async closeConnection() {

		if(conn?.quit) {
			await conn.quit();
			Redis.cleanConn();
		}
	}

	static cleanConn() {
		conn = null;
	}
};
