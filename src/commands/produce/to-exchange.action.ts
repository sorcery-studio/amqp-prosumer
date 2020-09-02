import { Command } from "commander";
import { debug, Debugger } from "debug";
import { InputReaderGen, readInputFile } from "../../utils/io";
import {
  closeChannel,
  connectToBroker,
  createChannel,
  declareExchange,
  disconnectFromBroker,
  IExchangeContext,
  publish,
} from "../../utils/amqp-adapter";

const logger = debug("amqp-prosumer:producer");

export async function actionProduceExchange(
  exchangeName: string,
  options: Command,
  fnReadInput: InputReaderGen = readInputFile,
  log: Debugger = logger
): Promise<void> {
  log("Staring the producer action");

  const exchangeOptions = {
    durable: options.durable,
    autoDelete: options.autoDelete,
  };

  const readAndSendInput = async (
    context: IExchangeContext
  ): Promise<IExchangeContext> => {
    for (const message of fnReadInput()) {
      await publish(context, message);
    }

    return context;
  };

  connectToBroker(options.uri)
    .then(createChannel)
    .then(
      declareExchange(exchangeName, "topic", exchangeOptions, options.assert)
    )
    .then(readAndSendInput)
    .then(closeChannel)
    .then(disconnectFromBroker)
    .then(() => log("Produce action executed successfully"));
}
