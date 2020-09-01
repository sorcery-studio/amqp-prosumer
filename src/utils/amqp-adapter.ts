import { debug } from "debug";
import * as amqplib from "amqplib";
import { Channel, ConsumeMessage } from "amqplib";

const log = debug("amqp-prosumer:amqp-adapter");

export enum ConsumeResult {
  ACK,
  RETRY,
  REJECT,
}

export enum Mode {
  PRODUCER,
  CONSUMER,
  PROSUMER
};

/**
 * Represents a callback function which will be called with the message which got consumed
 *
 * It's expected to return one of the
 *
 * @return {Promise<ConsumeResult>} Consume result which will determine the faith of the message passed to the consumer
 */
export type ConsumeCallback = (msg: ConsumeMessage) => Promise<ConsumeResult>;
export type CancelCallback = () => void;

interface AmqpAdapter {
  publish: (message: string) => Promise<void>;
  sendToQueue: (message: string) => Promise<void>;
  consume: (
    onMessage: ConsumeCallback,
    onCancel: CancelCallback
  ) => Promise<amqplib.Replies.Consume>;
  cancel: (consumerTag: string) => Promise<void>;
  disconnect: () => Promise<void>;
}

interface ProducerSpec {
  assert: boolean;
  queue?: QueueSpec;
  exchange?: ExchangeSpec;
}

interface ConsumerSpec {
  assert: boolean;
  queue: QueueSpec;
  exchange?: ExchangeSpec;
  bind?: BindSpec;
}

interface QueueSpec {
  name: string;
  durable?: boolean;
  autoDelete?: boolean;
  exclusive?: boolean;
}

interface ExchangeSpec {
  name: string;
  durable: boolean;
  autoDelete: boolean;
  type: "topic";
}

interface BindSpec {
  routingKey: string;
}

interface ConnectionOptions {
  url: string;
  mode: Mode;
  consume?: ConsumerSpec;
  produce?: ProducerSpec;
}

async function assertExchange(
  spec: ExchangeSpec,
  channel: Channel
): Promise<amqplib.Replies.AssertExchange> {
  const exOpts = {
    durable: spec.durable,
    autoDelete: spec.autoDelete,
  };

  const ex = await channel.assertExchange(spec.name, spec.type, exOpts);

  log("Target exchange %s asserted", ex.exchange);

  return ex;
}

async function connectToBroker(url: string): Promise<amqplib.Connection> {
  const connection = await amqplib.connect(url);
  log("Connection to %s established", url);
  return connection;
}

async function createChannel(
  connection: amqplib.Connection
): Promise<amqplib.Channel> {
  const channel = await connection.createChannel();
  log("Channel created");

  channel.on("close", (serverError?) => {
    log("Channel#close()");

    if (serverError) {
      log("Received Channel#close() with error", serverError);
    }
  });

  channel.on("error", (err) => {
    // ToDo: How will you tell the user?
    log("Channel#error()", err);
  });

  channel.on("return", (msg) => {
    // ToDo: How will you tell the user?
    log("Channel#return()", msg);
  });

  channel.on("drain", () => {
    log("Channel#drain()");
  });

  channel.on("blocked", (reason) => {
    // ToDo: How will you tell the user?
    log("Channel#blocked()", reason);
  });

  channel.on("unblocked", (reason) => {
    // ToDo: How will you tell the user?
    log("Channel#unblocked()", reason);
  });

  return channel;
}

/**
 * Establishes connection to the message broker and provides a set of "connected" functions
 *   which can be used by the client code to interact with the broker.
 *
 * @param options
 */
export async function createAmqpAdapter(
  options: ConnectionOptions
): Promise<AmqpAdapter> {
  const connection = await connectToBroker(options.url);
  const channel = await createChannel(connection);

  // Publish to exchange - !q ex
  // Publish to queue - q !ex
  // Consume from queue - q !ex
  // Consume from exchange - q ex
  // TODO: Consume, always requires queue, exchange is optional - this code shouldn't care...
  //   In fact, the consume and publish functions are the ones who have enough context to do this

  if (options.queue) {
    const { name, ...qOpts } = options.queue;

    const queueName = options.assert
      ? (await channel.assertQueue(name, qOpts)).queue
      : options.queue.name;

    log("Target queue %s asserted", queueName);

    log("Using queue name %s", queueName);
  }

  // I don't need a queue in the producer scenario
  const qName = options.qeue ? prepareQueue(options.queue) : "";

  if (options.exchange) {
    const exchangeName = options.assert
      ? (await assertExchange(options.exchange, channel)).exchange
      : options.exchange.name;

    log("Using exchange name %s", exchangeName);
  }

  if (queueName && exchangeName && options.bind) {
    await channel.bindQueue(queueName, exchangeName, options.bind.routingKey);

    log(
      "Bound queue %s to exchange %s on routing key %s",
      queueName,
      exchangeName,
      options.bind.routingKey
    );
  }

  const publish = async (message: string): Promise<void> => {
    if (!exchangeName) {
      throw new Error(
        "The target exchange is not defined, we can't publish. Did you provide exchange spec?"
      );
    }

    log("Publishing message to exchange: %s", message);

    const keepSending = await channel.publish(
      exchangeName,
      "",
      Buffer.from(message)
    );

    if (!keepSending) {
      await waitForDrain(channel);
    }
  };

  const sendToQueue = async (message: string): Promise<void> => {
    if (!queueName) {
      throw new Error(
        "The target queue is not defined, we can't send to it. Did you provide queue spec?"
      );
    }

    log("Sending message to queue: %s", message);

    const keepSending = channel.sendToQueue(queueName, Buffer.from(message));

    if (!keepSending) {
      await waitForDrain(channel);
    }
  };

  const consume = async (
    onMessage: ConsumeCallback,
    onCancel: CancelCallback
  ): Promise<amqplib.Replies.Consume> => {
    if (!queueName) {
      throw new Error(
        "No queue from which we can consume. Did you provide queue spec?"
      );
    }

    return channel.consume(queueName, async (msg) => {
      if (msg === null) {
        log(
          "The consumer was cancelled by the server, we should shut down now..."
        );

        await onCancel();
        return;
      }

      const result = await onMessage(msg);

      if (result === ConsumeResult.ACK) {
        channel.ack(msg);
      }
    });
  };

  const cancel = async (consumerTag: string): Promise<void> => {
    await channel.cancel(consumerTag);
  };

  const disconnect = async (): Promise<void> => {
    log("Closing channel");
    await channel.close();
    log("Channel closed");

    log("Shutting down the connection");
    await connection.close();
    log("Shutdown completed");
  };

  // By returning standalone functions this way, we're effectively returning a custom "class" here, the only difference,
  // this way, the `createAmqpAdapter` function acts as a "type constructor".
  //
  // It definitely can simplify the client code - which only uses "simple functions". This comes from the fact,
  // that amqplib is not a FP-oriented library, so the OOP paradigm leaks into the client code. Because of this,
  // we're having this OOP-FP adapter.
  return {
    publish,
    sendToQueue,
    consume,
    cancel,
    disconnect,
  };
}

/**
 * Helper function which can be used to block execution (sending further messages)
 *   till the 'drain' event is emit form the channel.
 *
 * @param channel The channel to wait for
 */
export async function waitForDrain(channel: Channel): Promise<void> {
  return new Promise((resolve) => {
    channel.once("drain", () => {
      resolve();
    });
  });
}
