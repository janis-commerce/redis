'use strict';

const { promisify } = require('util');

const redis = require('redis');
const Settings = require('@janiscommerce/settings');

const RedisError = require('./redis-error');

const SETTINGS_KEY = 'redis';
const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = 6379;

const promisfyMethods = ['hget', 'hset', 'hdel'];

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
	 * @param {string} key
	 * @param {string} subKey
	 * @param {object} value Value to be Stored
	 * @returns {integer} 1 = new value store, 0 = value updated
	 */
	static async set(key, subKey, value) {
		try {
			const response = await this.client.hset(key, subKey, JSON.stringify(value));
			return response;
		} catch(error) {
			throw new RedisError(error, RedisError.codes.SET_PROBLEM);
		}
	}

	/**
	 * Get a value in Redis
	 * @async
	 * @param {string} key
	 * @param {string} subKey
	 * @returns {object} Value Storaged
	 */
	static async get(key, subKey) {
		try {
			const value = await this.client.hget(key, subKey);
			return value && JSON.parse(value);
		} catch(error) {
			throw new RedisError(error, RedisError.codes.GET_PROBLEM);
		}
	}

	/**
	 * Delete a value
	 * @async
	 * @param {string} key
	 * @param {string} subKey
	 * @returns {integer} 0 = no delete, 1 = deleted
	 */
	static async del(key, subKey) {
		try {
			const response = await this.client.hdel(key, subKey);
			return response;
		} catch(error) {
			throw new RedisError(error, RedisError.codes.DEL_PROBLEM);
		}
	}
}

module.exports = Redis;
