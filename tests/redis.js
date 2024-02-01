/* eslint-disable no-underscore-dangle */

'use strict';

const assert = require('assert');
const sinon = require('sinon');

const RedisLib = require('@redis/client');

const Settings = require('@janiscommerce/settings');
const Events = require('@janiscommerce/events');

const Redis = require('../lib/redis');
const RedisError = require('../lib/redis-error');

describe('Redis', () => {

	const stubSettings = returns => {
		sinon.stub(Settings, 'get')
			.returns(returns || {});
	};

	afterEach(() => {

		delete process.env.REDIS_READ_URL;
		delete process.env.REDIS_WRITE_URL;
		delete process.env.REDIS_CLUSTER_MODE;

		sinon.restore();
		Redis.cleanConn();
	});

	describe('Error Codes', () => {

		it('Should return the Redis Error code', async () => {
			assert.deepStrictEqual(Redis.errorCodes.REDIS_ERROR, RedisError.codes.REDIS_ERROR);
		});

		it('Should return the Max connection retries error', async () => {
			assert.deepStrictEqual(Redis.errorCodes.MAX_CONNECTION_RETRIES, RedisError.codes.MAX_CONNECTION_RETRIES);
		});
	});

	describe('Client Mode', () => {

		beforeEach(() => {
			sinon.spy(RedisLib, 'createCluster');
		});

		afterEach(() => {
			sinon.assert.notCalled(RedisLib.createCluster);
		});

		it('Should create Redis client when configured using url parameter in connect()', async () => {

			const connectStub = sinon.stub().resolves();
			const quitStub = sinon.stub().resolves();
			const on = sinon.stub();

			const conn = { connect: connectStub, quit: quitStub, on };

			stubSettings();

			sinon.stub(RedisLib, 'createClient')
				.returns(conn);

			const createdConn = await Redis.connect({ url: 'redis://write.redis.my-service.com' });

			await Events.emit('janiscommerce.ended');

			assert.deepStrictEqual(createdConn, conn);

			sinon.assert.calledOnceWithExactly(RedisLib.createClient, {
				url: 'redis://write.redis.my-service.com',
				socket: {
					reconnectStrategy: sinon.match.func
				}
			});

			sinon.assert.calledOnceWithExactly(connectStub);

			sinon.assert.notCalled(Settings.get);
			sinon.assert.calledOnceWithExactly(on, 'error', sinon.match.func);
		});

		it('Should create Redis client when configured using env var REDIS_WRITE_URL', async () => {

			process.env.REDIS_WRITE_URL = 'write.redis.my-service.com';

			const connectStub = sinon.stub().resolves();
			const quitStub = sinon.stub().resolves();
			const on = sinon.stub();

			const conn = { connect: connectStub, quit: quitStub, on };

			stubSettings();

			sinon.stub(RedisLib, 'createClient')
				.returns(conn);

			const createdConn = await Redis.connect();

			await Events.emit('janiscommerce.ended');

			assert.deepStrictEqual(createdConn, conn);

			sinon.assert.calledOnceWithExactly(RedisLib.createClient, {
				url: 'redis://write.redis.my-service.com',
				socket: {
					reconnectStrategy: sinon.match.func
				}
			});

			sinon.assert.calledOnceWithExactly(connectStub);

			sinon.assert.notCalled(Settings.get);
			sinon.assert.calledOnceWithExactly(on, 'error', sinon.match.func);
		});

		it('Should create Redis client when configured using Settings', async () => {

			const connectStub = sinon.stub().resolves();
			const quitStub = sinon.stub().resolves();
			const on = sinon.stub();

			const conn = { connect: connectStub, quit: quitStub, on };

			sinon.stub(RedisLib, 'createClient')
				.returns(conn);

			stubSettings({ host: 'redis.my-service.com' });

			const createdConn = await Redis.connect();

			await Events.emit('janiscommerce.ended');

			assert.deepStrictEqual(createdConn, conn);

			sinon.assert.calledOnceWithExactly(RedisLib.createClient, {
				url: 'redis://redis.my-service.com',
				socket: {
					reconnectStrategy: sinon.match.func
				}
			});

			sinon.assert.calledOnceWithExactly(connectStub);

			sinon.assert.calledOnceWithExactly(Settings.get, 'redis');
			sinon.assert.calledOnceWithExactly(on, 'error', sinon.match.func);
		});

		it('Should re-use Redis client after connect a second time', async () => {

			process.env.REDIS_WRITE_URL = 'write.redis.my-service.com';

			stubSettings();

			const connectStub = sinon.stub().resolves();
			const quitStub = sinon.stub().resolves();
			const on = sinon.stub();

			const conn = { connect: connectStub, quit: quitStub, on };

			sinon.stub(RedisLib, 'createClient')
				.returns(conn);

			const createdConn = await Redis.connect();
			const otherConnConn = await Redis.connect();

			await Events.emit('janiscommerce.ended');

			assert.deepStrictEqual(createdConn, conn);
			assert.deepStrictEqual(otherConnConn, conn);

			sinon.assert.calledOnceWithExactly(RedisLib.createClient, {
				url: 'redis://write.redis.my-service.com',
				socket: {
					reconnectStrategy: sinon.match.func
				}
			});

			sinon.assert.calledOnceWithExactly(connectStub);

			sinon.assert.notCalled(Settings.get);
			sinon.assert.calledOnceWithExactly(on, 'error', sinon.match.func);
		});

		it('Should not connect when env vars nor setting were configured', async () => {

			sinon.spy(RedisLib, 'createClient');

			stubSettings();

			const connResult = await Redis.connect();

			await Events.emit('janiscommerce.ended');

			assert.deepStrictEqual(connResult, undefined);

			sinon.assert.notCalled(RedisLib.createClient);

			sinon.assert.calledOnceWithExactly(Settings.get, 'redis');
		});

		it('Should pass maxRetries with default value (3) when no maxRetries param is received', async () => {

			const connectStub = sinon.stub().resolves();
			const quitStub = sinon.stub().resolves();
			const on = sinon.stub();

			const conn = { connect: connectStub, quit: quitStub, on };

			stubSettings();

			sinon.stub(RedisLib, 'createClient')
				.returns(conn);

			const createdConn = await Redis.connect({ url: 'redis://write.redis.my-service.com' });

			await Events.emit('janiscommerce.ended');

			assert.deepStrictEqual(createdConn, conn);

			sinon.assert.calledOnceWithExactly(RedisLib.createClient, {
				url: 'redis://write.redis.my-service.com',
				socket: {
					reconnectStrategy: sinon.match.func
				}
			});

			const { reconnectStrategy } = RedisLib.createClient.lastCall.lastArg.socket;

			// Every retry returns the retry count by 50
			assert.deepStrictEqual(reconnectStrategy(0), 0);
			assert.deepStrictEqual(reconnectStrategy(1), 50);
			assert.deepStrictEqual(reconnectStrategy(2), 100);
			assert.deepStrictEqual(reconnectStrategy(3), new Error('Max connection retries (3) reached.'));
		});

		it('Should use the received connectTimeout when it is received', async () => {

			const connectStub = sinon.stub().resolves();
			const quitStub = sinon.stub().resolves();
			const on = sinon.stub();

			const conn = { connect: connectStub, quit: quitStub, on };

			stubSettings();

			sinon.stub(RedisLib, 'createClient')
				.returns(conn);

			const createdConn = await Redis.connect({
				url: 'redis://write.redis.my-service.com',
				connectTimeout: 1000
			});

			await Events.emit('janiscommerce.ended');

			assert.deepStrictEqual(createdConn, conn);

			sinon.assert.calledOnceWithExactly(RedisLib.createClient, {
				url: 'redis://write.redis.my-service.com',
				socket: {
					connectTimeout: 1000,
					reconnectStrategy: sinon.match.func
				}
			});
		});

		it('Should use the received maxRetries when its received', async () => {

			const connectStub = sinon.stub().resolves();
			const quitStub = sinon.stub().resolves();
			const on = sinon.stub();

			const conn = { connect: connectStub, quit: quitStub, on };

			stubSettings();

			sinon.stub(RedisLib, 'createClient')
				.returns(conn);

			const createdConn = await Redis.connect({
				url: 'redis://write.redis.my-service.com',
				maxRetries: 1
			});

			await Events.emit('janiscommerce.ended');

			assert.deepStrictEqual(createdConn, conn);

			sinon.assert.calledOnceWithExactly(RedisLib.createClient, {
				url: 'redis://write.redis.my-service.com',
				socket: {
					reconnectStrategy: sinon.match.func
				}
			});

			const { reconnectStrategy } = RedisLib.createClient.lastCall.lastArg.socket;

			// Every retry returns the retry count by 50
			assert.deepStrictEqual(reconnectStrategy(0), 0);
			assert.deepStrictEqual(reconnectStrategy(1), new Error('Max connection retries (1) reached.'));
		});

		it('Should not retry if received maxRetries is 0', async () => {

			const connectStub = sinon.stub().resolves();
			const quitStub = sinon.stub().resolves();
			const on = sinon.stub();

			const conn = { connect: connectStub, quit: quitStub, on };

			stubSettings();

			sinon.stub(RedisLib, 'createClient')
				.returns(conn);

			const createdConn = await Redis.connect({
				url: 'redis://write.redis.my-service.com',
				maxRetries: 0
			});

			await Events.emit('janiscommerce.ended');

			assert.deepStrictEqual(createdConn, conn);

			sinon.assert.calledOnceWithExactly(RedisLib.createClient, {
				url: 'redis://write.redis.my-service.com',
				socket: {
					reconnectStrategy: sinon.match.func
				}
			});

			const { reconnectStrategy } = RedisLib.createClient.lastCall.lastArg.socket;

			assert.deepStrictEqual(reconnectStrategy(0), new Error('Max connection retries (0) reached.'));
		});

		it('Should throw max retries error when Redis.connect() fails with ReconnectStrategyError', async () => {

			const SampleRedisError = class ReconnectStrategyError extends Error {};

			const connectStub = sinon.stub()
				.rejects(new SampleRedisError('Connection timeout'));

			const quitStub = sinon.stub();
			const on = sinon.stub();

			const conn = { connect: connectStub, quit: quitStub, on };

			stubSettings();

			sinon.stub(RedisLib, 'createClient')
				.returns(conn);

			await assert.rejects(Redis.connect({ url: 'redis://write.redis.my-service.com' }), {
				name: RedisError.name,
				code: RedisError.codes.MAX_CONNECTION_RETRIES
			});

			sinon.assert.calledOnceWithExactly(RedisLib.createClient, {
				url: 'redis://write.redis.my-service.com',
				socket: {
					reconnectStrategy: sinon.match.func
				}
			});

			sinon.assert.calledOnceWithExactly(connectStub);

			sinon.assert.notCalled(Settings.get);
			sinon.assert.calledOnceWithExactly(on, 'error', sinon.match.func);
		});

		it('Should throw redis error when Redis.connect() fails with an Error', async () => {

			const connectStub = sinon.stub()
				.rejects(new Error('Redis error'));

			const quitStub = sinon.stub();
			const on = sinon.stub();

			const conn = { connect: connectStub, quit: quitStub, on };

			stubSettings();

			sinon.stub(RedisLib, 'createClient')
				.returns(conn);

			await assert.rejects(Redis.connect({ url: 'redis://write.redis.my-service.com' }), {
				name: RedisError.name,
				code: RedisError.codes.REDIS_ERROR
			});

			sinon.assert.calledOnceWithExactly(RedisLib.createClient, {
				url: 'redis://write.redis.my-service.com',
				socket: {
					reconnectStrategy: sinon.match.func
				}
			});

			sinon.assert.calledOnceWithExactly(connectStub);

			sinon.assert.notCalled(Settings.get);
			sinon.assert.calledOnceWithExactly(on, 'error', sinon.match.func);
		});
	});

	describe('Cluster Mode', () => {

		beforeEach(() => {
			stubSettings();
			sinon.spy(RedisLib, 'createClient');
			process.env.REDIS_CLUSTER_MODE = 'true';
		});

		afterEach(() => {
			sinon.assert.notCalled(Settings.get);
			sinon.assert.notCalled(RedisLib.createClient);
		});

		it('Should create Redis cluster using url parameter as string in connect()', async () => {

			const connectStub = sinon.stub().resolves();
			const quitStub = sinon.stub().resolves();
			const on = sinon.stub();

			const cluster = { connect: connectStub, quit: quitStub, on };

			sinon.stub(RedisLib, 'createCluster')
				.returns(cluster);

			const createdConn = await Redis.connect({ url: 'write.redis.my-service.com' });

			await Events.emit('janiscommerce.ended');

			assert.deepStrictEqual(createdConn, cluster);

			sinon.assert.calledOnceWithExactly(RedisLib.createCluster, {
				rootNodes: [{
					url: 'redis://write.redis.my-service.com',
					socket: {
						reconnectStrategy: sinon.match.func
					}
				}],
				useReplicas: true
			});

			sinon.assert.calledOnceWithExactly(connectStub);
			sinon.assert.calledOnceWithExactly(on, 'error', sinon.match.func);
		});

		it('Should create Redis cluster using parameter with multiple urls in connect()', async () => {

			const connectStub = sinon.stub().resolves();
			const quitStub = sinon.stub().resolves();
			const on = sinon.stub();

			const cluster = { connect: connectStub, quit: quitStub, on };

			sinon.stub(RedisLib, 'createCluster')
				.returns(cluster);

			const createdConn = await Redis.connect({ url: ['write.redis.my-service.com', 'read.redis.my-service.com'] });

			await Events.emit('janiscommerce.ended');

			assert.deepStrictEqual(createdConn, cluster);

			sinon.assert.calledOnceWithExactly(RedisLib.createCluster, {
				rootNodes: [
					{
						url: 'redis://write.redis.my-service.com',
						socket: {
							reconnectStrategy: sinon.match.func
						}
					},
					{
						url: 'redis://read.redis.my-service.com',
						socket: {
							reconnectStrategy: sinon.match.func
						}
					}
				],
				useReplicas: true
			});

			sinon.assert.calledOnceWithExactly(connectStub);
			sinon.assert.calledOnceWithExactly(on, 'error', sinon.match.func);
		});

		it('Should create Redis cluster using env vars REDIS_WRITE_URL', async () => {

			process.env.REDIS_WRITE_URL = 'write.redis.my-service.com';

			const connectStub = sinon.stub().resolves();
			const quitStub = sinon.stub().resolves();
			const on = sinon.stub();

			const cluster = { connect: connectStub, quit: quitStub, on };

			sinon.stub(RedisLib, 'createCluster')
				.returns(cluster);

			const createdConn = await Redis.connect();

			await Events.emit('janiscommerce.ended');

			assert.deepStrictEqual(createdConn, cluster);

			sinon.assert.calledOnceWithExactly(RedisLib.createCluster, {
				rootNodes: [{
					url: 'redis://write.redis.my-service.com',
					socket: {
						reconnectStrategy: sinon.match.func
					}
				}],
				useReplicas: true
			});

			sinon.assert.calledOnceWithExactly(connectStub);
			sinon.assert.calledOnceWithExactly(on, 'error', sinon.match.func);
		});

		it('Should create Redis cluster using env vars REDIS_WRITE_URL and REDIS_READ_URL', async () => {

			process.env.REDIS_WRITE_URL = 'write.redis.my-service.com';
			process.env.REDIS_READ_URL = 'read.redis.my-service.com';

			const connectStub = sinon.stub().resolves();
			const quitStub = sinon.stub().resolves();
			const on = sinon.stub();

			const cluster = { connect: connectStub, quit: quitStub, on };

			sinon.stub(RedisLib, 'createCluster')
				.returns(cluster);

			const createdConn = await Redis.connect();

			await Events.emit('janiscommerce.ended');

			assert.deepStrictEqual(createdConn, cluster);

			sinon.assert.calledOnceWithExactly(RedisLib.createCluster, {
				rootNodes: [
					{
						url: 'redis://write.redis.my-service.com',
						socket: {
							reconnectStrategy: sinon.match.func
						}
					},
					{
						url: 'redis://read.redis.my-service.com',
						socket: {
							reconnectStrategy: sinon.match.func
						}
					}
				],
				useReplicas: true
			});

			sinon.assert.calledOnceWithExactly(connectStub);
			sinon.assert.calledOnceWithExactly(on, 'error', sinon.match.func);
		});

		it('Should re-use Redis cluster after connect a second time', async () => {

			process.env.REDIS_WRITE_URL = 'write.redis.my-service.com';

			const connectStub = sinon.stub().resolves();
			const quitStub = sinon.stub().resolves();
			const on = sinon.stub();

			const cluster = { connect: connectStub, quit: quitStub, on };

			sinon.stub(RedisLib, 'createCluster')
				.returns(cluster);

			const createdConn = await Redis.connect();
			const otherConn = await Redis.connect();

			await Events.emit('janiscommerce.ended');

			assert.deepStrictEqual(createdConn, cluster);
			assert.deepStrictEqual(otherConn, cluster);

			sinon.assert.calledOnce(RedisLib.createCluster);
			sinon.assert.calledOnceWithExactly(connectStub);
			sinon.assert.calledOnceWithExactly(on, 'error', sinon.match.func);
		});

		it('Should close connection after janiscommerce.ended is emitted if conn is open', async () => {

			process.env.REDIS_WRITE_URL = 'write.redis.my-service.com';

			const connectStub = sinon.stub().resolves();
			const quitStub = sinon.stub().resolves();
			const on = sinon.stub();

			const cluster = { connect: connectStub, quit: quitStub, on, isOpen: true };

			sinon.stub(RedisLib, 'createCluster')
				.returns(cluster);

			await Redis.connect();

			await Events.emit('janiscommerce.ended');
			await Events.emit('janiscommerce.ended');

			sinon.assert.calledOnceWithExactly(connectStub);
			sinon.assert.calledOnceWithExactly(quitStub);
			sinon.assert.calledOnceWithExactly(on, 'error', sinon.match.func);
		});

		it('Should not close connection after janiscommerce.ended is emitted if conn is not open', async () => {

			process.env.REDIS_WRITE_URL = 'write.redis.my-service.com';

			const connectStub = sinon.stub().resolves();
			const quitStub = sinon.stub().resolves();
			const on = sinon.stub();

			const cluster = { connect: connectStub, quit: quitStub, on, isOpen: false };

			sinon.stub(RedisLib, 'createCluster')
				.returns(cluster);

			await Redis.connect();

			await Events.emit('janiscommerce.ended');
			await Events.emit('janiscommerce.ended');

			sinon.assert.calledOnceWithExactly(connectStub);
			sinon.assert.notCalled(quitStub);
			sinon.assert.calledOnceWithExactly(on, 'error', sinon.match.func);
		});

		it('Should not connect when env vars were not configured', async () => {

			sinon.spy(RedisLib, 'createCluster');

			const connResult = await Redis.connect();

			await Events.emit('janiscommerce.ended');

			assert.deepStrictEqual(connResult, undefined);

			sinon.assert.notCalled(RedisLib.createCluster);
		});
	});
});
