# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

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