import { Command } from "commander";
import { debug, Debugger } from "debug";
import { createAmqpAdapter } from "../../utils/amqp-adapter";
import { InputReaderGen, readInputFile } from "../../utils/io";

const logger = debug("amqp-prosumer:producer");

export async function actionProduceExchange(
  exchangeName: string,
  options: Command,
  fnReadInput: InputReaderGen = readInputFile,
  log: Debugger = logger
): Promise<boolean> {
  log("Staring the producer action");

  const { publish, disconnect } = await createAmqpAdapter({
    url: options.uri,
    exchange: {
      name: exchangeName,
      durable: options.durable,
      autoDelete: options.autoDelete,
      type: "topic",
    },
  });

  for (const message of fnReadInput()) {
    await publish(message);
  }

  await disconnect();
  log("Produce action executed successfully");

  return true;
}
