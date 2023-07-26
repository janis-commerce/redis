'use strict';

const RedisLib = require('@redis/client');

const Events = require('@janiscommerce/events');

const Settings = require('@janiscommerce/settings');

const logger = require('lllog')();

const SETTINGS_KEY = 'redis';

/** @type {import('@redis/client').RedisClientType | import('@redis/client').RedisClusterType} */
let conn;

module.exports = class Redis {

	/**
	 * @deprecated
	 */
	static get config() {
		return Settings.get(SETTINGS_KEY); // internal cache already implemented by Settings package
	}

	static async connect({ url } = {}) {

		if(conn)
			return conn;

		if(process.env.REDIS_CLUSTER_MODE) {

			if(url && !Array.isArray(url))
				url = [url];

			const urls = [
				...[process.env.REDIS_WRITE_URL || false],
				...[process.env.REDIS_READ_URL || false],
				...Array.isArray(url) ? url : []
			].filter(Boolean);

			if(!urls.length)
				return;

			conn = RedisLib.createCluster({
				rootNodes: urls.map(clusterUrl => ({
					url: this.formatUrl(clusterUrl)
				})),
				useReplicas: true
			});

		} else {

			url = url || process.env.REDIS_WRITE_URL || this.config?.host;

			if(typeof url !== 'string')
				return;

			conn = RedisLib.createClient({
				url: this.formatUrl(url)
			});
		}

		conn.on('error', err => logger.error(`Redis Client Error - ${err.message}`));

		await conn.connect();

		Events.once('janiscommerce.ended', this.closeConnection);

		return conn;
	}

	static async closeConnection() {

		if(conn?.isOpen)
			await conn.quit();

		Redis.cleanConn();
	}

	static formatUrl(url) {
		return url.indexOf('redis://') === -1
			? `redis://${url}`
			: url;
	}

	static cleanConn() {
		conn = null;
	}
};
