/**
 * This file serves as a "adapter" layer, for FP-like approach and `amqplib` which is more OOP-oriented
 */

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
type AnyFunction = (...args: any[]) => any;

export function createDefaultChannelEventListeners(
  log: AnyFunction
): Record<string, AnyFunction> {
  const onClose = (serverError?: Error | string): void => {
    log("Channel#close()");

    if (serverError) {
      log("Received Channel#close() with error", serverError);
    }
  };
  const onError = (err: Error | string): void => {
    log("Channel#error()", err);
  };

  const onReturn = (msg: ConsumeMessage): void => {
    log("Channel#return()", msg);
  };

  const onDrain = (): void => {
    log("Channel#drain()");
  };

  const onBlocked = (reason: string): void => {
    log("Channel#blocked()", reason);
  };

  const onUnblocked = (reason: string): void => {
    log("Channel#unblocked()", reason);
  };

  return {
    close: onClose,
    error: onError,
    return: onReturn,
    drain: onDrain,
    blocked: onBlocked,
    unblocked: onUnblocked,
  };
}

export async function connectToBroker(
  url: string
): Promise<amqplib.Connection> {
  log("Connecting to broker %s", url);
  const connection = await amqplib.connect(url);
  log("Connection to broker %s established", url);
  return connection;
}

export function disconnectFromBroker(connection: Connection): Promise<void> {
  log("Disconnecting from broker");
  return connection.close();
}

export async function createChannel(
  connection: amqplib.Connection,
  eventListeners: Record<string, AnyFunction> = {}
): Promise<IConnectionContext> {
  log("Creating new channel");
  const channel = await connection.createChannel();
  log("Channel created");

  const defaultListeners = createDefaultChannelEventListeners(log);

  Object.entries({
    ...defaultListeners,
    ...eventListeners,
  }).forEach(([event, listener]) => {
    channel.on(event, listener);
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
  return async (context): Promise<IConnectionContext> => {
    log("Declaring exchange %s", exchangeName);
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

type AmqpLibOnMessageFn = (msg: ConsumeMessage | null) => any;

export function wrapMessageHandler(
  channel: Channel,
  handleMessage: ConsumeCallback
): AmqpLibOnMessageFn {
  return async (msg): Promise<void> => {
    log("Consumer received a new message '%s'", msg?.content.toString());

    if (msg === null) {
      log(
        "The consumer was cancelled by the server, we should shut down now..."
      );

      // await onCancel();
      return;
    }

    try {
      log("Invoking consumer callback");
      const result = await handleMessage(msg);
      log("Consumer callback invoked, result: %s", result);
    } catch (err) {
      log(
        "Consumer callback failed with error: %s - %s",
        err.name,
        err.message
      );

      throw err;
    } finally {
      channel.ack(msg);
    }

    // if (result === ConsumeResult.ACK) {

    // }
  };
}

/**
 * @param handleMessage The function which will be provided with a legitimate message when one arrives (business logic)
 * @param callbackWrapper The wrapper function which implements the logic around the handleMessage function (infrastructure logic)
 */
export function consume(
  handleMessage: ConsumeCallback,
  callbackWrapper = wrapMessageHandler
): (context: IConnectionContext) => Promise<IConsumerContext> {
  return async (context): Promise<IConsumerContext> => {
    if (!context.queueName) {
      throw new Error("Missing queue name");
    }

    log("Starting consumer on queue %s", context.queueName);

    return {
      ...context,
      consumerTag: (
        await context.channel.consume(
          context.queueName,
          callbackWrapper(context.channel, handleMessage)
        )
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
  context: IConnectionContext,
  message: string
): Promise<IConnectionContext> {
  log("Sending message to queue: %s", message);

  const { channel, queueName } = context;

  if (!queueName) {
    throw new Error("Missing queue name");
  }

  const keepSending = channel.sendToQueue(queueName, Buffer.from(message));

  if (!keepSending) {
    await waitForDrain(channel);
  }

  return context;
}

export async function publish(
  context: IConnectionContext,
  message: string,
  routingKey = ""
): Promise<IConnectionContext> {
  log("Publishing message to an exchange: %s", message);

  if (!context.exchangeName) {
    throw new Error("Missing exchange name");
  }

  const keepSending = await context.channel.publish(
    context.exchangeName,
    routingKey,
    Buffer.from(message)
  );

  if (!keepSending) {
    await waitForDrain(context.channel);
  }

  return context;
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