import { Command } from "commander";
import { debug, Debugger } from "debug";
import { connectToBroker, disconnectFromBroker } from "../../utils/broker";
import { waitForDrain } from "./channel.utils";
import { InputReaderGen, readInputFile } from "../../utils/io";

const logger = debug("amqp-prosumer:producer");

export async function actionProduceExchange(
  exchangeName: string,
  options: Command,
  fnReadInput: InputReaderGen = readInputFile,
  log: Debugger = logger
): Promise<boolean> {
  log("Staring the producer action");

  const { connection, channel } = await connectToBroker(log, options.uri);

  if (options.assert) {
    const exOpts = {
      durable: options.durable,
      autoDelete: options.autoDelete,
    };
    const ex = await channel.assertExchange(exchangeName, "topic", exOpts);
    log("Target exchange %s asserted", ex.exchange);
  }

  // Read input and act for each and every message
  for (const message of fnReadInput()) {
    log("Publishing message to exchange: %s", message);
    const keepSending = await channel.publish(
      exchangeName,
      "",
      Buffer.from(message)
    );

    if (!keepSending) {
      await waitForDrain(channel);
    }
  }

  await disconnectFromBroker(log, { connection, channel });
  log("Produce action executed successfully");

  return true;
}
