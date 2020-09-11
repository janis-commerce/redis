'use strict';

const { promisify } = require('util');

const redis = require('redis');
const Settings = require('@janiscommerce/settings');

const RedisError = require('./redis-error');

const SETTINGS_KEY = 'redis';
const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = 6379;

const promisfyMethods = ['hget', 'hset', 'hdel', 'hgetall'];

class Redis {

	static get config() {

		if(!this._config)
			this._config = Settings.get(SETTINGS_KEY) || {};

		return this._config;
	}

	static get client() {

		if(!this._client) {
			this._client = redis.createClient({
				host: this.config.host || DEFAULT_HOST,
				port: this.config.port || DEFAULT_PORT,
				retry_strategy: options => {
					if(options.error && options.error.code === 'ECONNREFUSED')
						throw new RedisError(options.error, RedisError.codes.CONNECTION_PROBLEM);

					if(options.attempt >= 3)
						return undefined;

					return 1000;
				}
			});

			promisfyMethods.forEach(method => {
				this._client[method] = promisify(this._client[method]);
			});
		}

		return this._client;
	}

	/**
	 * Insert or Update a value
	 * @async
	 * @param {string} entity
	 * @param {string} id
	 * @param {object} value Value to be Stored
	 * @returns {integer} 1 = new value store, 0 = value updated
	 */
	static async set(entity, id, value) {
		try {
			const response = await this.client.hset(entity, id, JSON.stringify(value));
			return response;
		} catch(error) {
			throw new RedisError(error, RedisError.codes.SET_PROBLEM);
		}
	}

	/**
	 * Get a value in Redis
	 * @async
	 * @param {string} entity
	 * @param {string} id Optional
	 * @returns {object} Value Storaged
	 */
	static async get(entity, id) {

		let value;

		try {
			value = id ? await this.client.hget(entity, id) : await this.client.hgetall(entity);
		} catch(error) {
			throw new RedisError(error, RedisError.codes.GET_PROBLEM);
		}

		if(!value)
			return null;

		if(id)
			return JSON.parse(value);

		return Object.entries(value).reduce((result, [key, val]) => {
			return {
				...result,
				[key]: JSON.parse(val)
			};
		}, {});
	}

	/**
	 * Delete a value
	 * @async
	 * @param {string} entity
	 * @param {string} id
	 * @returns {integer} 0 = no delete, 1 = deleted
	 */
	static async del(entity, id) {
		try {
			const response = await this.client.hdel(entity, id);
			return response;
		} catch(error) {
			throw new RedisError(error, RedisError.codes.DEL_PROBLEM);
		}
	}
}

module.exports = Redis;
