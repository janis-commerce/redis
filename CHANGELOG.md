# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.4.0] - 2024-02-01
### Added
- `config.maxRetries` param in `connect()` method for connection retries when it fails, default value 3.
- `config.connectTimeout` param in `connect()` method for custom connection timeout in ms, default value 5000
- Error codes for better error handling

## [2.3.0] - 2023-07-26
### Added
- Optional parameter `config` in `connect()` method for receiving `url`.

### Changed
- Now `url` are fixed adding `redis://` in the beginning or the url when not received.

## [2.2.0] - 2023-06-30
### Added
- Using env variable `REDIS_CLUSTER_MODE` for cluster connection.

### Changed
- Default connection is a client connection

## [2.1.0] - 2023-06-16
### Added
- New env variables `REDIS_WRITE_URL` and `REDIS_READ_URL` are used
- Using Clusters
- Re-using Cluster connection
- Quit after `janiscommerce.ended` event was emitted

### Deprecated
- Connection using `@janiscommerce/settings` and `redis` key

## [2.0.0] - 2023-05-11
### Added
- New async method `connect()`

### Changed
- Now package is a wrapper of [redis](https://www.npmjs.com/package/redis) package for using Redis commands
- **Breaking Change**. Config `host` is required to connect
- Using `@redis/client` (redis@4) instead of `redis@3`

### Removed
- **Breaking Change**. Default values for `host` and `port` fields.
- **Breaking Change**. Api methods `set()`, `get()`, `del()`

## [1.1.0] - 2020-09-11
### Added
- GitHub Actions for workflows build, coverage and publish

### Changed
- Redis version up to `^3.0.2`
- Updated package dependencies

### Fixed
- Bug on `get()` when no id received, now returns an object

### Removed
- Travis

## [1.0.0] - 2019-10-09
### Added
- `Redis`
- Unit Tests
- Documentation