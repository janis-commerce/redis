'use strict';

/**
 * @enum {number}
 * @private
 */
const ERROR_CODES = {
	REDIS_ERROR: 1, // Generic Redis Error
	MAX_CONNECTION_RETRIES: 2 // Max connection retries reached
};

module.exports = class RedisError extends Error {

	static get codes() {
		return ERROR_CODES;
	}

	constructor(message, code, err) {

		super(message);
		this.message = message;
		this.code = code;
		this.name = this.constructor.name;

		/* istanbul ignore else */
		if(err && err instanceof Error)
			this.previousError = err;
	}
};
