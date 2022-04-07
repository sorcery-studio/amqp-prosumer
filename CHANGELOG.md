# Changelog

## [1.0.5] - 2022-04-06

### Updates

* Updated dependencies to the latest versions, including security patches

## [1.0.4] - 2022-03-27

### Security

* Updated dependencies to fix known security issues of some packages

## [1.0.3] - 2022-03-18

### Security

* Updated dependencies to fix known security issues of some packages

## [1.0.2] - 2021-09-20

### Security

* Updated dependencies to fix known security issues of some packages

## [1.0.1] - 2021-09-20

### Security

* Updated dependencies to fix known security issues of some packages

## [1.0.0] - 2020-10-25

This release is a major rewrite of the tool. From this release the tool is going to be more use-case oriented, which means that the list of available (sub)commands has changed.

Migration guide will not be provided as the project is at a very early stage. Please refer to the commands `--help` to learn about the available sub-commands and their options.

### Changed

* `produce` and `consume` commands have been divided to more specialized subcommands.

## [0.3.0] - 2020-08-10

### Changed

* The `produce` command no longer waits 2 seconds before exiting.
* Bump `lodash` from 4.17.15 to 4.17.19 - security update.

## [0.2.4] - 2020-06-30

### Fixed

* Fixed the issue which resulted in duplicating messages during "flow control" state.

### Changed

* The messages taken from the input will be sent in an unmodified form (previously they were JSON-encoded before being sent).
* The consumer function does no longer trim `"` from the start and end of the received message.

## [0.2.3] - 2020-06-29

### Changed

* The values of `host`, `exchange` and `queue` are now required if the options were provided. Previously it was possible to run the command with for example `-h` and not providing the URL - which led to errors. 
* Unified the closing behaviour of `produce` and `consume` commands - they report the error in the same way and shut down the process with exit code `1`.

### Fixed

* Fixed the issue caused by prettier removing the shebang line, effectively breaking the executable.

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
