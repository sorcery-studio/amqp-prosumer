# amqp-prosumer

AMQP-based Consumer/Producer tool

![Node.js CI](https://github.com/SorceryStudio/amqp-prosumer/workflows/Node.js%20CI/badge.svg)

## Usage

### Getting started

The tool provides `--help` information for you to get started. Please refer to the --help of each and every command for more details.

### Publishing messages

In order to publish a series of messages to a `topic` exchange:

```bash
cat messages.txt | amqp-prosumer produce -e ExampleExchange
```

The example `messages.txt` file is a simple text-file, where each line forms a message which will be sent to the broker.

### Consuming messages

In order to consume a message from an exchange

```bash
amqp-prosumer consume -e ExampleExchange > output.txt
```

### Debugging

If you'd like to know what's happening while the command is running, start it with the `DEBUG="*"` environment variable set.

```bash
DEBUG="*" amqp-prosumer consume -q ExampleQueue
```
