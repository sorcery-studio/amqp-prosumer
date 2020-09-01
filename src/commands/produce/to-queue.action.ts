import { Command } from "commander";
import { debug, Debugger } from "debug";
import { createAmqpAdapter } from "../../utils/amqp-adapter";
import { InputReaderGen, readInputFile } from "../../utils/io";

const logger = debug("amqp-prosumer:producer");

export async function actionProduceQueue(
  queueName: string,
  options: Command,
  fnReadInput: InputReaderGen = readInputFile,
  log: Debugger = logger
): Promise<boolean> {
  log("Staring the producer action");

  const { sendToQueue, disconnect } = await createAmqpAdapter({
    url: options.uri,
    assert: options.assert,
    queue: {
      name: queueName,
      durable: options.durable,
      autoDelete: options.autoDelete,
    },
  });

  for (const message of fnReadInput()) {
    await sendToQueue(message);
  }

  await disconnect();

  log("Produce action executed successfully");

  return true;
}
