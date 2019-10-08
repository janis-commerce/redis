'use strict';

class RedisError extends Error {

	static get codes() {

		return {
			CONNECTION_PROBLEM: 1,
			SET_PROBLEM: 2,
			GET_PROBLEM: 3,
			DEL_PROBLEM: 4
		};

	}

	constructor(err, code) {
		super(err);
		this.message = err.message || err;
		this.code = code;
		this.name = 'RedisError';
	}
}

module.exports = RedisError;
