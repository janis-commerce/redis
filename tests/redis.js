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
		sinon.assert.calledOnceWithExactly(Settings.get, 'redis');
		sinon.restore();
		process.env = { ...originalEnvs };

		Redis._config = undefined;
		Redis.cleanCluster();
	});

	context('When Redis is configured with env vars', () => {

		it('Should create Redis cluster using env vars REDIS_WRITE_URL', async () => {

			process.env.REDIS_WRITE_URL = 'write.redis.my-service.com';

			stubSettings();

			const clusterStub = sinon.stub();

			const cluster = { connect: clusterStub };

			sinon.stub(RedisLib, 'createCluster')
				.returns(cluster);

			const createdCluster = await Redis.connect();

			assert.deepStrictEqual(createdCluster, cluster);

			sinon.assert.calledOnceWithExactly(RedisLib.createCluster, {
				rootNodes: [{ url: 'write.redis.my-service.com' }],
				useReplicas: true
			});

			sinon.assert.calledOnceWithExactly(clusterStub);
		});

		it('Should create Redis cluster using env vars REDIS_WRITE_URL and REDIS_READ_URL', async () => {

			process.env.REDIS_WRITE_URL = 'write.redis.my-service.com';
			process.env.REDIS_READ_URL = 'read.redis.my-service.com';

			stubSettings();

			const clusterStub = sinon.stub();

			const cluster = { connect: clusterStub };

			sinon.stub(RedisLib, 'createCluster')
				.returns(cluster);

			const createdCluster = await Redis.connect();

			assert.deepStrictEqual(createdCluster, cluster);

			sinon.assert.calledOnceWithExactly(RedisLib.createCluster, {
				rootNodes: [
					{ url: 'write.redis.my-service.com' },
					{ url: 'read.redis.my-service.com' }
				],
				useReplicas: true
			});

			sinon.assert.calledOnceWithExactly(clusterStub);
		});
	});

	context('When Redis is configured with Settings file', () => {

		it('Should create Redis cluster using old settings', async () => {

			const clusterStub = sinon.stub();

			const cluster = { connect: clusterStub };

			sinon.stub(RedisLib, 'createCluster')
				.returns(cluster);

			stubSettings({ host: 'redis.my-service.com' });

			const createdCluster = await Redis.connect();

			assert.deepStrictEqual(createdCluster, cluster);

			sinon.assert.calledOnceWithExactly(RedisLib.createCluster, {
				rootNodes: [{ url: 'redis.my-service.com' }],
				useReplicas: true
			});

			sinon.assert.calledOnceWithExactly(clusterStub);
		});
	});

	context('Re-using cluster connection', () => {

		it('Should reuse Redis cluster after connect a second time', async () => {

			process.env.REDIS_WRITE_URL = 'write.redis.my-service.com';

			const clusterStub = sinon.stub();

			const cluster = { connect: clusterStub };

			sinon.stub(RedisLib, 'createCluster')
				.returns(cluster);

			stubSettings();

			const createdCluster = await Redis.connect();

			assert.deepStrictEqual(createdCluster, cluster);

			const otherCluster = await Redis.connect();

			assert.deepStrictEqual(createdCluster, otherCluster);

			sinon.assert.calledOnce(RedisLib.createCluster);
			sinon.assert.calledOnceWithExactly(clusterStub);
		});
	});

	it('Should not connect when no settings nor env vars were configured', async () => {

		sinon.spy(RedisLib, 'createClient');

		sinon.stub(Settings, 'get')
			.returns();

		const connResult = await Redis.connect();

		assert.deepStrictEqual(connResult, undefined);

		sinon.assert.notCalled(RedisLib.createClient);
	});

	it('Should closeConnection after janiscommerce.ended is emitted', async () => {

		process.env.REDIS_WRITE_URL = 'write.redis.my-service.com';

		const clusterStub = sinon.stub();
		const quitStub = sinon.stub();

		const cluster = {
			connect: clusterStub,
			quit: quitStub
		};

		sinon.stub(RedisLib, 'createCluster')
			.returns(cluster);

		stubSettings();

		await Redis.connect();

		await Events.emit('janiscommerce.ended');
		await Events.emit('janiscommerce.ended');

		sinon.assert.calledOnceWithExactly(quitStub);
	});
});
