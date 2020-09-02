import { debug } from "debug";
import * as amqplib from "amqplib";
import { Channel, Connection, ConsumeMessage, Options } from "amqplib";

const log = debug("amqp-prosumer:amqp-adapter");

export enum ConsumeResult {
  ACK,
  RETRY,
  REJECT,
}

export interface IConnectionContext {
  readonly channel: Channel;
  readonly connection: Connection;
  readonly queueName?: string;
  readonly exchangeName?: string;
}

/**
 * @deprecated
 */
export interface IExchangeContext extends IConnectionContext {
  readonly exchangeName: string;
}

export interface IConsumerContext extends IConnectionContext {
  readonly consumerTag: string;
}

/**
 * Represents a callback function which will be called with the message which got consumed
 *
 * It's expected to return one of the
 *
 * @return {Promise<ConsumeResult>} Consume result which will determine the faith of the message passed to the consumer
 */
export type ConsumeCallback = (msg: ConsumeMessage) => Promise<ConsumeResult>;
export type CancelCallback = () => void;

export async function connectToBroker(
  url: string
): Promise<amqplib.Connection> {
  const connection = await amqplib.connect(url);
  log("Connection to %s established", url);
  return connection;
}

export function disconnectFromBroker(connection: Connection): Promise<void> {
  log("Disconnecting from broker");
  return connection.close();
}

export async function createChannel(
  connection: amqplib.Connection
): Promise<IConnectionContext> {
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

  return {
    channel,
    connection,
  };
}

/**
 * Closes the channel from the provided connection context
 *
 * @param context
 */
export async function closeChannel(
  context: IConnectionContext
): Promise<Connection> {
  log("Closing channel");
  await context.channel.close();

  return context.connection;
}

/**
 * If needed, it assures the queue on the broker and returns its name.
 *
 * @param queueName
 * @param queueOptions
 * @param assert
 */
export function declareQueue(
  queueName: string,
  queueOptions: Options.AssertQueue,
  assert: boolean
): (context: IConnectionContext) => Promise<IConnectionContext> {
  return async (context: IConnectionContext): Promise<IConnectionContext> => {
    log("Declaring queue %s", queueName);
    return {
      ...context,
      queueName: assert
        ? (await context.channel.assertQueue(queueName, queueOptions)).queue
        : queueName,
    };
  };
}

export function declareExchange(
  exchangeName: string,
  type: string,
  options: Options.AssertExchange,
  assert: boolean
): (context: IConnectionContext) => Promise<IConnectionContext> {
  log("Declaring exchange %s", exchangeName);
  return async (context): Promise<IConnectionContext> => {
    return {
      ...context,
      exchangeName: assert
        ? (await context.channel.assertExchange(exchangeName, type, options))
            .exchange
        : exchangeName,
    };
  };
}

export function bindQueueAndExchange(
  binding = "#"
): (ctx: IConnectionContext) => Promise<IConnectionContext> {
  return async (context: IConnectionContext): Promise<IConnectionContext> => {
    if (!context.queueName || !context.exchangeName) {
      throw new Error(
        "Cloud not bind queue with exchange, because one of the names is missing"
      );
    }

    log(
      "Binding queue %s to exchange %s with %s",
      context.queueName,
      context.exchangeName,
      binding
    );

    await context.channel.bindQueue(
      context.queueName,
      context.exchangeName,
      binding
    );

    return context;
  };
}

export function consume(
  onMessage: ConsumeCallback
): (context: IConnectionContext) => Promise<IConsumerContext> {
  return async (context): Promise<IConsumerContext> => {
    if (!context.queueName) {
      throw new Error("Missing queue name");
    }

    log("Starting consumer on queue %s", context.queueName);

    return {
      ...context,
      consumerTag: (
        await context.channel.consume(context.queueName, async (msg) => {
          if (msg === null) {
            log(
              "The consumer was cancelled by the server, we should shut down now..."
            );

            // await onCancel();
            return;
          }

          const result = await onMessage(msg);

          if (result === ConsumeResult.ACK) {
            context.channel.ack(msg);
          }
        })
      ).consumerTag,
    };
  };
}

export async function cancelConsumer(
  context: IConsumerContext
): Promise<IConsumerContext> {
  log("Canceling consumer %s", context.consumerTag);

  await context.channel.cancel(context.consumerTag);

  return context;
}

export async function sendToQueue(
  channel: Channel,
  queueName: string,
  message: string
): Promise<void> {
  log("Sending message to queue: %s", message);

  const keepSending = channel.sendToQueue(queueName, Buffer.from(message));

  if (!keepSending) {
    await waitForDrain(channel);
  }
}

export async function publish(
  context: IConnectionContext,
  message: string
): Promise<IConnectionContext> {
  log("Publishing message to an exchange: %s", message);

  if (!context.exchangeName) {
    throw new Error("Missing exchange name");
  }

  const keepSending = await context.channel.publish(
    context.exchangeName,
    "", // ToDo: Provide possibility to pass through 2nd parameter
    Buffer.from(message)
  );

  if (!keepSending) {
    await waitForDrain(context.channel);
  }

  return context;
}

/**
 * Establishes connection to the message broker and provides a set of "connected" functions
 *   which can be used by the client code to interact with the broker.
 *
 * @param options
 *
 * @deprecated
 */
// export async function createAmqpAdapter(
//   options: ConnectionOptions
// ): Promise<AmqpAdapter> {
//   const connection = await connectToBroker(options.url);
//   const channel = await createChannel(connection);
//
//   // Publish to exchange - !q ex
//   // Publish to queue - q !ex
//   // Consume from queue - q !ex
//   // Consume from exchange - q ex
//   // TODO: Consume, always requires queue, exchange is optional - this code shouldn't care...
//   //   In fact, the consume and publish functions are the ones who have enough context to do this
//
//   if (queueName && exchangeName && options.bind) {
//     await channel.bindQueue(queueName, exchangeName, options.bind.routingKey);
//
//     log(
//       "Bound queue %s to exchange %s on routing key %s",
//       queueName,
//       exchangeName,
//       options.bind.routingKey
//     );
//   }
//
//   const disconnect = async (): Promise<void> => {
//     log("Closing channel");
//     await channel.close();
//     log("Channel closed");
//
//     log("Shutting down the connection");
//     await connection.close();
//     log("Shutdown completed");
//   };
// }

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
