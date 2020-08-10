import { Command } from "commander";
import { debug, Debugger } from "debug";
import { connectToBroker, disconnectFromBroker } from "../../utils/broker";
import { waitForDrain } from "./channel.utils";
import { readInput } from "../../utils/io";
import { InputProviderFn } from "./types";

const logger = debug("amqp-prosumer:producer");

export async function actionProduceQueue(
  queueName: string,
  options: Command,
  fnReadInput: InputProviderFn = readInput,
  log: Debugger = logger
): Promise<boolean> {
  log("Staring the producer action");

  const { connection, channel } = await connectToBroker(log, options.uri);

  if (options.assert) {
    const qOpts = {
      durable: options.durable,
      autoDelete: options.autoDelete,
    };
    const q = await channel.assertQueue(queueName, qOpts);
    log("Target queue %s asserted", q.queue);
  }

  fnReadInput(async (message: string) => {
    const keepSending = channel.sendToQueue(queueName, Buffer.from(message));

    if (!keepSending) {
      await waitForDrain(channel);
    }

    return keepSending;
  });

  await disconnectFromBroker(log, { connection, channel });
  log("Produce action executed successfully");

  return true;
}
