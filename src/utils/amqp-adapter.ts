/**
 * This file serves as a "adapter" layer, for FP-like approach and `amqplib` which is more OOP-oriented
 */

import { debug } from "debug";
import * as amqplib from "amqplib";
import {
  Channel,
  ConfirmChannel,
  Connection,
  ConsumeMessage,
  Options,
} from "amqplib";
import { ExchangeType } from "../types";

const log = debug("amqp-prosumer:amqp-adapter");

export enum ConsumeResult {
  ACK,
  RETRY,
  REJECT,
}

export interface IConnectionContext {
  readonly channel: Channel | ConfirmChannel;
  readonly connection: Connection;
  readonly queueName?: string;
  readonly exchangeName?: string;
}

export interface IConsumerContext extends IConnectionContext {
  readonly consumerTag: string;
}

export type AmqpLibConsumeFn = (msg: amqplib.ConsumeMessage | null) => void;

/**
 * Represents a callback function which will be called with the message which got consumed
 *
 * It's expected to return one of the
 *
 * @return {Promise<ConsumeResult>} Consume result which will determine the faith of the message passed to the consumer
 */
export type OnMessageCallback = (msg: ConsumeMessage) => Promise<ConsumeResult>;

type AnyFunction = (...args: any[]) => any;

export function createDefaultChannelEventListeners(
  dbg: AnyFunction = log
): Record<string, AnyFunction> {
  const onClose = (serverError?: Error | string): void => {
    dbg("Channel#close()");

    if (serverError !== undefined) {
      dbg("Received Channel#close() with error", serverError);
    }
  };

  const onError = (err: Error | string): void => {
    dbg("Channel#error()", err);
  };

  const onReturn = (msg: ConsumeMessage): void => {
    dbg("Channel#return()", msg);
  };

  const onDrain = (): void => {
    dbg("Channel#drain()");
  };

  const onBlocked = (reason: string): void => {
    dbg("Channel#blocked()", reason);
  };

  const onUnblocked = (reason: string): void => {
    dbg("Channel#unblocked()", reason);
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

  // Bypassing the issue with Bluebird<void> not being equal to the native Promise<void>
  return connection.close() as unknown as Promise<void>;
}

function attachListeners(
  channel: Channel,
  eventListeners: Record<string, AnyFunction> = {}
): void {
  const defaultListeners = createDefaultChannelEventListeners(log);

  Object.entries({
    ...defaultListeners,
    ...eventListeners,
  }).forEach(([event, listener]) => {
    channel.on(event, listener);
  });
}

export async function createChannel(
  connection: amqplib.Connection,
  eventListeners: Record<string, AnyFunction> = {}
): Promise<IConnectionContext> {
  log("Creating new channel");
  const channel = await connection.createChannel();
  log("Channel created");

  attachListeners(channel, eventListeners);

  return {
    channel,
    connection,
  };
}

export async function createConfirmChannel(
  connection: amqplib.Connection,
  eventListeners: Record<string, AnyFunction> = {}
): Promise<IConnectionContext> {
  log("Creating new channel");
  const channel = await connection.createConfirmChannel();
  log("Channel created");

  attachListeners(channel, eventListeners);

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
 *
 * @returns Function which will assert the queue on the broker (if required), or simply will return the queue name
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
  type: ExchangeType,
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
    if (
      typeof context.queueName !== "string" ||
      typeof context.exchangeName !== "string"
    ) {
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

export function isOfErrorType(err: any): err is Error {
  return (
    err.name !== undefined &&
    err.message !== undefined &&
    err.stack !== undefined
  );
}

export type OnMessageErrorCallback = (err: unknown | Error) => void;

export type OnCancelCallback = () => void;

export type OnDoneCallback = () => void;

export function createConsumerFn(
  channel: Channel,
  onMessage: OnMessageCallback,
  onDone: OnDoneCallback,
  onMessageError: OnMessageErrorCallback,
  onCancel: OnCancelCallback
): AmqpLibConsumeFn {
  return (msg): void => {
    // Wrapping to have the async/await syntax, but still return a valid MessageConsumer function
    // It might make more sense to rewrite this to .then .catch .finally
    log("Consumer received a new message '%s'", msg?.content.toString());

    if (msg === null) {
      log(
        "The consumer was cancelled by the server, we should shut down now..."
      );

      onCancel();

      return;
    }

    log("Invoking consumer callback");

    onMessage(msg)
      .then((result) => {
        log("Consumer callback invoked, result: %s", result);
      })
      .catch((err) => {
        if (isOfErrorType(err)) {
          log(
            "Consumer callback failed with error: %s - %s",
            err.name,
            err.message
          );
        } else {
          log("An error was caught, but it doesn't seem to be a JS error", err);
        }

        onMessageError(err);
      })
      .finally(() => {
        channel.ack(msg);
        onDone();
      });
  };
}

const noop = (): void => {
  return;
};

/**
 * @param onMessage The function which will be provided with a legitimate message when one arrives (business logic)
 * @param onError The callback which will be executed when the onMessage function ends up with an error
 * @param onCancel The callback which will be executed once the broker sends a "cancel consumer" message
 * @param onDone The callback which will be executed once the message is ACK'ed on the broker
 * @param callbackWrapper The wrapper function which implements the logic around the handleMessage function (infrastructure logic)
 */
export function consume(
  onMessage: OnMessageCallback,
  onError: OnMessageErrorCallback = noop,
  onCancel: OnCancelCallback = noop,
  onDone: OnDoneCallback = noop,
  callbackWrapper = createConsumerFn
): (context: IConnectionContext) => Promise<IConsumerContext> {
  return async (context): Promise<IConsumerContext> => {
    if (typeof context.queueName !== "string") {
      throw new Error("Missing queue name");
    }

    log("Starting consumer on queue %s", context.queueName);

    return {
      ...context,
      consumerTag: (
        await context.channel.consume(
          context.queueName,
          callbackWrapper(context.channel, onMessage, onDone, onError, onCancel)
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

export type MessageProduceFn = (
  context: IConnectionContext,
  message: string
) => Promise<IConnectionContext>;

export const sendToQueue: MessageProduceFn = async (
  context: IConnectionContext,
  message: string
): Promise<IConnectionContext> => {
  log("Sending message to queue: %s", message);

  const { channel, queueName } = context;

  if (queueName === undefined) {
    throw new Error("Missing queue name");
  }

  const keepSending = channel.sendToQueue(queueName, Buffer.from(message));

  if (!keepSending) {
    await waitForDrain(channel);
  }

  return context;
};

export const sendToQueueConfirmed: MessageProduceFn = (
  context: IConnectionContext,
  message: string
): Promise<IConnectionContext> => {
  return new Promise((resolve, reject) => {
    log("Sending message to queue: %s", message);

    const { channel, queueName } = context;

    if (queueName === undefined) {
      throw new Error("Missing queue name");
    }

    const confirmCallback = (err?: Error): void => {
      if (err) {
        reject(err);
      } else {
        resolve(context);
      }
    };

    channel.sendToQueue(queueName, Buffer.from(message), {}, confirmCallback);
  });
};

export async function publish(
  context: IConnectionContext,
  message: string,
  routingKey = "",
  options?: Options.Publish
): Promise<IConnectionContext> {
  log("Publishing message to an exchange: %s", message);

  if (context.exchangeName === undefined) {
    throw new Error("Missing exchange name");
  }

  const keepSending = options
    ? await context.channel.publish(
        context.exchangeName,
        routingKey,
        Buffer.from(message),
        options
      )
    : await context.channel.publish(
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
