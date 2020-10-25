# amqp-prosumer

AMQP-based Consumer/Producer tool

![Node.js CI](https://github.com/SorceryStudio/amqp-prosumer/workflows/Node.js%20CI/badge.svg)

## Getting started

The tool provides `--help` information for you to get started. Please refer to the `--help` of each and every command for more details.

## Usage

### Producer

#### Publishing messages to an exchange

In order to produce a series of messages to a `topic` exchange:

```bash
cat messages.txt | amqp-prosumer produce publish-to-exchange ExampleExchange
```

The example `messages.txt` file is a simple text-file, where each line forms a message which will be sent to the broker. To send a single message you can use:

```bash
echo "MessageToSend" | amqp-prosumer produce exchange ExampleExchange
```

**NOTE:** For convenience, commands have been provided with aliases - in the examples above `produce exchange` and `produce publish-to-exchange` are the very same command. Feel free to chose form which suits you the most.

#### Producing messages to a queue

```bash
cat messages.txt | amqp-prosumer produce send-to-queue ExampleQueue
```

### Consumer

#### Consuming messages from an exchange

In order to consume a message from an exchange

```bash
amqp-prosumer consume from-exchange ExampleExchange > output.txt
```

#### Consuming messages from a queue

```bash
amqp-prosumer consume from-queue ExampleQueue > output.txt
```

### Node.JS and RabbitMQ support

The tool is transpiled for Node v10, v12 and v14. Each version is integration-tested with the latest RabbitMQ available at Docker Hub.

## Limitations

Right now the tool provides support only for `topic` exchanges, and still, it does not utilize all the possibilities which this type of exchange gives (like setting the topic for the queue). Such missing functionality might me added in the future.

## Debugging

If you'd like to know what's happening while the command is running, start it with the `DEBUG="*"` environment variable set. When you want to redirect the STDIO of `amqp-prosumer` to another application or to a file, debug messages will not be passed.

```bash
DEBUG="*" amqp-prosumer consume from-queue ExampleQueue
```

## About this project

Just for you to know: this is a side/training project which is used to exercise _sorta functional programming_ in JavaScript. _Sorta_ comes from the fact that JS is not really a language with FP core concepts included. There are open-source projects which attempt to implement FP for JS in form of frameworks, but this project intentionally avoids making use of them in order to serve the purpose of "training".
