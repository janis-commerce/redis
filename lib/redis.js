'use strict';

const logger = require('lllog')();

const RedisLib = require('@redis/client');

const Events = require('@janiscommerce/events');
const Settings = require('@janiscommerce/settings');

const RedisError = require('./redis-error');

const SETTINGS_KEY = 'redis';
const DEFAULT_MAX_RETRIES = 3;

const REDIS_ERRORS = {
	reconnectStrategyError: 'ReconnectStrategyError'
};

/** @type {import('@redis/client').RedisClientType | import('@redis/client').RedisClusterType} */
let conn;

module.exports = class Redis {

	/**
	 * @deprecated
	 */
	static get config() {
		return Settings.get(SETTINGS_KEY); // internal cache already implemented by Settings package
	}

	static get errorCodes() {
		return RedisError.codes;
	}

	/**
	 * @param {Object} config
	 * @param {String} config.url optional url for connecting the client of cluster
	 * @param {Number} config.connectTimeout optional connection timeout in miliseconds (Default: 5000)
	 * @param {Number} config.maxRetries optional max connection retries (Default: 3)
	 */
	static async connect({ url, connectTimeout, maxRetries } = {}) {

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
					socket: this.formatSocket(maxRetries, connectTimeout)
				})),
				useReplicas: true
			});

		} else {

			url = url || process.env.REDIS_WRITE_URL || this.config?.host;

			if(typeof url !== 'string')
				return;

			conn = RedisLib.createClient({
				url: this.formatUrl(url),
				socket: this.formatSocket(maxRetries, connectTimeout)
			});
		}

		conn.on('error', err => logger.error(`Redis Client Error - ${err.message}`));

		try {

			await conn.connect();

		} catch(err) {

			if(err.constructor.name === REDIS_ERRORS.reconnectStrategyError)
				throw new RedisError(err.message, RedisError.codes.MAX_CONNECTION_RETRIES, err);

			throw new RedisError(err.message, RedisError.codes.REDIS_ERROR, err);
		}

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

	static formatSocket(maxRetries, connectTimeout) {

		if(!maxRetries && maxRetries !== 0)
			maxRetries = DEFAULT_MAX_RETRIES;

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
			...connectTimeout && { connectTimeout }, // Default 5000 ms
			reconnectStrategy: retries => this.retriesHandler(retries, maxRetries)
		};
	}

	static retriesHandler(retries, maxRetries) {

		// Redis retries count starts from 0
		if(retries < maxRetries)
			return Math.min(retries * 50, 1000); // Redis default retry strategy (adds 50 miliseconds of wait per retry with a max of 1000)

		return new Error(`Max connection retries (${maxRetries}) reached.`);
	}

	static cleanConn() {
		conn = null;
	}
};
