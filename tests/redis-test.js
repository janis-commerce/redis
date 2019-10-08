'use strict';

const assert = require('assert');
const sandbox = require('sinon').createSandbox();

const redis = require('redis');
const Settings = require('@janiscommerce/settings');

const Redis = require('../lib/redis');
const RedisError = require('../lib/redis-error');

describe('Redis', () => {

	const sampleEntity = 'Clients';
	const sampleId = 'same-id';
	const sampleValue = {
		description: 'a sample',
		keywords: ['sample', 'test']
	};

	let settingsStub;

	beforeEach(() => {
		settingsStub = sandbox.stub(Settings, 'get');
	});

	afterEach(() => {
		sandbox.restore();
		delete Redis._client;
		delete Redis._config;
	});

	describe('Set', () => {

		it('Should return 1 if a new value is stored', async () => {

			const redisClientStub = {
				hset: sandbox.fake((key, subkey, value) => {
					if(key !== sampleEntity || subkey !== sampleId || value !== JSON.stringify(sampleValue))
						return -1;
					return 1;
				})
			};

			sandbox.stub(Redis, 'client').get(() => redisClientStub);

			const value = await Redis.set(sampleEntity, sampleId, sampleValue);

			assert.deepStrictEqual(value, 1);
		});

		it('Should return 0 if an existing value is updated', async () => {

			const redisClientStub = {
				hset: sandbox.fake((key, subkey, value) => {
					if(key !== sampleEntity || subkey !== sampleId || value !== JSON.stringify(sampleValue))
						return -1;
					return 0;
				})
			};

			sandbox.stub(Redis, 'client').get(() => redisClientStub);

			const value = await Redis.set(sampleEntity, sampleId, sampleValue);

			assert.deepStrictEqual(value, 0);
		});

		it('Should reject if can not set', async () => {

			const redisClientStub = {
				hset: sandbox.fake.rejects()
			};

			sandbox.stub(Redis, 'client').get(() => redisClientStub);

			await assert.rejects(Redis.set(sampleEntity, sampleId, sampleValue), { code: RedisError.codes.SET_PROBLEM });

		});
	});

	describe('Get', () => {

		it('Should return null if a profile does not exist', async () => {

			const redisClientStub = {
				hget: sandbox.fake.resolves(null)
			};

			sandbox.stub(Redis, 'client').get(() => redisClientStub);

			const value = await Redis.get(sampleEntity, sampleId);

			assert.deepStrictEqual(value, null);
		});

		it('Should return the object if a profile is found', async () => {

			const redisClientStub = {
				hget: sandbox.fake.resolves(JSON.stringify(sampleValue))
			};

			sandbox.stub(Redis, 'client').get(() => redisClientStub);

			const value = await Redis.get(sampleEntity, sampleId);

			assert.deepStrictEqual(value, sampleValue);
		});

		it('Should reject if can not get', async () => {
			const redisClientStub = {
				hget: sandbox.fake.rejects()
			};

			sandbox.stub(Redis, 'client').get(() => redisClientStub);

			await assert.rejects(Redis.get(sampleEntity, sampleId), { code: RedisError.codes.GET_PROBLEM });

		});
	});

	describe('Delete', () => {

		it('Should return 1 if a profile is deleted', async () => {

			const redisClientStub = {
				hdel: sandbox.fake.resolves(1)
			};

			sandbox.stub(Redis, 'client').get(() => redisClientStub);

			const value = await Redis.del(sampleEntity, sampleId);

			assert.deepStrictEqual(value, 1);
		});

		it('Should return 0 if a profile does not exist', async () => {

			const redisClientStub = {
				hdel: sandbox.fake.resolves(0)
			};

			sandbox.stub(Redis, 'client').get(() => redisClientStub);

			const value = await Redis.del(sampleEntity, sampleId);

			assert.deepStrictEqual(value, 0);
		});

		it('Should reject if can not delete', async () => {
			const redisClientStub = {
				hdel: sandbox.fake.rejects()
			};

			sandbox.stub(Redis, 'client').get(() => redisClientStub);

			await assert.rejects(Redis.del(sampleEntity, sampleId), { code: RedisError.codes.DEL_PROBLEM });

		});
	});

	describe('Client configuration', async () => {

		const redisClientStub = sandbox.stub(redis.RedisClient.prototype);

		it('Should pass the settings to the client', async () => {

			settingsStub.returns({ host: 'some-host', port: 1234 });

			sandbox.stub(redis, 'createClient')
				.callsFake(({ host, port }) => {

					assert.strictEqual(host, 'some-host');
					assert.strictEqual(port, 1234);

					return redisClientStub;
				});

			const { client } = Redis.client;

			assert(client);
		});

		it('Should use default values if settings are not defined', async () => {

			settingsStub.returns(null);

			sandbox.stub(redis, 'createClient')
				.callsFake(({ host, port }) => {

					assert.strictEqual(host, 'localhost');
					assert.strictEqual(port, 6379);

					return redisClientStub;
				});

			const { client } = Redis.client;

			assert(client);
		});


		it('Should create the redis client only once', async () => {

			settingsStub.returns({ host: 'some-host', port: 1234 });

			sandbox.stub(redis, 'createClient')
				.callsFake(({ host, port }) => {

					assert.strictEqual(host, 'some-host');
					assert.strictEqual(port, 1234);

					return redisClientStub;
				});

			const { client: client1 } = Redis.client;
			const { client: client2 } = Redis.client;

			assert(client1);
			assert(client2);
			assert(client1 === client2);

			sandbox.assert.calledOnce(redis.createClient);
		});

		it('Should throw the received error if it is a connection error', async () => {

			sandbox.stub(redis, 'createClient')
				.callsFake(options => {

					const connectionError = new Error('Connection error');
					connectionError.code = 'ECONNREFUSED';

					assert.throws(() => {
						options.retry_strategy({
							error: connectionError,
							attempt: 1
						});
					}, { code: RedisError.codes.CONNECTION_PROBLEM, message: 'Connection error' });

					return redisClientStub;
				});

			const { client } = Redis.client;

			assert(client);
		});

		it('Should return the next connection timeout if attemps are lesser than 3', async () => {

			sandbox.stub(redis, 'createClient')
				.callsFake(options => {

					const error = new Error('Some error');

					const retryResponse = options.retry_strategy({
						error,
						attempt: 2
					});
					assert.strictEqual(retryResponse, 1000);

					return redisClientStub;
				});

			const { client } = Redis.client;

			assert(client);
		});

		it('Should return undefined if attemps are greater or equal to 3', async () => {

			sandbox.stub(redis, 'createClient')
				.callsFake(options => {

					const error = new Error('Some error');

					const retryResponse = options.retry_strategy({
						error,
						attempt: 3
					});
					assert.strictEqual(retryResponse, undefined);

					return redisClientStub;
				});

			const { client } = Redis.client;

			assert(client);
		});
	});
});
