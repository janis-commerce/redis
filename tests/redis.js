'use strict';

const assert = require('assert');
const sinon = require('sinon');

const redis = require('@redis/client');

const Settings = require('@janiscommerce/settings');

const Redis = require('../lib/redis');

describe('Redis', () => {

	const stubSettings = returns => {
		sinon.stub(Settings, 'get')
			.returns(returns);
	};

	afterEach(() => {
		sinon.assert.calledOnceWithExactly(Settings.get, 'redis');
		sinon.restore();
		// eslint-disable-next-line no-underscore-dangle
		Redis._config = undefined;
	});

	it('Should create redis client using settings', async () => {

		const clientStub = sinon.stub();

		const client = { connect: clientStub };

		sinon.stub(redis, 'createClient')
			.returns(client);

		stubSettings({ host: 'localhost', port: 6379 });

		const createdClient = await Redis.connect();

		assert.deepStrictEqual(createdClient, client);

		sinon.assert.calledOnceWithExactly(redis.createClient, {
			socket: {
				host: 'localhost',
				port: 6379,
				reconnectStrategy: sinon.match.func
			}
		});

		sinon.assert.calledOnceWithExactly(clientStub);
	});

	context('When reconnect strategy is used', () => {

		const client = { connect: () => {} };

		beforeEach(() => {
			stubSettings({ host: 'localhost', port: 6379 });
		});

		afterEach(() => {
			sinon.assert.calledOnceWithExactly(redis.createClient, {
				socket: {
					host: 'localhost',
					port: 6379,
					reconnectStrategy: sinon.match.func
				}
			});
		});

		[1000, 1000, false, false].forEach((expectedResult, retry) => {

			it(`Should response ${expectedResult} on retry #${retry}`, async () => {

				sinon.stub(redis, 'createClient')
					.callsFake(options => {
						const result = options.socket.reconnectStrategy(retry);
						assert.deepStrictEqual(result, expectedResult);

						return client;
					});

				await Redis.connect();

			});
		});
	});

	it('Should avoid connection when no settings were found', async () => {

		sinon.spy(redis, 'createClient');

		sinon.stub(Settings, 'get')
			.returns();

		const connResult = await Redis.connect();

		assert.deepStrictEqual(connResult, undefined);

		sinon.assert.notCalled(redis.createClient);
	});
});
