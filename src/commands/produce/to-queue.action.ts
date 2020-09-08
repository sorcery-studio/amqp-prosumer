import { Command } from "commander";
import { debug, Debugger } from "debug";
import {
  closeChannel,
  connectToBroker,
  createChannel,
  declareQueue,
  disconnectFromBroker,
  IConnectionContext,
  sendToQueue,
} from "../../utils/amqp-adapter";
import { InputReaderGen, readInputFile } from "../../utils/io";

const logger = debug("amqp-prosumer:producer");

export async function actionProduceQueue(
  queueName: string,
  options: Command,
  fnReadInput: InputReaderGen = readInputFile,
  log: Debugger = logger
): Promise<void> {
  log("Staring the producer action");

  // Form of composition

  const queueOptions = {
    durable: options.durable,
    autoDelete: options.autoDelete,
  };

  async function readAndSendInput(
    context: IConnectionContext
  ): Promise<IConnectionContext> {
    if (!context.queueName) {
      throw new Error("Can't send to queue if the the name is not defined");
    }

    // Generators, can't go over this, fnReadInput can be provided from outside!
    for (const message of fnReadInput()) {
      await sendToQueue(context, message);
    }

    return context;
  }

  connectToBroker(options.uri)
    .then(createChannel)
    .then(declareQueue(queueName, queueOptions, options.assert))
    .then(readAndSendInput)
    .then(closeChannel)
    .then(disconnectFromBroker)
    .then(() => log("Produce action executed successfully"))
    .catch((err) => console.error("Something bad happened", err));
}
