/* eslint-disable no-underscore-dangle */

'use strict';

const assert = require('assert');
const sinon = require('sinon');

const RedisLib = require('@redis/client');

const Settings = require('@janiscommerce/settings');

const Events = require('@janiscommerce/events');

const Redis = require('../lib/redis');

describe('Redis', () => {

	const originalEnvs = { ...process.env };

	const stubSettings = returns => {
		sinon.stub(Settings, 'get')
			.returns(returns || {});
	};

	afterEach(() => {

		sinon.restore();
		process.env = { ...originalEnvs };

		Redis.cleanConn();
	});

	describe('Client Mode', () => {

		beforeEach(() => {
			sinon.spy(RedisLib, 'createCluster');
		});

		afterEach(() => {
			sinon.assert.notCalled(RedisLib.createCluster);
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
				socket: { host: 'write.redis.my-service.com' }
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
				socket: { host: 'redis.my-service.com' }
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
				socket: { host: 'write.redis.my-service.com' }
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
				rootNodes: [{ url: 'write.redis.my-service.com' }],
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
					{ url: 'write.redis.my-service.com' },
					{ url: 'read.redis.my-service.com' }
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

		it('Should close connection after janiscommerce.ended is emitted', async () => {

			process.env.REDIS_WRITE_URL = 'write.redis.my-service.com';

			const connectStub = sinon.stub().resolves();
			const quitStub = sinon.stub().resolves();
			const on = sinon.stub();

			const cluster = { connect: connectStub, quit: quitStub, on };

			sinon.stub(RedisLib, 'createCluster')
				.returns(cluster);

			await Redis.connect();

			await Events.emit('janiscommerce.ended');
			await Events.emit('janiscommerce.ended');

			sinon.assert.calledOnceWithExactly(connectStub);
			sinon.assert.calledOnceWithExactly(quitStub);
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
