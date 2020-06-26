# amqp-prosumer

AMQP-based Consumer/Producer tool

## Usage

### Getting started

The tool provides `--help` information for you to get started. Please refer to the --help of each and every command for more details.

### Publishing messages

In order to publish a series of messages to a `topic` exchange:

```bash
cat messages.txt | amqp-prosumer produce -e ExampleExchange
```

### Consuming messages

In order to consume a message from an exchange

```bash
amqp-prosumer consume -e Example Exchange > output.txt
```
