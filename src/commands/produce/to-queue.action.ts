import { Command } from "commander";
import { debug, Debugger } from "debug";
import { connectToBroker, disconnectFromBroker } from "../../utils/broker";
import { waitForDrain } from "./channel.utils";
import { InputReaderGen, readInputFile } from "../../utils/io";

const logger = debug("amqp-prosumer:producer");

export async function actionProduceQueue(
  queueName: string,
  options: Command,
  fnReadInput: InputReaderGen = readInputFile,
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

  for (const message of fnReadInput()) {
    log("Sending message to queue: %s", message);
    const keepSending = channel.sendToQueue(queueName, Buffer.from(message));

    if (!keepSending) {
      await waitForDrain(channel);
    }
  }

  await disconnectFromBroker(log, { connection, channel });
  log("Produce action executed successfully");

  return true;
}
