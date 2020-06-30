import { Channel } from "amqplib";
import fs from "fs";
import { Command } from "commander";
import { debug, Debugger } from "debug";
import { connectToBroker, disconnectFromBroker } from "./broker";

export type OnMessageFn = (message: string) => Promise<boolean>;
export type InputProvider = (onMessage: OnMessageFn) => Promise<void>;

interface HostOption {
  url: string;
}

interface ExchangeOption {
  name: string;
}

interface QueueOption {
  name: string;
}

export interface ProduceOptions {
  host: HostOption;
  exchange?: ExchangeOption;
  queue?: QueueOption;
}

const logger = debug("amqp-prosumer:producer");

async function readInput(
  onMessage: OnMessageFn,
  log: Debugger = logger
): Promise<void> {
  log("Reading input");

  if (process.stdin.isTTY) {
    throw new Error("No input provided over STDIN");
  }

  const messagesToSend = fs
    .readFileSync(0, "utf-8")
    .split("\n")
    .filter((message) => message !== "");

  for (const message of messagesToSend) {
    log("Publishing message '%s'", message);
    const success = await onMessage(message);
    if (!success) {
      log("ERROR: The message was not published");
    }
  }

  log("Finished reading input");
}

async function publishToExchange(
  channel: Channel,
  exchange: string,
  message: string
): Promise<boolean> {
  return channel.publish(exchange, "", Buffer.from(message));
}

const waitForDrain = async (channel: Channel): Promise<void> =>
  new Promise((resolve) => {
    channel.once("drain", () => {
      resolve();
    });
  });

async function sendToQueue(
  channel: Channel,
  queue: string,
  message: string
): Promise<boolean> {
  return channel.sendToQueue(queue, Buffer.from(message));
}

async function readAndSendToExchange(
  channel: Channel,
  options: ExchangeOption,
  log: debug.Debugger,
  fnReadInput: InputProvider
): Promise<void> {
  const ex = await channel.assertExchange(options.name, "topic");
  log("Target exchange %s asserted", ex.exchange);

  await fnReadInput(async (message: string) => {
    const accepted = await publishToExchange(channel, ex.exchange, message);
    if (!accepted) {
      await waitForDrain(channel);
    }

    return accepted;
  });
}

async function readAndSendToQueue(
  channel: Channel,
  options: QueueOption,
  log: debug.Debugger,
  fnReadInput: InputProvider
): Promise<void> {
  const q = await channel.assertQueue(options.name, {
    durable: false,
    autoDelete: true,
  });
  log("Target queue %s asserted", q.queue);

  await fnReadInput(async (message: string) => {
    const accepted = await sendToQueue(channel, q.queue, message);
    if (!accepted) {
      await waitForDrain(channel);
    }

    return accepted;
  });
}

export async function actionProduce(
  options: ProduceOptions,
  fnReadInput: InputProvider = readInput,
  log: Debugger = logger
): Promise<boolean> {
  log("Staring the producer action");

  const { connection, channel } = await connectToBroker(options.host.url, log);

  if (options.exchange?.name) {
    await readAndSendToExchange(channel, options.exchange, log, fnReadInput);
  } else if (options.queue?.name) {
    await readAndSendToQueue(channel, options.queue, log, fnReadInput);
  }

  await disconnectFromBroker(connection, log);
  log("Produce action executed successfully");

  return true;
}

/**
 * Helper function preparing the options for the produce action
 *
 * @param cmd The original command
 */
export function commandToOptions(cmd: Command): ProduceOptions {
  if (!cmd.exchange && !cmd.queue) {
    throw new Error("Either exchange or queue have to be specified");
  }

  const opts: ProduceOptions = {
    host: {
      url: cmd.host,
    },
  };

  if (cmd.exchange) {
    opts.exchange = {
      name: cmd.exchange,
    };
  }

  if (cmd.queue) {
    opts.queue = {
      name: cmd.queue,
    };
  }

  return opts;
}
