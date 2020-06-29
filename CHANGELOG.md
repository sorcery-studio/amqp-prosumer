# Changelog

## [0.2.2] - 2020-06-29

Note: 0.2.1 was wrongly released and is replaced by 0.0.2

### Fixed

* Fixed the issue which resulted in not all messages being sent out to the broker by the `produce` command

## [0.2.0] - 2020-06-26

### Added

* Provided `LICENSE.md` file.
* Provided `CHANGELOG.md` file.

### Changed

* The `produce` command does no longer require the `-e, --exchange` parameter. It can be now called either with `-e, --exchange` or `-q, --queue`.

### Fixed

* The `consume` command now correctly `ACK`s the messages from the broker.
* Fixed the `consume` example from the readme file.

## 0.1.0 - 2020-06-26

### Added

* Basic implementation of `produce` command.
* Basic implementation of `consume` command.
