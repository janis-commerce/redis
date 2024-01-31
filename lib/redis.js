'use strict';

const RedisLib = require('@redis/client');

const Events = require('@janiscommerce/events');

const Settings = require('@janiscommerce/settings');

const logger = require('lllog')();

const SETTINGS_KEY = 'redis';

const DEFAULT_MAX_RETRIES = 3;

/** @type {import('@redis/client').RedisClientType | import('@redis/client').RedisClusterType} */
let conn;

module.exports = class Redis {

	/**
	 * @deprecated
	 */
	static get config() {
		return Settings.get(SETTINGS_KEY); // internal cache already implemented by Settings package
	}

	static async connect({ url, maxRetries = DEFAULT_MAX_RETRIES } = {}) {

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
					url: this.formatUrl(clusterUrl),
					socket: this.formatRetries(maxRetries)
				})),
				useReplicas: true
			});

		} else {

			url = url || process.env.REDIS_WRITE_URL || this.config?.host;

			if(typeof url !== 'string')
				return;

			conn = RedisLib.createClient({
				url: this.formatUrl(url),
				socket: this.formatRetries(maxRetries)
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

	static formatRetries(maxRetries) {

		/*
			Redis reconnectStrategy param:
			- If receives a number it will use that number as miliseconds to wait before retrying
			- If receives a `false` it won't retry
			- If receives a function it will send the retries count as param
				- If function returns a Number, it will use that number as miliseconds to wait before retrying
				- If function returns a `false` it won't retry anymore
				- If function returns an Error, same as `false` it won't retry but will use the custom error
		*/

		return {
			reconnectStrategy: retries => this.retriesHandler(retries, maxRetries)
		};
	}

	static retriesHandler(retries, maxRetries) {

		// Redis retries count starts from 0
		// Redis default retry strategy (adds 50 miliseconds of wait per retry with a max of 1000)
		if(retries < maxRetries)
			return Math.min(retries * 50, 1000);

		return new Error(`Max connection retries (${maxRetries}) reached.`);
	}

	static cleanConn() {
		conn = null;
	}
};
